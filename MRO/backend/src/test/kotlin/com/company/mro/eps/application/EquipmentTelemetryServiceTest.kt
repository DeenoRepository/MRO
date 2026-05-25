package com.company.mro.eps.application

import com.company.mro.audit.application.AuditService
import com.company.mro.eps.domain.TelemetryMetricType
import com.company.mro.eps.dto.IngestTelemetryRequest
import com.company.mro.eps.persistence.EquipmentRepository
import com.company.mro.eps.persistence.EquipmentTelemetryRepository
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
import java.math.BigDecimal
import java.util.UUID
import org.mockito.Mockito.`when` as whenever

@ExtendWith(MockitoExtension::class)
class EquipmentTelemetryServiceTest {
    @Mock
    private lateinit var equipmentRepository: EquipmentRepository

    @Mock
    private lateinit var telemetryRepository: EquipmentTelemetryRepository

    @Mock
    private lateinit var auditService: AuditService

    @InjectMocks
    private lateinit var service: EquipmentTelemetryService

    @Test
    fun `ingest fails when equipment does not exist`() {
        val id = UUID.randomUUID()
        whenever(equipmentRepository.existsById(id)).thenReturn(false)

        val ex = assertThrows(ResponseStatusException::class.java) {
            service.ingest(
                id,
                IngestTelemetryRequest(
                    metricType = TelemetryMetricType.TEMPERATURE,
                    metricValue = BigDecimal("80.2")
                )
            )
        }

        assertEquals(HttpStatus.NOT_FOUND, ex.statusCode)
    }

    @Test
    fun `ingest accepts runtime hours metric`() {
        val id = UUID.randomUUID()
        whenever(equipmentRepository.existsById(id)).thenReturn(true)
        whenever(telemetryRepository.save(any())).thenAnswer { it.arguments[0] }

        val response = service.ingest(
            id,
            IngestTelemetryRequest(
                metricType = TelemetryMetricType.RUNTIME_HOURS,
                metricValue = BigDecimal("123.5"),
                unit = "h"
            )
        )

        assertEquals(TelemetryMetricType.RUNTIME_HOURS, response.metricType)
        assertEquals(BigDecimal("123.5"), response.metricValue)
    }
}
