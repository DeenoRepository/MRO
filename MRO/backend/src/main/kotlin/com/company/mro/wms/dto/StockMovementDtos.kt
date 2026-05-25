package com.company.mro.wms.dto

import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

data class CreateStockMovementRequest(
    @field:NotNull
    val warehouseId: UUID,

    @field:NotNull
    val partId: UUID,

    @field:NotBlank
    @field:Size(max = 32)
    val movementType: String, // RECEIPT, ISSUE, ADJUSTMENT_IN, ADJUSTMENT_OUT

    @field:DecimalMin("0.001")
    val quantity: BigDecimal,

    @field:Size(max = 64)
    val referenceType: String? = null,

    val referenceId: UUID? = null,

    val reason: String? = null
)

data class StockMovementResponse(
    val id: UUID,
    val warehouseId: UUID,
    val partId: UUID,
    val movementType: String,
    val quantity: BigDecimal,
    val referenceType: String?,
    val referenceId: UUID?,
    val reason: String?,
    val createdAt: Instant
)
