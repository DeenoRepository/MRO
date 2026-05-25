package com.company.mro.eps.api

import com.company.mro.eps.application.ExternalIntegrationLogService
import com.company.mro.eps.dto.ExternalIntegrationLogResponse
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
import java.time.Instant
import java.util.UUID

@WebMvcTest(controllers = [ExternalIntegrationLogController::class])
@Import(com.company.mro.core.config.SecurityConfig::class)
class ExternalIntegrationLogControllerSecurityTest {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @MockBean
    private lateinit var integrationLogService: ExternalIntegrationLogService

    @Test
    fun `viewer cannot create integration log`() {
        val payload = mapOf(
            "integrationName" to "ERP",
            "direction" to "OUTBOUND",
            "operation" to "EQUIPMENT_SYNC",
            "status" to "OK"
        )
        mockMvc.perform(
            post("/api/v1/eps/integrations/logs")
                .with(httpBasic("viewer", "viewer"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload))
        ).andExpect(status().isForbidden)
    }

    @Test
    fun `admin can create integration log`() {
        val payload = mapOf(
            "integrationName" to "ERP",
            "direction" to "OUTBOUND",
            "operation" to "EQUIPMENT_SYNC",
            "status" to "OK"
        )
        `when`(integrationLogService.create(any())).thenReturn(
            ExternalIntegrationLogResponse(
                id = UUID.randomUUID(),
                integrationName = "ERP",
                direction = "OUTBOUND",
                operation = "EQUIPMENT_SYNC",
                equipmentId = null,
                requestPayload = null,
                responsePayload = null,
                statusCode = 200,
                status = "OK",
                errorMessage = null,
                createdAt = Instant.now()
            )
        )
        mockMvc.perform(
            post("/api/v1/eps/integrations/logs")
                .with(httpBasic("admin", "admin"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload))
        ).andExpect(status().isCreated)
    }
}
