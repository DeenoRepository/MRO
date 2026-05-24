package com.company.mro.srs.persistence

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface TicketRepository : JpaRepository<TicketEntity, UUID> {
    fun existsByTicketNumber(ticketNumber: String): Boolean
}

