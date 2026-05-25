package com.company.mro.eps.application

import com.company.mro.audit.application.AuditService
import com.company.mro.eps.dto.CreateComplianceRecordRequest
import com.company.mro.eps.persistence.ComplianceRecordRepository
import com.company.mro.eps.persistence.EquipmentRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.ArgumentMatchers.any
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.http.HttpStatus
import org.springframework.web.server.ResponseStatusException
import java.time.LocalDate
import java.util.UUID
import org.mockito.Mockito.`when` as whenever

@ExtendWith(MockitoExtension::class)
class ComplianceRecordServiceTest {
    @Mock
    private lateinit var equipmentRepository: EquipmentRepository

    @Mock
    private lateinit var complianceRecordRepository: ComplianceRecordRepository

    @Mock
    private lateinit var auditService: AuditService

    @InjectMocks
    private lateinit var service: ComplianceRecordService

    @Test
    fun `create fails when validFrom is after validUntil`() {
        val equipmentId = UUID.randomUUID()
        whenever(equipmentRepository.existsById(equipmentId)).thenReturn(true)
        val request = CreateComplianceRecordRequest(
            recordType = "CERTIFICATE",
            title = "Certificate A",
            validFrom = LocalDate.now().plusDays(5),
            validUntil = LocalDate.now().plusDays(1),
            notes = null
        )

        val ex = assertThrows(ResponseStatusException::class.java) {
            service.create(equipmentId, request)
        }

        assertEquals(HttpStatus.BAD_REQUEST, ex.statusCode)
    }

    @Test
    fun `create normalizes record type`() {
        val equipmentId = UUID.randomUUID()
        whenever(equipmentRepository.existsById(equipmentId)).thenReturn(true)
        whenever(complianceRecordRepository.save(any())).thenAnswer { it.arguments[0] }
        val request = CreateComplianceRecordRequest(
            recordType = "certificate",
            title = "Certificate B",
            validFrom = LocalDate.now(),
            validUntil = LocalDate.now().plusDays(90),
            notes = "ok"
        )

        val response = service.create(equipmentId, request)

        assertEquals("CERTIFICATE", response.recordType)
    }
}
