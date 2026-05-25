package com.company.mro.mms.persistence

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "work_order_tasks", schema = "mms")
class WorkOrderTaskEntity(
    @Id
    var id: UUID,

    @Column(name = "work_order_id", nullable = false)
    var workOrderId: UUID,

    @Column(nullable = false, length = 255)
    var title: String,

    @Column(columnDefinition = "text")
    var description: String? = null,

    @Column(nullable = false, length = 32)
    var status: String = "OPEN", // 'OPEN', 'COMPLETED'

    @Column(name = "sort_order", nullable = false)
    var sortOrder: Int = 0,

    @Column(name = "completed_at")
    var completedAt: Instant? = null,

    @Column(name = "completed_by")
    var completedBy: UUID? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now()
)
