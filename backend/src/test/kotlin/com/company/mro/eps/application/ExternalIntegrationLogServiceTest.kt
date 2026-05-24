package com.company.mro.eps.application

import com.company.mro.audit.application.AuditService
import com.company.mro.eps.dto.CreateExternalIntegrationLogRequest
import com.company.mro.eps.persistence.ExternalIntegrationLogRepository
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
import java.util.UUID
import org.mockito.Mockito.`when` as whenever

@ExtendWith(MockitoExtension::class)
class ExternalIntegrationLogServiceTest {
    @Mock
    private lateinit var integrationLogRepository: ExternalIntegrationLogRepository

    @Mock
    private lateinit var equipmentRepository: EquipmentRepository

    @Mock
    private lateinit var auditService: AuditService

    @InjectMocks
    private lateinit var service: ExternalIntegrationLogService

    @Test
    fun `create fails when equipment does not exist`() {
        val equipmentId = UUID.randomUUID()
        whenever(equipmentRepository.existsById(equipmentId)).thenReturn(false)
        val request = CreateExternalIntegrationLogRequest(
            integrationName = "ERP",
            direction = "OUTBOUND",
            operation = "EQUIPMENT_SYNC",
            equipmentId = equipmentId,
            status = "FAILED"
        )

        val ex = assertThrows(ResponseStatusException::class.java) { service.create(request) }
        assertEquals(HttpStatus.BAD_REQUEST, ex.statusCode)
    }

    @Test
    fun `create normalizes integration fields`() {
        whenever(integrationLogRepository.save(any())).thenAnswer { it.arguments[0] }
        val request = CreateExternalIntegrationLogRequest(
            integrationName = "erp",
            direction = "outbound",
            operation = "equipment_sync",
            equipmentId = null,
            status = "ok"
        )

        val response = service.create(request)

        assertEquals("ERP", response.integrationName)
        assertEquals("OUTBOUND", response.direction)
        assertEquals("EQUIPMENT_SYNC", response.operation)
        assertEquals("OK", response.status)
    }
}
