package com.company.mro.mms.api

import com.company.mro.mms.application.PmScheduleService
import com.company.mro.mms.dto.CreatePmScheduleRequest
import com.company.mro.mms.dto.PmScheduleResponse
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
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@WebMvcTest(controllers = [PmScheduleController::class])
@Import(com.company.mro.core.config.SecurityConfig::class)
class PmScheduleControllerSecurityTest {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @MockBean
    private lateinit var pmScheduleService: PmScheduleService

    private fun anyCreatePmScheduleRequest(): CreatePmScheduleRequest {
        org.mockito.Mockito.any(CreatePmScheduleRequest::class.java)
        return CreatePmScheduleRequest(UUID.randomUUID(), "", frequencyType = "", frequencyValue = 1, nextDueDate = LocalDate.now())
    }

    @Test
    fun `viewer cannot create pm schedule`() {
        val payload = mapOf(
            "equipmentId" to UUID.randomUUID(),
            "name" to "Monthly inspection",
            "frequencyType" to "MONTHS",
            "frequencyValue" to 1,
            "nextDueDate" to "2026-06-01"
        )

        mockMvc.perform(
            post("/api/v1/mms/pm-schedules")
                .with(httpBasic("viewer", "viewer"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload))
        ).andExpect(status().isForbidden)
    }

    @Test
    fun `admin can create pm schedule`() {
        val equipmentId = UUID.randomUUID()
        val payload = mapOf(
            "equipmentId" to equipmentId,
            "name" to "Monthly inspection",
            "frequencyType" to "MONTHS",
            "frequencyValue" to 1,
            "nextDueDate" to "2026-06-01"
        )

        `when`(pmScheduleService.create(anyCreatePmScheduleRequest())).thenReturn(
            PmScheduleResponse(
                id = UUID.randomUUID(),
                equipmentId = equipmentId,
                name = "Monthly inspection",
                description = null,
                frequencyType = "MONTHS",
                frequencyValue = 1,
                nextDueDate = LocalDate.parse("2026-06-01"),
                lastGeneratedDate = null,
                isActive = true,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )

        mockMvc.perform(
            post("/api/v1/mms/pm-schedules")
                .with(httpBasic("admin", "admin"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload))
        ).andExpect(status().isCreated)
    }
}
