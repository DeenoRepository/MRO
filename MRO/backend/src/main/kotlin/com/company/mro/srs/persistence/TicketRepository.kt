package com.company.mro.srs.persistence

import com.company.mro.srs.domain.TicketStatus
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface TicketRepository : JpaRepository<TicketEntity, UUID> {
    fun existsByTicketNumber(ticketNumber: String): Boolean
    fun findByTicketNumber(ticketNumber: String): TicketEntity?
    fun findByAssigneeId(assigneeId: UUID): List<TicketEntity>
    fun findByStatus(status: TicketStatus): List<TicketEntity>
}
