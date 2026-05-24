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

    @Column(name = "comment_text", nullable = false, columnDefinition = "text")
    var commentText: String,

    @Column(name = "is_internal", nullable = false)
    var isInternal: Boolean = false,

    @Column(name = "created_by")
    var createdBy: UUID? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now()
)
