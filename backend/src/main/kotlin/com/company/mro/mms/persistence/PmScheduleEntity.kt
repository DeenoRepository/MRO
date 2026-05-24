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

    @Column(columnDefinition = "text")
    var description: String? = null,

    @Column(name = "frequency")
    var frequency: String? = null, // Left for legacy DB mapping compatibility if needed

    @Column(name = "frequency_type", nullable = false, length = 32)
    var frequencyType: String, // 'DAYS', 'WEEKS', 'MONTHS'

    @Column(name = "frequency_value", nullable = false)
    var frequencyValue: Int,

    @Column(name = "next_due_date", nullable = false)
    var nextDueDate: LocalDate,

    @Column(name = "last_generated_date")
    var lastGeneratedDate: LocalDate? = null,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    @Column(name = "created_by")
    var createdBy: UUID? = null,

    @Column(name = "updated_by")
    var updatedBy: UUID? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now()
)
