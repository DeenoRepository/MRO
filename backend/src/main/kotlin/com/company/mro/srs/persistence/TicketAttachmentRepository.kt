package com.company.mro.srs.persistence

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface TicketAttachmentRepository : JpaRepository<TicketAttachmentEntity, UUID> {
    fun findAllByTicketId(ticketId: UUID): List<TicketAttachmentEntity>
}
