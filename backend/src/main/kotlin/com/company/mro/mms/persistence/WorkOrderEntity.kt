package com.company.mro.mms.persistence

import com.company.mro.mms.domain.WorkOrderStatus
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "work_orders", schema = "mms")
class WorkOrderEntity(
    @Id
    var id: UUID,
    @Column(name = "wo_number", nullable = false, unique = true, length = 64)
    var woNumber: String,
    @Column(name = "equipment_id", nullable = false)
    var equipmentId: UUID,
    @Column(nullable = false, length = 32)
    var type: String,
    @Column(nullable = false, length = 32)
    var priority: String = "MEDIUM",
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    var status: WorkOrderStatus = WorkOrderStatus.OPEN,
    @Column(name = "scheduled_date")
    var scheduledDate: Instant? = null,
    @Column(name = "completed_date")
    var completedDate: Instant? = null,
    @Column(name = "technician_id")
    var technicianId: UUID? = null,
    @Column(columnDefinition = "text")
    var description: String? = null,
    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now(),
    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now()
)

