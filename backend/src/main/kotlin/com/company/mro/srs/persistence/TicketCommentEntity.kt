package com.company.mro.srs.persistence

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "ticket_comments", schema = "srs")
class TicketCommentEntity(
    @Id
    var id: UUID,
    @Column(name = "ticket_id", nullable = false)
    var ticketId: UUID,
    @Column(name = "author_id")
    var authorId: UUID? = null,
    @Column(nullable = false, columnDefinition = "text")
    var body: String,
    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now()
)

