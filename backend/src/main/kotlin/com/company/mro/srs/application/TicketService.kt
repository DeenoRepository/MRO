package com.company.mro.srs.application

import com.company.mro.audit.application.AuditService
import com.company.mro.eps.application.EquipmentLookupService
import com.company.mro.srs.domain.TicketStatus
import com.company.mro.srs.dto.AssignTicketRequest
import com.company.mro.srs.dto.CreateTicketRequest
import com.company.mro.srs.dto.UpdateTicketRequest
import com.company.mro.srs.dto.TicketResponse
import com.company.mro.srs.persistence.RequestTypeRepository
import com.company.mro.srs.persistence.TicketEntity
import com.company.mro.srs.persistence.TicketRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.Duration
import java.time.Instant
import java.util.UUID

@Service
class TicketService(
    private val ticketRepository: TicketRepository,
    private val requestTypeRepository: RequestTypeRepository,
    private val equipmentLookupService: EquipmentLookupService,
    private val auditService: AuditService
) {
    @Transactional(readOnly = true)
    fun getAll(): List<TicketResponse> = ticketRepository.findAll().map { it.toResponse() }

    @Transactional(readOnly = true)
    fun getById(id: UUID): TicketResponse = findTicket(id).toResponse()

    @Transactional
    fun create(request: CreateTicketRequest, requesterId: UUID? = null): TicketResponse {
        if (request.equipmentId != null && !equipmentLookupService.existsById(request.equipmentId)) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Referenced equipment not found")
        }

        val requestType = request.requestTypeId?.let {
            requestTypeRepository.findById(it)
                .orElseThrow { ResponseStatusException(HttpStatus.BAD_REQUEST, "Request type not found") }
        }

        val now = Instant.now()
        val dueAt = requestType?.slaHours?.let {
            now.plus(Duration.ofHours(it.toLong()))
        }

        // Generate unique ticket number
        var ticketNumber = ""
        var attempts = 0
        while (attempts < 10) {
            val randomPart = UUID.randomUUID().toString().substring(0, 8).uppercase()
            val potentialNum = "TK-$randomPart"
            if (!ticketRepository.existsByTicketNumber(potentialNum)) {
                ticketNumber = potentialNum
                break
            }
            attempts++
        }
        if (ticketNumber.isEmpty()) {
            ticketNumber = "TK-${System.currentTimeMillis()}"
        }

        val saved = ticketRepository.save(
            TicketEntity(
                id = UUID.randomUUID(),
                ticketNumber = ticketNumber,
                requestTypeId = request.requestTypeId,
                requesterId = requesterId,
                assigneeId = request.assigneeId,
                equipmentId = request.equipmentId,
                title = request.title.trim(),
                description = request.description?.trim(),
                priority = request.priority.trim().uppercase(),
                status = TicketStatus.OPEN,
                openedAt = now,
                dueAt = dueAt,
                createdBy = requesterId,
                createdAt = now,
                updatedAt = now
            )
        )

        auditService.log("SRS_TICKET_CREATED", "SRS", "ticket", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun update(id: UUID, request: UpdateTicketRequest, updatedBy: UUID? = null): TicketResponse {
        val ticket = findTicket(id)
        
        ticket.title = request.title.trim()
        ticket.description = request.description?.trim()
        ticket.priority = request.priority.trim().uppercase()
        ticket.assigneeId = request.assigneeId
        ticket.dueAt = request.dueAt
        ticket.updatedBy = updatedBy
        ticket.updatedAt = Instant.now()

        val saved = ticketRepository.save(ticket)
        auditService.log("SRS_TICKET_UPDATED", "SRS", "ticket", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun assign(id: UUID, request: AssignTicketRequest, updatedBy: UUID? = null): TicketResponse {
        val ticket = findTicket(id)
        validateTransition(ticket.status, TicketStatus.ASSIGNED)
        
        ticket.assigneeId = request.assigneeId
        ticket.status = TicketStatus.ASSIGNED
        ticket.assignedAt = Instant.now()
        ticket.updatedBy = updatedBy
        ticket.updatedAt = Instant.now()

        val saved = ticketRepository.save(ticket)
        auditService.log("SRS_TICKET_ASSIGNED", "SRS", "ticket", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun changeStatus(id: UUID, targetStatusStr: String, updatedBy: UUID? = null): TicketResponse {
        val ticket = findTicket(id)
        val targetStatus = runCatching {
            TicketStatus.valueOf(targetStatusStr.trim().uppercase())
        }.getOrElse {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: $targetStatusStr")
        }

        validateTransition(ticket.status, targetStatus)

        ticket.status = targetStatus
        ticket.updatedBy = updatedBy
        ticket.updatedAt = Instant.now()

        if (targetStatus == TicketStatus.RESOLVED) {
            ticket.resolvedAt = Instant.now()
            auditService.log("SRS_TICKET_RESOLVED", "SRS", "ticket", id.toString())
        } else if (targetStatus == TicketStatus.CLOSED) {
            ticket.closedAt = Instant.now()
            auditService.log("SRS_TICKET_CLOSED", "SRS", "ticket", id.toString())
        } else if (targetStatus == TicketStatus.CANCELLED) {
            auditService.log("SRS_TICKET_CANCELLED", "SRS", "ticket", id.toString())
        } else {
            auditService.log("SRS_TICKET_STATUS_CHANGED", "SRS", "ticket", id.toString())
        }

        val saved = ticketRepository.save(ticket)
        return saved.toResponse()
    }

    @Transactional(readOnly = true)
    fun searchTickets(
        ticketNumber: String?,
        status: TicketStatus?,
        priority: String?,
        requestTypeId: UUID?,
        requesterId: UUID?,
        assigneeId: UUID?,
        equipmentId: UUID?
    ): List<TicketResponse> {
        var results = ticketRepository.findAll()

        if (!ticketNumber.isNullOrBlank()) {
            results = results.filter { it.ticketNumber.contains(ticketNumber.trim(), ignoreCase = true) }
        }
        if (status != null) {
            results = results.filter { it.status == status }
        }
        if (!priority.isNullOrBlank()) {
            results = results.filter { it.priority.equals(priority.trim(), ignoreCase = true) }
        }
        if (requestTypeId != null) {
            results = results.filter { it.requestTypeId == requestTypeId }
        }
        if (requesterId != null) {
            results = results.filter { it.requesterId == requesterId }
        }
        if (assigneeId != null) {
            results = results.filter { it.assigneeId == assigneeId }
        }
        if (equipmentId != null) {
            results = results.filter { it.equipmentId == equipmentId }
        }

        // Sort by openedAt DESC by default
        return results.sortedByDescending { it.openedAt }.map { it.toResponse() }
    }

    private fun findTicket(id: UUID): TicketEntity =
        ticketRepository.findById(id).orElseThrow {
            ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found")
        }

    private fun validateTransition(from: TicketStatus, to: TicketStatus) {
        val allowed = when (from) {
            TicketStatus.OPEN -> to == TicketStatus.ASSIGNED || to == TicketStatus.CANCELLED
            TicketStatus.ASSIGNED -> to == TicketStatus.IN_PROGRESS || to == TicketStatus.CANCELLED
            TicketStatus.IN_PROGRESS -> to == TicketStatus.WAITING_EXTERNAL || to == TicketStatus.RESOLVED
            TicketStatus.WAITING_EXTERNAL -> to == TicketStatus.IN_PROGRESS
            TicketStatus.RESOLVED -> to == TicketStatus.CLOSED
            TicketStatus.CLOSED -> false
            TicketStatus.CANCELLED -> false
        }
        if (!allowed) {
            throw ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Transition from $from to $to is not allowed"
            )
        }
    }

    private fun TicketEntity.toResponse(): TicketResponse = TicketResponse(
        id = id,
        ticketNumber = ticketNumber,
        requestTypeId = requestTypeId,
        requesterId = requesterId,
        assigneeId = assigneeId,
        equipmentId = equipmentId,
        workOrderId = workOrderId,
        linkedWorkOrderId = linkedWorkOrderId,
        title = title,
        description = description,
        priority = priority,
        status = status,
        openedAt = openedAt,
        assignedAt = assignedAt,
        resolvedAt = resolvedAt,
        closedAt = closedAt,
        dueAt = dueAt,
        createdBy = createdBy,
        updatedBy = updatedBy,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}
