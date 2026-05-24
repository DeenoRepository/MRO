package com.company.mro.eps.api

import com.company.mro.eps.application.EquipmentService
import com.company.mro.eps.domain.EquipmentStatus
import com.company.mro.eps.dto.EquipmentResponse
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

@WebMvcTest(controllers = [EquipmentController::class])
@Import(com.company.mro.core.config.SecurityConfig::class)
class EquipmentControllerSecurityTest {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @MockBean
    private lateinit var equipmentService: EquipmentService

    @Test
    fun `viewer cannot create equipment`() {
        val payload = mapOf(
            "assetTag" to "EQ-1000",
            "name" to "Pump A",
            "category" to "PUMP"
        )

        mockMvc.perform(
            post("/api/v1/eps/equipment")
                .with(httpBasic("viewer", "viewer"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload))
        ).andExpect(status().isForbidden)
    }

    @Test
    fun `admin can create equipment`() {
        val payload = mapOf(
            "assetTag" to "EQ-1001",
            "name" to "Pump B",
            "category" to "PUMP"
        )

        `when`(equipmentService.create(any())).thenReturn(
            EquipmentResponse(
                id = UUID.randomUUID(),
                assetTag = "EQ-1001",
                name = "Pump B",
                category = "PUMP",
                status = EquipmentStatus.ACTIVE,
                location = null,
                manufacturer = null,
                model = null,
                serialNumber = null,
                installDate = null,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )

        mockMvc.perform(
            post("/api/v1/eps/equipment")
                .with(httpBasic("admin", "admin"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload))
        ).andExpect(status().isCreated)
    }
}

