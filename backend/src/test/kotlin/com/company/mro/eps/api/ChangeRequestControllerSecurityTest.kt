package com.company.mro.eps.api

import com.company.mro.eps.application.ChangeRequestService
import com.company.mro.eps.domain.ChangeRequestStatus
import com.company.mro.eps.dto.ChangeRequestResponse
import com.company.mro.eps.dto.CreateChangeRequest
import com.company.mro.eps.dto.DecideChangeRequest
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
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.time.Instant
import java.util.UUID

@WebMvcTest(controllers = [ChangeRequestController::class])
@Import(com.company.mro.core.config.SecurityConfig::class)
class ChangeRequestControllerSecurityTest {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @MockBean
    private lateinit var changeRequestService: ChangeRequestService

    @Test
    fun `viewer can list change requests`() {
        `when`(changeRequestService.getAll()).thenReturn(emptyList())

        mockMvc.perform(
            get("/api/v1/eps/change-requests")
                .with(httpBasic("viewer", "viewer"))
        ).andExpect(status().isOk)
    }

    @Test
    fun `viewer cannot submit change request`() {
        val payload = CreateChangeRequest(
            entityType = "EQUIPMENT",
            changeType = "CREATE",
            proposedData = "{}"
        )

        mockMvc.perform(
            post("/api/v1/eps/change-requests")
                .with(httpBasic("viewer", "viewer"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload))
        ).andExpect(status().isForbidden)
    }

    @Test
    fun `admin can submit change request`() {
        val payload = CreateChangeRequest(
            entityType = "EQUIPMENT",
            changeType = "CREATE",
            proposedData = "{}"
        )
        val response = ChangeRequestResponse(
            id = UUID.randomUUID(),
            entityType = "EQUIPMENT",
            entityId = null,
            changeType = "CREATE",
            proposedData = "{}",
            status = ChangeRequestStatus.PENDING,
            requestedBy = null,
            approvedBy = null,
            approvalNotes = null,
            createdAt = Instant.now(),
            decidedAt = null
        )

        `when`(changeRequestService.createChangeRequest(any())).thenReturn(response)

        mockMvc.perform(
            post("/api/v1/eps/change-requests")
                .with(httpBasic("admin", "admin"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload))
        ).andExpect(status().isCreated)
    }

    @Test
    fun `viewer cannot approve change request`() {
        val decision = DecideChangeRequest(approvalNotes = "Good")
        val reqId = UUID.randomUUID()

        mockMvc.perform(
            post("/api/v1/eps/change-requests/$reqId/approve")
                .with(httpBasic("viewer", "viewer"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(decision))
        ).andExpect(status().isForbidden)
    }

    @Test
    fun `admin can approve change request`() {
        val decision = DecideChangeRequest(approvalNotes = "Approved")
        val reqId = UUID.randomUUID()
        val response = ChangeRequestResponse(
            id = reqId,
            entityType = "EQUIPMENT",
            entityId = UUID.randomUUID(),
            changeType = "CREATE",
            proposedData = "{}",
            status = ChangeRequestStatus.APPROVED,
            requestedBy = null,
            approvedBy = null,
            approvalNotes = "Approved",
            createdAt = Instant.now(),
            decidedAt = Instant.now()
        )

        `when`(changeRequestService.approve(any(), any())).thenReturn(response)

        mockMvc.perform(
            post("/api/v1/eps/change-requests/$reqId/approve")
                .with(httpBasic("admin", "admin"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(decision))
        ).andExpect(status().isOk)
    }
}
