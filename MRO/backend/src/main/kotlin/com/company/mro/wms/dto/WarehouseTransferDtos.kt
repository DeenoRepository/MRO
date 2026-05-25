package com.company.mro.wms.dto

import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.NotNull
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

data class CreateWarehouseTransferRequest(
    @field:NotNull
    val sourceWarehouseId: UUID,

    @field:NotNull
    val targetWarehouseId: UUID,

    @field:NotNull
    val partId: UUID,

    @field:DecimalMin("0.001")
    val quantity: BigDecimal
)

data class WarehouseTransferResponse(
    val id: UUID,
    val sourceWarehouseId: UUID,
    val targetWarehouseId: UUID,
    val partId: UUID,
    val quantity: BigDecimal,
    val status: String,
    val requestedBy: UUID?,
    val approvedBy: UUID?,
    val createdAt: Instant,
    val updatedAt: Instant
)
