package com.company.mro.srs.application

import com.company.mro.audit.application.AuditService
import com.company.mro.eps.application.EquipmentLookupService
import com.company.mro.mms.application.WorkOrderCommandService
import com.company.mro.srs.domain.TicketStatus
import com.company.mro.srs.dto.AddTicketCommentRequest
import com.company.mro.srs.dto.AssignTicketRequest
import com.company.mro.srs.dto.CreateTicketRequest
import com.company.mro.srs.dto.TicketCommentResponse
import com.company.mro.srs.dto.TicketResponse
import com.company.mro.srs.persistence.TicketCommentEntity
import com.company.mro.srs.persistence.TicketCommentRepository
import com.company.mro.srs.persistence.TicketEntity
import com.company.mro.srs.persistence.TicketRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.Instant
import java.util.UUID

@Service
class TicketService(
    private val ticketRepository: TicketRepository,
    private val ticketCommentRepository: TicketCommentRepository,
    private val equipmentLookupService: EquipmentLookupService,
    private val workOrderCommandService: WorkOrderCommandService,
    private val auditService: AuditService
) {
    @Transactional(readOnly = true)
    fun getAll(): List<TicketResponse> = ticketRepository.findAll().map { it.toResponse() }

    @Transactional(readOnly = true)
    fun getById(id: UUID): TicketResponse = findTicket(id).toResponse()

    @Transactional
    fun create(request: CreateTicketRequest): TicketResponse {
        if (ticketRepository.existsByTicketNumber(request.ticketNumber.trim())) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "Ticket number already exists")
        }
        if (request.equipmentId != null && !equipmentLookupService.existsById(request.equipmentId)) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Referenced equipment not found")
        }
        val now = Instant.now()
        val saved = ticketRepository.save(
            TicketEntity(
                id = UUID.randomUUID(),
                ticketNumber = request.ticketNumber.trim().uppercase(),
                equipmentId = request.equipmentId,
                title = request.title.trim(),
                description = request.description?.trim(),
                priority = request.priority?.trim()?.uppercase() ?: "MEDIUM",
                status = TicketStatus.OPEN,
                createdAt = now,
                updatedAt = now
            )
        )
        auditService.log("TICKET_CREATED", "SRS", "ticket", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun assign(id: UUID, request: AssignTicketRequest): TicketResponse {
        val ticket = findTicket(id)
        if (ticket.status != TicketStatus.OPEN) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Only OPEN tickets can be assigned")
        }
        ticket.assigneeId = request.assigneeId
        ticket.status = TicketStatus.ASSIGNED
        ticket.updatedAt = Instant.now()
        val saved = ticketRepository.save(ticket)
        auditService.log("TICKET_ASSIGNED", "SRS", "ticket", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun resolve(id: UUID): TicketResponse {
        val ticket = findTicket(id)
        if (ticket.status != TicketStatus.ASSIGNED) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Only ASSIGNED tickets can be resolved")
        }
        ticket.status = TicketStatus.RESOLVED
        ticket.resolvedAt = Instant.now()
        ticket.updatedAt = Instant.now()
        val saved = ticketRepository.save(ticket)
        auditService.log("TICKET_RESOLVED", "SRS", "ticket", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun close(id: UUID): TicketResponse {
        val ticket = findTicket(id)
        if (ticket.status != TicketStatus.RESOLVED) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Only RESOLVED tickets can be closed")
        }
        ticket.status = TicketStatus.CLOSED
        ticket.updatedAt = Instant.now()
        val saved = ticketRepository.save(ticket)
        auditService.log("TICKET_CLOSED", "SRS", "ticket", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun addComment(id: UUID, request: AddTicketCommentRequest): TicketCommentResponse {
        findTicket(id)
        val saved = ticketCommentRepository.save(
            TicketCommentEntity(
                id = UUID.randomUUID(),
                ticketId = id,
                body = request.body.trim(),
                createdAt = Instant.now()
            )
        )
        auditService.log("TICKET_COMMENT_ADDED", "SRS", "ticket_comment", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun createWorkOrder(id: UUID): TicketResponse {
        val ticket = findTicket(id)
        val workOrderId = workOrderCommandService.createFromTicket(
            ticketId = ticket.id,
            equipmentId = ticket.equipmentId,
            description = ticket.description ?: ticket.title,
            priority = ticket.priority
        )
        ticket.workOrderId = workOrderId
        ticket.updatedAt = Instant.now()
        val saved = ticketRepository.save(ticket)
        auditService.log("TICKET_WORK_ORDER_CREATED", "SRS", "ticket", saved.id.toString())
        return saved.toResponse()
    }

    private fun findTicket(id: UUID): TicketEntity =
        ticketRepository.findById(id).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found")
        }

    private fun TicketEntity.toResponse(): TicketResponse = TicketResponse(
        id = id,
        ticketNumber = ticketNumber,
        requesterId = requesterId,
        assigneeId = assigneeId,
        equipmentId = equipmentId,
        workOrderId = workOrderId,
        title = title,
        description = description,
        priority = priority,
        status = status,
        createdAt = createdAt,
        updatedAt = updatedAt,
        resolvedAt = resolvedAt
    )

    private fun TicketCommentEntity.toResponse(): TicketCommentResponse = TicketCommentResponse(
        id = id,
        ticketId = ticketId,
        authorId = authorId,
        body = body,
        createdAt = createdAt
    )
}

