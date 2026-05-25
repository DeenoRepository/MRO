package com.company.mro.wms.persistence

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "parts", schema = "wms")
class PartEntity(
    @Id
    var id: UUID,

    @Column(name = "part_number", nullable = false, unique = true, length = 64)
    var partNumber: String,

    @Column(nullable = false, length = 255)
    var name: String,

    @Column(columnDefinition = "text")
    var description: String? = null,

    @Column(nullable = false, length = 32)
    var unit: String = "PCS",

    @Column(length = 255)
    var manufacturer: String? = null,

    @Column(length = 255)
    var model: String? = null,

    @Column(name = "min_stock_level", nullable = false)
    var minStockLevel: BigDecimal = BigDecimal.ZERO,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    @Column(columnDefinition = "jsonb")
    var metadata: String? = null,

    @Column(name = "created_by")
    var createdBy: UUID? = null,

    @Column(name = "updated_by")
    var updatedBy: UUID? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now()
)
