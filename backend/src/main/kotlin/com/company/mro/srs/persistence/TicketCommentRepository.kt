package com.company.mro.srs.persistence

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface TicketCommentRepository : JpaRepository<TicketCommentEntity, UUID> {
    fun findAllByTicketIdOrderByCreatedAtAsc(ticketId: UUID): List<TicketCommentEntity>
    fun findAllByTicketIdAndIsInternalFalseOrderByCreatedAtAsc(ticketId: UUID): List<TicketCommentEntity>
}
