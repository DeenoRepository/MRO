package com.company.mro.wms.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.Instant
import java.util.UUID

data class CreateWarehouseRequest(
    @field:NotBlank
    @field:Size(max = 32)
    val code: String,

    @field:NotBlank
    @field:Size(max = 255)
    val name: String,

    @field:NotBlank
    @field:Size(max = 32)
    val type: String,

    val custodianId: UUID? = null,

    @field:Size(max = 255)
    val location: String? = null,

    val description: String? = null
)

data class UpdateWarehouseRequest(
    @field:NotBlank
    @field:Size(max = 255)
    val name: String,

    @field:NotBlank
    @field:Size(max = 32)
    val type: String,

    val custodianId: UUID? = null,

    @field:Size(max = 255)
    val location: String? = null,

    val description: String? = null,

    val isActive: Boolean = true
)

data class WarehouseResponse(
    val id: UUID,
    val code: String,
    val name: String,
    val type: String,
    val custodianId: UUID?,
    val location: String?,
    val description: String?,
    val isActive: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant
)
