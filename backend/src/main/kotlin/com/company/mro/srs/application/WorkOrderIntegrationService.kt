package com.company.mro.srs.application

import com.company.mro.audit.application.AuditService
import com.company.mro.mms.application.WorkOrderCommandService
import com.company.mro.srs.persistence.TicketRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.Instant
import java.util.UUID

@Service
class WorkOrderIntegrationService(
    private val ticketRepository: TicketRepository,
    private val workOrderCommandService: WorkOrderCommandService,
    private val auditService: AuditService
) {
    @Transactional
    fun createWorkOrderFromTicket(
        ticketId: UUID,
        equipmentId: UUID,
        priority: String,
        description: String
    ): UUID {
        val ticket = ticketRepository.findById(ticketId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found") }

        if (ticket.linkedWorkOrderId != null) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Ticket already has a linked work order")
        }

        // Call MMS command service to create the work order
        val workOrderId = workOrderCommandService.createFromTicket(
            ticketId = ticketId,
            equipmentId = equipmentId,
            description = description.trim(),
            priority = priority.trim().uppercase()
        )

        // Link work order to ticket
        ticket.linkedWorkOrderId = workOrderId
        ticket.workOrderId = workOrderId // DB backwards compatibility
        ticket.updatedAt = Instant.now()
        ticketRepository.save(ticket)

        auditService.log("SRS_WORK_ORDER_CREATED_FROM_TICKET", "SRS", "ticket", ticketId.toString())
        return workOrderId
    }
}
