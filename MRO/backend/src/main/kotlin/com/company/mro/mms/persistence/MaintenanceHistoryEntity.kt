package com.company.mro.mms.persistence

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "maintenance_history", schema = "mms")
class MaintenanceHistoryEntity(
    @Id
    var id: UUID,

    @Column(name = "work_order_id", nullable = false)
    var workOrderId: UUID,

    @Column(name = "equipment_id", nullable = false)
    var equipmentId: UUID,

    @Column(name = "event_type", nullable = false, length = 64)
    var eventType: String,

    @Column(name = "event_data", columnDefinition = "jsonb")
    var eventData: String? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now(),

    @Column(name = "created_by")
    var createdBy: UUID? = null
)
