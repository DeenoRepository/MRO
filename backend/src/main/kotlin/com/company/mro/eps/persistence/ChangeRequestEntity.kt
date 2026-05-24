package com.company.mro.eps.persistence

import com.company.mro.eps.domain.ChangeRequestStatus
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "change_requests", schema = "eps")
class ChangeRequestEntity(
    @Id
    var id: UUID,

    @Column(name = "entity_type", nullable = false, length = 64)
    var entityType: String,

    @Column(name = "entity_id")
    var entityId: UUID? = null,

    @Column(name = "change_type", nullable = false, length = 32)
    var changeType: String, // 'CREATE' or 'UPDATE'

    @Column(name = "proposed_data", nullable = false, columnDefinition = "jsonb")
    var proposedData: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    var status: ChangeRequestStatus = ChangeRequestStatus.PENDING,

    @Column(name = "requested_by")
    var requestedBy: UUID? = null,

    @Column(name = "approved_by")
    var approvedBy: UUID? = null,

    @Column(name = "approval_notes")
    var approvalNotes: String? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now(),

    @Column(name = "decided_at")
    var decidedAt: Instant? = null
)
