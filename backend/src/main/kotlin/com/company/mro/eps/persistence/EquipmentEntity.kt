package com.company.mro.eps.persistence

import com.company.mro.eps.domain.EquipmentStatus
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
@Table(name = "equipment", schema = "eps")
class EquipmentEntity(
    @Id
    var id: UUID,
    @Column(name = "asset_tag", nullable = false, unique = true, length = 64)
    var assetTag: String,
    @Column(nullable = false, length = 255)
    var name: String,
    @Column(nullable = false, length = 128)
    var category: String,
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 64)
    var status: EquipmentStatus = EquipmentStatus.ACTIVE,
    @Column(length = 255)
    var location: String? = null,
    @Column(length = 255)
    var manufacturer: String? = null,
    @Column(length = 255)
    var model: String? = null,
    @Column(name = "serial_number", length = 128)
    var serialNumber: String? = null,
    @Column(name = "install_date")
    var installDate: LocalDate? = null,
    @Column(columnDefinition = "jsonb")
    var metadata: String? = null,
    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now(),
    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now()
)

