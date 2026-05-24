package com.company.mro.srs.persistence

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface TicketCommentRepository : JpaRepository<TicketCommentEntity, UUID> {
    fun findAllByTicketId(ticketId: UUID): List<TicketCommentEntity>
}

