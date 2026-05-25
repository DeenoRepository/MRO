package com.company.mro.wms.api

import com.company.mro.wms.application.PartService
import com.company.mro.wms.dto.CreatePartRequest
import com.company.mro.wms.dto.PartResponse
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
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

@WebMvcTest(controllers = [PartController::class])
@Import(com.company.mro.core.config.SecurityConfig::class)
class PartControllerSecurityTest {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @MockBean
    private lateinit var partService: PartService

    private fun anyCreatePartRequest(): CreatePartRequest {
        org.mockito.Mockito.any(CreatePartRequest::class.java)
        return CreatePartRequest(partNumber = "", name = "")
    }

    @Test
    fun `viewer cannot create part`() {
        val payload = mapOf(
            "partNumber" to "P-100",
            "name" to "Bearing"
        )

        mockMvc.perform(
            post("/api/v1/wms/parts")
                .with(httpBasic("viewer", "viewer"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload))
        ).andExpect(status().isForbidden)
    }

    @Test
    fun `admin can create part`() {
        val payload = mapOf(
            "partNumber" to "P-100",
            "name" to "Bearing"
        )

        `when`(partService.create(anyCreatePartRequest())).thenReturn(
            PartResponse(
                id = UUID.randomUUID(),
                partNumber = "P-100",
                name = "Bearing",
                description = null,
                unit = "PCS",
                manufacturer = null,
                model = null,
                minStockLevel = BigDecimal.ZERO,
                isActive = true,
                metadata = null,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )

        mockMvc.perform(
            post("/api/v1/wms/parts")
                .with(httpBasic("admin", "admin"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload))
        ).andExpect(status().isCreated)
    }
}
