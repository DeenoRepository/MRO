package com.company.mro.wms.dto

import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

data class CreatePartRequest(
    @field:NotBlank
    @field:Size(max = 64)
    val partNumber: String,

    @field:NotBlank
    @field:Size(max = 255)
    val name: String,

    @field:Size(max = 2000)
    val description: String? = null,

    @field:Size(max = 32)
    val unit: String? = null,

    @field:Size(max = 255)
    val manufacturer: String? = null,

    @field:Size(max = 255)
    val model: String? = null,

    @field:DecimalMin("0.0")
    val minStockLevel: BigDecimal? = null,

    val metadata: String? = null
)

data class UpdatePartRequest(
    @field:NotBlank
    @field:Size(max = 255)
    val name: String,

    @field:Size(max = 2000)
    val description: String? = null,

    @field:Size(max = 32)
    val unit: String? = null,

    @field:Size(max = 255)
    val manufacturer: String? = null,

    @field:Size(max = 255)
    val model: String? = null,

    @field:DecimalMin("0.0")
    val minStockLevel: BigDecimal? = null,

    val metadata: String? = null,

    val isActive: Boolean = true
)

data class PartResponse(
    val id: UUID,
    val partNumber: String,
    val name: String,
    val description: String?,
    val unit: String,
    val manufacturer: String?,
    val model: String?,
    val minStockLevel: BigDecimal,
    val isActive: Boolean,
    val metadata: String?,
    val createdAt: Instant,
    val updatedAt: Instant
)
