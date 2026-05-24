package com.company.mro.eps.application

import com.company.mro.audit.application.AuditService
import com.company.mro.eps.dto.CreateEquipmentRequest
import com.company.mro.eps.dto.ChangeEquipmentStatusRequest
import com.company.mro.eps.dto.UpdateEquipmentRequest
import com.company.mro.eps.domain.EquipmentStatus
import com.company.mro.eps.persistence.EquipmentEntity
import com.company.mro.eps.persistence.EquipmentRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
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
}
