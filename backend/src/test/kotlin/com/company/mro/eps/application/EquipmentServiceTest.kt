package com.company.mro.eps.application

import com.company.mro.audit.application.AuditService
import com.company.mro.eps.dto.CreateEquipmentRequest
import com.company.mro.eps.dto.ChangeEquipmentStatusRequest
import com.company.mro.eps.dto.DetectEquipmentDuplicateRequest
import com.company.mro.eps.dto.UpdateEquipmentRequest
import com.company.mro.eps.domain.EquipmentStatus
import com.company.mro.eps.persistence.EquipmentEntity
import com.company.mro.eps.persistence.EquipmentRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.http.HttpStatus
import org.springframework.web.server.ResponseStatusException
import java.time.LocalDate
import java.time.Instant
import java.util.Optional
import java.util.UUID
import org.mockito.Mockito.`when` as whenever

@ExtendWith(MockitoExtension::class)
class EquipmentServiceTest {
    @Mock
    private lateinit var equipmentRepository: EquipmentRepository

    @Mock
    private lateinit var equipmentCategoryService: EquipmentCategoryService

    @Mock
    private lateinit var auditService: AuditService

    @InjectMocks
    private lateinit var equipmentService: EquipmentService

    @Test
    fun `create fails when category is missing or inactive`() {
        val request = CreateEquipmentRequest(
            assetTag = "AST-1",
            name = "Pump",
            category = "PUMP",
            location = "A1",
            manufacturer = "ACME",
            model = "P-100",
            serialNumber = "SN1",
            installDate = LocalDate.now()
        )
        whenever(equipmentRepository.existsByAssetTag("AST-1")).thenReturn(false)
        whenever(equipmentCategoryService.ensureActiveCategoryExists("PUMP"))
            .thenThrow(ResponseStatusException(HttpStatus.BAD_REQUEST, "Referenced equipment category not found or inactive"))

        val ex = assertThrows(ResponseStatusException::class.java) {
            equipmentService.create(request)
        }

        assertEquals(HttpStatus.BAD_REQUEST, ex.statusCode)
    }

    @Test
    fun `update fails when parent equals self`() {
        val id = UUID.randomUUID()
        val entity = EquipmentEntity(
            id = id,
            assetTag = "AST-1",
            name = "Pump",
            category = "PUMP",
            status = EquipmentStatus.ACTIVE,
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )
        whenever(equipmentRepository.findById(id)).thenReturn(Optional.of(entity))

        val request = UpdateEquipmentRequest(
            name = "Pump",
            category = "PUMP",
            parentEquipmentId = id
        )

        val ex = assertThrows(ResponseStatusException::class.java) {
            equipmentService.update(id, request)
        }

        assertEquals(HttpStatus.BAD_REQUEST, ex.statusCode)
    }

    @Test
    fun `qr payload returns equipment quick action links`() {
        val id = UUID.randomUUID()
        val entity = EquipmentEntity(
            id = id,
            assetTag = "AST-1",
            name = "Pump",
            category = "PUMP",
            status = EquipmentStatus.ACTIVE,
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )
        whenever(equipmentRepository.findById(id)).thenReturn(Optional.of(entity))

        val response = equipmentService.getQrPayload(id)

        assertEquals(id, response.equipmentId)
        assertEquals("/eps/equipment/$id", response.equipmentUrl)
    }

    @Test
    fun `status transition active to maintenance is allowed`() {
        val id = UUID.randomUUID()
        val entity = EquipmentEntity(
            id = id,
            assetTag = "AST-2",
            name = "Compressor",
            category = "COMPRESSOR",
            status = EquipmentStatus.ACTIVE,
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )
        whenever(equipmentRepository.findById(id)).thenReturn(Optional.of(entity))
        whenever(equipmentRepository.save(entity)).thenReturn(entity)

        val response = equipmentService.transitionStatus(id, ChangeEquipmentStatusRequest(EquipmentStatus.MAINTENANCE))

        assertEquals(EquipmentStatus.MAINTENANCE, response.status)
    }

    @Test
    fun `status transition planned to active is rejected`() {
        val id = UUID.randomUUID()
        val entity = EquipmentEntity(
            id = id,
            assetTag = "AST-3",
            name = "Boiler",
            category = "BOILER",
            status = EquipmentStatus.PLANNED,
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )
        whenever(equipmentRepository.findById(id)).thenReturn(Optional.of(entity))

        val ex = assertThrows(ResponseStatusException::class.java) {
            equipmentService.transitionStatus(id, ChangeEquipmentStatusRequest(EquipmentStatus.ACTIVE))
        }

        assertEquals(HttpStatus.BAD_REQUEST, ex.statusCode)
    }

    @Test
    fun `mobile list returns next offset when more data exists`() {
        val items = (1..3).map { i ->
            EquipmentEntity(
                id = UUID.randomUUID(),
                assetTag = "AST-$i",
                name = "Equipment $i",
                category = "PUMP",
                status = EquipmentStatus.ACTIVE,
                updatedAt = Instant.now().plusSeconds(i.toLong())
            )
        }
        whenever(equipmentRepository.findAll()).thenReturn(items)

        val response = equipmentService.getMobileList(limit = 2, offset = 0)

        assertEquals(2, response.items.size)
        assertEquals(2, response.nextOffset)
    }

    @Test
    fun `mobile list rejects negative offset`() {
        val ex = assertThrows(ResponseStatusException::class.java) {
            equipmentService.getMobileList(limit = 10, offset = -1)
        }
        assertEquals(HttpStatus.BAD_REQUEST, ex.statusCode)
    }

    @Test
    fun `search ranks exact asset tag higher than name contains`() {
        val exact = EquipmentEntity(
            id = UUID.randomUUID(),
            assetTag = "PMP-100",
            name = "Booster",
            category = "PUMP",
            status = EquipmentStatus.ACTIVE,
            updatedAt = Instant.now()
        )
        val contains = EquipmentEntity(
            id = UUID.randomUUID(),
            assetTag = "AST-2",
            name = "Pump PMP-100 Auxiliary",
            category = "PUMP",
            status = EquipmentStatus.ACTIVE,
            updatedAt = Instant.now()
        )
        whenever(equipmentRepository.findAll()).thenReturn(listOf(contains, exact))

        val response = equipmentService.search("PMP-100", 10)

        assertEquals(exact.id, response.first().id)
        assertTrue(response.first().relevanceScore >= response.last().relevanceScore)
    }

    @Test
    fun `search rejects too short query`() {
        val ex = assertThrows(ResponseStatusException::class.java) {
            equipmentService.search("a", 10)
        }
        assertEquals(HttpStatus.BAD_REQUEST, ex.statusCode)
    }

    @Test
    fun `duplicate detection returns exact asset tag candidate first`() {
        val exact = EquipmentEntity(
            id = UUID.randomUUID(),
            assetTag = "EQ-100",
            name = "Main Pump",
            category = "PUMP",
            status = EquipmentStatus.ACTIVE,
            serialNumber = "SN-100",
            updatedAt = Instant.now()
        )
        val partial = EquipmentEntity(
            id = UUID.randomUUID(),
            assetTag = "EQ-100-AUX",
            name = "Aux Pump",
            category = "PUMP",
            status = EquipmentStatus.ACTIVE,
            serialNumber = "SN-101",
            updatedAt = Instant.now()
        )
        whenever(equipmentRepository.findAll()).thenReturn(listOf(partial, exact))

        val response = equipmentService.detectDuplicates(
            DetectEquipmentDuplicateRequest(
                assetTag = "EQ-100",
                name = "Main Pump",
                serialNumber = "SN-100"
            ),
            10
        )

        assertEquals(exact.id, response.first().id)
        assertTrue(response.first().duplicateScore >= response.last().duplicateScore)
    }

    @Test
    fun `duplicate detection rejects non positive limit`() {
        val ex = assertThrows(ResponseStatusException::class.java) {
            equipmentService.detectDuplicates(
                DetectEquipmentDuplicateRequest(assetTag = "EQ-1", name = "Pump"),
                0
            )
        }
        assertEquals(HttpStatus.BAD_REQUEST, ex.statusCode)
    }
}
