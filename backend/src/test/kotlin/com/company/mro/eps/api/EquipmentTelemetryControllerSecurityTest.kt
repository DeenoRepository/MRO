package com.company.mro.eps.api

import com.company.mro.eps.application.EquipmentTelemetryService
import com.company.mro.eps.domain.TelemetryMetricType
import com.company.mro.eps.dto.TelemetryPointResponse
import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.any
import org.mockito.Mockito.`when`
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.context.annotation.Import
import org.springframework.http.MediaType
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

@WebMvcTest(controllers = [EquipmentTelemetryController::class])
@Import(com.company.mro.core.config.SecurityConfig::class)
class EquipmentTelemetryControllerSecurityTest {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @MockBean
    private lateinit var telemetryService: EquipmentTelemetryService

    @Test
    fun `viewer cannot ingest telemetry`() {
        val equipmentId = UUID.randomUUID()
        val payload = mapOf(
            "metricType" to "TEMPERATURE",
            "metricValue" to "45.3"
        )

        mockMvc.perform(
            post("/api/v1/eps/equipment/$equipmentId/telemetry")
                .with(httpBasic("viewer", "viewer"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload))
        ).andExpect(status().isForbidden)
    }

    @Test
    fun `admin can ingest telemetry`() {
        val equipmentId = UUID.randomUUID()
        val payload = mapOf(
            "metricType" to "TEMPERATURE",
            "metricValue" to "45.3"
        )
        `when`(telemetryService.ingest(any(), any())).thenReturn(
            TelemetryPointResponse(
                id = UUID.randomUUID(),
                equipmentId = equipmentId,
                metricType = TelemetryMetricType.TEMPERATURE,
                metricValue = BigDecimal("45.3"),
                unit = null,
                recordedAt = Instant.now(),
                source = null,
                createdAt = Instant.now()
            )
        )

        mockMvc.perform(
            post("/api/v1/eps/equipment/$equipmentId/telemetry")
                .with(httpBasic("admin", "admin"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload))
        ).andExpect(status().isCreated)
    }
}
