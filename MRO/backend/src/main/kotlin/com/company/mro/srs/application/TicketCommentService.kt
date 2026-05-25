package com.company.mro.srs.application

import com.company.mro.audit.application.AuditService
import com.company.mro.srs.dto.AddTicketCommentRequest
import com.company.mro.srs.dto.TicketCommentResponse
import com.company.mro.srs.persistence.TicketCommentEntity
import com.company.mro.srs.persistence.TicketCommentRepository
import com.company.mro.srs.persistence.TicketRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.Instant
import java.util.UUID

@Service
class TicketCommentService(
    private val ticketRepository: TicketRepository,
    private val commentRepository: TicketCommentRepository,
    private val auditService: AuditService
) {
    @Transactional
    fun addComment(ticketId: UUID, request: AddTicketCommentRequest, createdBy: UUID? = null): TicketCommentResponse {
        if (!ticketRepository.existsById(ticketId)) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found")
        }

        val saved = commentRepository.save(
            TicketCommentEntity(
                id = UUID.randomUUID(),
                ticketId = ticketId,
                commentText = request.commentText.trim(),
                isInternal = request.isInternal,
                createdBy = createdBy,
                createdAt = Instant.now()
            )
        )
        auditService.log("SRS_COMMENT_ADDED", "SRS", "ticket_comment", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional(readOnly = true)
    fun getComments(ticketId: UUID, canViewInternal: Boolean): List<TicketCommentResponse> {
        if (!ticketRepository.existsById(ticketId)) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found")
        }

        val list = if (canViewInternal) {
            commentRepository.findAllByTicketIdOrderByCreatedAtAsc(ticketId)
        } else {
            commentRepository.findAllByTicketIdAndIsInternalFalseOrderByCreatedAtAsc(ticketId)
        }
        return list.map { it.toResponse() }
    }

    private fun TicketCommentEntity.toResponse(): TicketCommentResponse = TicketCommentResponse(
        id = id,
        ticketId = ticketId,
        commentText = commentText,
        isInternal = isInternal,
        createdBy = createdBy,
        createdAt = createdAt
    )
}
