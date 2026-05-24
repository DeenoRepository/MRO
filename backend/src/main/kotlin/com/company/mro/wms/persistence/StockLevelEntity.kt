package com.company.mro.wms.persistence

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "stock_levels", schema = "wms")
class StockLevelEntity(
    @Id
    var id: UUID,

    @Column(name = "warehouse_id", nullable = false)
    var warehouseId: UUID,

    @Column(name = "part_id", nullable = false)
    var partId: UUID,

    @Column(name = "quantity_on_hand", nullable = false, precision = 18, scale = 3)
    var quantityOnHand: BigDecimal = BigDecimal.ZERO,

    @Column(name = "quantity_reserved", nullable = false, precision = 18, scale = 3)
    var quantityReserved: BigDecimal = BigDecimal.ZERO,

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now()
)
