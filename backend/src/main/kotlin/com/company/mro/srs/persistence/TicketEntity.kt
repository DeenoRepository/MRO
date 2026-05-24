package com.company.mro.srs.persistence

import com.company.mro.srs.domain.TicketStatus
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "tickets", schema = "srs")
class TicketEntity(
    @Id
    var id: UUID,
    @Column(name = "ticket_number", nullable = false, unique = true, length = 64)
    var ticketNumber: String,
    @Column(name = "requester_id")
    var requesterId: UUID? = null,
    @Column(name = "assignee_id")
    var assigneeId: UUID? = null,
    @Column(name = "equipment_id")
    var equipmentId: UUID? = null,
    @Column(name = "work_order_id")
    var workOrderId: UUID? = null,
    @Column(nullable = false, length = 255)
    var title: String,
    @Column(columnDefinition = "text")
    var description: String? = null,
    @Column(nullable = false, length = 32)
    var priority: String = "MEDIUM",
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    var status: TicketStatus = TicketStatus.OPEN,
    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now(),
    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),
    @Column(name = "resolved_at")
    var resolvedAt: Instant? = null
)

