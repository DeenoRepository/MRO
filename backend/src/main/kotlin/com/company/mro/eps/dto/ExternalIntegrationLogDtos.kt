package com.company.mro.eps.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.Instant
import java.util.UUID

data class CreateExternalIntegrationLogRequest(
    @field:NotBlank
    @field:Size(max = 128)
    val integrationName: String,
    @field:NotBlank
    @field:Size(max = 32)
    val direction: String,
    @field:NotBlank
    @field:Size(max = 64)
    val operation: String,
    val equipmentId: UUID? = null,
    val requestPayload: String? = null,
    val responsePayload: String? = null,
    val statusCode: Int? = null,
    @field:NotBlank
    @field:Size(max = 32)
    val status: String,
    val errorMessage: String? = null
)

data class ExternalIntegrationLogResponse(
    val id: UUID,
    val integrationName: String,
    val direction: String,
    val operation: String,
    val equipmentId: UUID?,
    val requestPayload: String?,
    val responsePayload: String?,
    val statusCode: Int?,
    val status: String,
    val errorMessage: String?,
    val createdAt: Instant
)
