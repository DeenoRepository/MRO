package com.company.mro.wms.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
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
    val location: String? = null
)

data class WarehouseResponse(
    val id: UUID,
    val code: String,
    val name: String,
    val type: String,
    val custodianId: UUID?,
    val location: String?,
    val isActive: Boolean
)

