package com.company.mro.eps.dto

import com.company.mro.eps.domain.ChangeRequestStatus
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.Instant
import java.util.UUID

data class CreateChangeRequest(
    @field:NotBlank
    @field:Size(max = 64)
    val entityType: String,

    val entityId: UUID? = null,

    @field:NotBlank
    @field:Size(max = 32)
    val changeType: String, // 'CREATE' or 'UPDATE'

    @field:NotBlank
    val proposedData: String // Serialized JSON string of the entity request
)

data class DecideChangeRequest(
    val approvalNotes: String? = null
)

data class ChangeRequestResponse(
    val id: UUID,
    val entityType: String,
    val entityId: UUID?,
    val changeType: String,
    val proposedData: String,
    val status: ChangeRequestStatus,
    val requestedBy: UUID?,
    val approvedBy: UUID?,
    val approvalNotes: String?,
    val createdAt: Instant,
    val decidedAt: Instant?
)
