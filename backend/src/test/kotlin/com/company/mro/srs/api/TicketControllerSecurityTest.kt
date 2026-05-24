package com.company.mro.srs.api

import com.company.mro.srs.application.TicketService
import com.company.mro.srs.application.TicketCommentService
import com.company.mro.srs.application.TicketAttachmentService
import com.company.mro.srs.application.WorkOrderIntegrationService
import com.company.mro.srs.domain.TicketStatus
import com.company.mro.srs.dto.CreateTicketRequest
import com.company.mro.srs.dto.TicketResponse
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

@WebMvcTest(controllers = [TicketController::class])
@Import(com.company.mro.core.config.SecurityConfig::class, com.company.mro.core.api.GlobalExceptionHandler::class)
class TicketControllerSecurityTest {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @MockBean
    private lateinit var ticketService: TicketService

    @MockBean
    private lateinit var ticketCommentService: TicketCommentService

    @MockBean
    private lateinit var ticketAttachmentService: TicketAttachmentService

    @MockBean
    private lateinit var workOrderIntegrationService: WorkOrderIntegrationService

    private fun anyCreateTicketRequest(): CreateTicketRequest {
        org.mockito.Mockito.any(CreateTicketRequest::class.java)
        return CreateTicketRequest(title = "")
    }

    @Test
    fun `viewer cannot create ticket`() {
        val payload = CreateTicketRequest(
            title = "Machine issue"
        )
        mockMvc.perform(
            post("/api/v1/srs/tickets")
                .with(httpBasic("viewer", "viewer"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload))
        ).andExpect(status().isForbidden)
    }

    @Test
    fun `admin can create ticket`() {
        val payload = CreateTicketRequest(
            title = "Machine issue"
        )
        `when`(ticketService.create(anyCreateTicketRequest(), any())).thenReturn(
            TicketResponse(
                id = UUID.randomUUID(),
                ticketNumber = "TKT-1001",
                requestTypeId = null,
                requesterId = null,
                assigneeId = null,
                equipmentId = null,
                workOrderId = null,
                linkedWorkOrderId = null,
                title = "Machine issue",
                description = null,
                priority = "MEDIUM",
                status = TicketStatus.OPEN,
                openedAt = Instant.now(),
                assignedAt = null,
                resolvedAt = null,
                closedAt = null,
                dueAt = null,
                createdBy = null,
                updatedBy = null,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        mockMvc.perform(
            post("/api/v1/srs/tickets")
                .with(httpBasic("admin", "admin"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload))
        ).andExpect(status().isCreated)
    }
}

