package com.company.mro.wms.persistence

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "warehouse_transfers", schema = "wms")
class WarehouseTransferEntity(
    @Id
    var id: UUID,

    @Column(name = "source_warehouse_id", nullable = false)
    var sourceWarehouseId: UUID,

    @Column(name = "target_warehouse_id", nullable = false)
    var targetWarehouseId: UUID,

    @Column(name = "part_id", nullable = false)
    var partId: UUID,

    @Column(nullable = false, precision = 18, scale = 3)
    var quantity: BigDecimal,

    @Column(nullable = false, length = 32)
    var status: String = "DRAFT", // 'DRAFT', 'REQUESTED', 'APPROVED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'

    @Column(name = "requested_by")
    var requestedBy: UUID? = null,

    @Column(name = "approved_by")
    var approvedBy: UUID? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now()
)
