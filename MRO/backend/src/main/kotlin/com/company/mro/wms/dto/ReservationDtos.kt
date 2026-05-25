package com.company.mro.wms.dto

import com.company.mro.wms.domain.ReservationStatus
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

data class CreateReservationRequest(
    @field:NotNull
    val warehouseId: UUID,

    @field:NotNull
    val partId: UUID,

    @field:DecimalMin("0.001")
    val quantity: BigDecimal,

    @field:Size(max = 64)
    val referenceType: String? = null,

    val referenceId: UUID? = null,

    val expiresAt: Instant? = null
)

data class ReservationResponse(
    val id: UUID,
    val warehouseId: UUID,
    val partId: UUID,
    val quantity: BigDecimal,
    val status: ReservationStatus,
    val referenceType: String?,
    val referenceId: UUID?,
    val expiresAt: Instant?,
    val createdAt: Instant,
    val updatedAt: Instant
)
