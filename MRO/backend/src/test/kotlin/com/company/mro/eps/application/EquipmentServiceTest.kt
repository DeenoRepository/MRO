package com.company.mro.eps.application

import com.company.mro.audit.application.AuditService
import com.company.mro.eps.dto.CreateEquipmentRequest
import com.company.mro.eps.dto.ChangeEquipmentStatusRequest
import com.company.mro.eps.dto.DetectEquipmentDuplicateRequest
import com.company.mro.eps.dto.UpdateEquipmentRequest
import com.company.mro.eps.domain.EquipmentStatus
import com.company.mro.eps.persistence.EquipmentEntity
import com.company.mro.eps.persistence.EquipmentOverviewProjection
import com.company.mro.eps.persistence.EquipmentRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.ArgumentCaptor
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.Mockito.verify
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
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

    @Test
    fun `overview returns projection items with filters`() {
        val projection = object : EquipmentOverviewProjection {
            override fun getId(): UUID = UUID.randomUUID()
            override fun getAssetTag(): String = "EQ-OV-1"
            override fun getName(): String = "Overview Pump"
            override fun getCategory(): String = "PUMP"
            override fun getStatus(): EquipmentStatus = EquipmentStatus.ACTIVE
            override fun getLocation(): String = "A1"
            override fun getUpdatedAt(): Instant = Instant.parse("2026-01-01T00:00:00Z")
        }
        whenever(equipmentRepository.findOverview(EquipmentStatus.ACTIVE, "PUMP")).thenReturn(listOf(projection))

        val response = equipmentService.getOverview(EquipmentStatus.ACTIVE, "PUMP", 10)

        assertEquals(1, response.size)
        assertEquals("EQ-OV-1", response.first().assetTag)
    }

    @Test
    fun `overview rejects non positive limit`() {
        val ex = assertThrows(ResponseStatusException::class.java) {
            equipmentService.getOverview(null, null, 0)
        }
        assertEquals(HttpStatus.BAD_REQUEST, ex.statusCode)
    }

    @Test
    fun `registry page returns paged items and metadata`() {
        val first = EquipmentEntity(
            id = UUID.randomUUID(),
            assetTag = "EQ-200",
            name = "Pump 200",
            category = "PUMP",
            status = EquipmentStatus.ACTIVE,
            updatedAt = Instant.now()
        )
        val second = EquipmentEntity(
            id = UUID.randomUUID(),
            assetTag = "EQ-201",
            name = "Pump 201",
            category = "PUMP",
            status = EquipmentStatus.MAINTENANCE,
            updatedAt = Instant.now()
        )
        val pageable = PageRequest.of(1, 2, Sort.by(Sort.Direction.DESC, "name"))
        whenever(
            equipmentRepository.findRegistryPage(
                EquipmentStatus.ACTIVE,
                "PUMP",
                "pump",
                pageable
            )
        ).thenReturn(PageImpl(listOf(first, second), pageable, 5))

        val response = equipmentService.getRegistryPage(
            status = EquipmentStatus.ACTIVE,
            category = "PUMP",
            query = "pump",
            page = 1,
            size = 2,
            sortBy = "name",
            sortDirection = "desc"
        )

        assertEquals(2, response.items.size)
        assertEquals("EQ-200", response.items.first().assetTag)
        assertEquals(1, response.page)
        assertEquals(2, response.size)
        assertEquals(5, response.totalItems)
        assertEquals(3, response.totalPages)
    }

    @Test
    fun `registry page normalizes unknown sort field and null filters`() {
        val pageableCaptor: ArgumentCaptor<org.springframework.data.domain.Pageable> =
            ArgumentCaptor.forClass(org.springframework.data.domain.Pageable::class.java)
        whenever(
            equipmentRepository.findRegistryPage(
                org.mockito.ArgumentMatchers.isNull(),
                org.mockito.ArgumentMatchers.isNull(),
                org.mockito.ArgumentMatchers.isNull(),
                org.mockito.ArgumentMatchers.any(org.springframework.data.domain.Pageable::class.java)
            )
        ).thenReturn(PageImpl(emptyList()))

        equipmentService.getRegistryPage(
            status = null,
            category = "   ",
            query = "   ",
            page = null,
            size = null,
            sortBy = "unknown-field",
            sortDirection = "sideways"
        )

        verify(equipmentRepository).findRegistryPage(
            org.mockito.ArgumentMatchers.isNull(),
            org.mockito.ArgumentMatchers.isNull(),
            org.mockito.ArgumentMatchers.isNull(),
            pageableCaptor.capture()
        )
        val pageable = pageableCaptor.value
        assertEquals(0, pageable.pageNumber)
        assertEquals(20, pageable.pageSize)
        assertEquals("assetTag", pageable.sort.first().property)
        assertEquals(Sort.Direction.ASC, pageable.sort.first().direction)
    }

    @Test
    fun `registry page rejects negative page`() {
        val ex = assertThrows(ResponseStatusException::class.java) {
            equipmentService.getRegistryPage(
                status = null,
                category = null,
                query = null,
                page = -1,
                size = 20,
                sortBy = "assetTag",
                sortDirection = "asc"
            )
        }
        assertEquals(HttpStatus.BAD_REQUEST, ex.statusCode)
    }

    @Test
    fun `registry page rejects non positive size`() {
        val ex = assertThrows(ResponseStatusException::class.java) {
            equipmentService.getRegistryPage(
                status = null,
                category = null,
                query = null,
                page = 0,
                size = 0,
                sortBy = "assetTag",
                sortDirection = "asc"
            )
        }
        assertEquals(HttpStatus.BAD_REQUEST, ex.statusCode)
    }
}
