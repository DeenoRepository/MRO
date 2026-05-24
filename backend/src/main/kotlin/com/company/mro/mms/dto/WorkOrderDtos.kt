package com.company.mro.mms.dto

import com.company.mro.mms.domain.WorkOrderStatus
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.time.Instant
import java.util.UUID

data class CreateWorkOrderRequest(
    @field:NotBlank
    @field:Size(max = 64)
    val woNumber: String,
    @field:NotNull
    val equipmentId: UUID,
    @field:NotBlank
    @field:Size(max = 32)
    val type: String,
    @field:Size(max = 32)
    val priority: String? = null,
    val scheduledDate: Instant? = null,
    @field:Size(max = 2000)
    val description: String? = null
)

data class AssignWorkOrderRequest(
    @field:NotNull
    val technicianId: UUID
)

data class WorkOrderResponse(
    val id: UUID,
    val woNumber: String,
    val equipmentId: UUID,
    val type: String,
    val priority: String,
    val status: WorkOrderStatus,
    val scheduledDate: Instant?,
    val completedDate: Instant?,
    val technicianId: UUID?,
    val description: String?,
    val createdAt: Instant,
    val updatedAt: Instant
)

