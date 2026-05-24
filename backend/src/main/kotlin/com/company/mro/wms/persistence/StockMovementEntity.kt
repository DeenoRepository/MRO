package com.company.mro.wms.persistence

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "stock_movements", schema = "wms")
class StockMovementEntity(
    @Id
    var id: UUID,
    @Column(name = "warehouse_id", nullable = false)
    var warehouseId: UUID,
    @Column(name = "part_id", nullable = false)
    var partId: UUID,
    @Column(name = "movement_type", nullable = false, length = 32)
    var movementType: String,
    @Column(nullable = false)
    var quantity: BigDecimal,
    @Column(name = "reference_type", length = 64)
    var referenceType: String? = null,
    @Column(name = "reference_id")
    var referenceId: UUID? = null,
    @Column(name = "initiated_by")
    var initiatedBy: UUID? = null,
    @Column(name = "reason")
    var reason: String? = null,
    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now()
)

