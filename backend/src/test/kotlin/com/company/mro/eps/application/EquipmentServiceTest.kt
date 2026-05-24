package com.company.mro.eps.application

import com.company.mro.audit.application.AuditService
import com.company.mro.eps.dto.CreateEquipmentRequest
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
}
