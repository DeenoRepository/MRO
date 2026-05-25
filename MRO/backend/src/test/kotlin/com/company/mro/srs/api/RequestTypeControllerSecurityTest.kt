package com.company.mro.srs.api

import com.company.mro.srs.application.RequestTypeService
import com.company.mro.srs.dto.CreateRequestTypeRequest
import com.company.mro.srs.dto.RequestTypeResponse
import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.api.Test
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
import java.util.UUID

@WebMvcTest(controllers = [RequestTypeController::class])
@Import(com.company.mro.core.config.SecurityConfig::class)
class RequestTypeControllerSecurityTest {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @MockBean
    private lateinit var requestTypeService: RequestTypeService

    private fun anyCreateRequestTypeRequest(): CreateRequestTypeRequest {
        org.mockito.Mockito.any(CreateRequestTypeRequest::class.java)
        return CreateRequestTypeRequest(code = "", name = "")
    }

    @Test
    fun `viewer cannot create request type`() {
        val payload = mapOf(
            "code" to "INCIDENT",
            "name" to "Incident",
            "defaultPriority" to "MEDIUM",
            "slaHours" to 24
        )

        mockMvc.perform(
            post("/api/v1/srs/request-types")
                .with(httpBasic("viewer", "viewer"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload))
        ).andExpect(status().isForbidden)
    }

    @Test
    fun `admin can create request type`() {
        val payload = mapOf(
            "code" to "INCIDENT",
            "name" to "Incident",
            "defaultPriority" to "MEDIUM",
            "slaHours" to 24
        )

        `when`(requestTypeService.create(anyCreateRequestTypeRequest())).thenReturn(
            RequestTypeResponse(
                id = UUID.randomUUID(),
                code = "INCIDENT",
                name = "Incident",
                description = null,
                defaultPriority = "MEDIUM",
                slaHours = null,
                isActive = true
            )
        )

        mockMvc.perform(
            post("/api/v1/srs/request-types")
                .with(httpBasic("admin", "admin"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload))
        ).andExpect(status().isCreated)
    }
}
