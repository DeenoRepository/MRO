package com.company.mro.mms.persistence

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@Entity
@Table(name = "pm_schedules", schema = "mms")
class PmScheduleEntity(
    @Id
    var id: UUID,
    @Column(name = "equipment_id", nullable = false)
    var equipmentId: UUID,
    @Column(nullable = false, length = 255)
    var name: String,
    @Column(nullable = false, length = 64)
    var frequency: String,
    @Column(name = "next_due_date", nullable = false)
    var nextDueDate: LocalDate,
    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,
    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now(),
    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now()
)

