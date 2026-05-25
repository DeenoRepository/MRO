package com.company.mro.wms.persistence

import com.company.mro.wms.domain.ReservationStatus
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "reservations", schema = "wms")
class ReservationEntity(
    @Id
    var id: UUID,

    @Column(name = "warehouse_id", nullable = false)
    var warehouseId: UUID,

    @Column(name = "part_id", nullable = false)
    var partId: UUID,

    @Column(nullable = false)
    var quantity: BigDecimal,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    var status: ReservationStatus = ReservationStatus.RESERVED,

    @Column(name = "reference_type", length = 64)
    var referenceType: String? = null,

    @Column(name = "reference_id")
    var referenceId: UUID? = null,

    @Column(name = "expires_at")
    var expiresAt: Instant? = null,

    @Column(name = "created_by")
    var createdBy: UUID? = null,

    @Column(name = "updated_by")
    var updatedBy: UUID? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now()
)
