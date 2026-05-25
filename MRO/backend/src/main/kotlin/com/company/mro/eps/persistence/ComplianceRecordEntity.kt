package com.company.mro.eps.persistence

import com.company.mro.eps.domain.ComplianceRecordStatus
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@Entity
@Table(name = "compliance_records", schema = "eps")
class ComplianceRecordEntity(
    @Id
    var id: UUID,
    @Column(name = "equipment_id", nullable = false)
    var equipmentId: UUID,
    @Column(name = "record_type", nullable = false, length = 64)
    var recordType: String,
    @Column(nullable = false, length = 255)
    var title: String,
    @Column(name = "valid_from")
    var validFrom: LocalDate? = null,
    @Column(name = "valid_until", nullable = false)
    var validUntil: LocalDate,
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    var status: ComplianceRecordStatus,
    @Column(columnDefinition = "text")
    var notes: String? = null,
    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now(),
    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now()
)
