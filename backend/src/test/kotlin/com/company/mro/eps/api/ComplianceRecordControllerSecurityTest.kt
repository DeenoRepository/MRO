package com.company.mro.eps.api

import com.company.mro.eps.application.ComplianceRecordService
import com.company.mro.eps.domain.ComplianceRecordStatus
import com.company.mro.eps.dto.ComplianceRecordResponse
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
import java.time.LocalDate
import java.util.UUID

@WebMvcTest(controllers = [ComplianceRecordController::class])
@Import(com.company.mro.core.config.SecurityConfig::class)
class ComplianceRecordControllerSecurityTest {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @MockBean
    private lateinit var complianceRecordService: ComplianceRecordService

    @Test
    fun `viewer cannot create compliance record`() {
        val equipmentId = UUID.randomUUID()
        val payload = mapOf(
            "recordType" to "CERTIFICATE",
            "title" to "Electrical Certificate",
            "validUntil" to LocalDate.now().plusDays(10).toString()
        )

        mockMvc.perform(
            post("/api/v1/eps/compliance/equipment/$equipmentId/records")
                .with(httpBasic("viewer", "viewer"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload))
        ).andExpect(status().isForbidden)
    }

    @Test
    fun `admin can create compliance record`() {
        val equipmentId = UUID.randomUUID()
        val payload = mapOf(
            "recordType" to "CERTIFICATE",
            "title" to "Pressure Certificate",
            "validUntil" to LocalDate.now().plusDays(15).toString()
        )
        `when`(complianceRecordService.create(any(), any())).thenReturn(
            ComplianceRecordResponse(
                id = UUID.randomUUID(),
                equipmentId = equipmentId,
                recordType = "CERTIFICATE",
                title = "Pressure Certificate",
                validFrom = null,
                validUntil = LocalDate.now().plusDays(15),
                status = ComplianceRecordStatus.EXPIRING,
                notes = null,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )

        mockMvc.perform(
            post("/api/v1/eps/compliance/equipment/$equipmentId/records")
                .with(httpBasic("admin", "admin"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload))
        ).andExpect(status().isCreated)
    }
}
