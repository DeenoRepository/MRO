package com.company.mro.srs.dto

import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.util.UUID

data class CreateRequestTypeRequest(
    @field:NotBlank
    @field:Size(max = 64)
    val code: String,

    @field:NotBlank
    @field:Size(max = 255)
    val name: String,

    val description: String? = null,

    @field:Size(max = 32)
    val defaultPriority: String = "MEDIUM",

    @field:Min(1)
    @field:Max(8760) // Up to 1 year in hours
    val slaHours: Int? = null
)

data class UpdateRequestTypeRequest(
    @field:NotBlank
    @field:Size(max = 255)
    val name: String,

    val description: String? = null,

    @field:Size(max = 32)
    val defaultPriority: String = "MEDIUM",

    @field:Min(1)
    @field:Max(8760)
    val slaHours: Int? = null,

    val isActive: Boolean = true
)

data class RequestTypeResponse(
    val id: UUID,
    val code: String,
    val name: String,
    val description: String?,
    val defaultPriority: String,
    val slaHours: Int?,
    val isActive: Boolean
)
