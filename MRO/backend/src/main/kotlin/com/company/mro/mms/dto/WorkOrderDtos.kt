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
    @field:NotBlank
    @field:Size(max = 255)
    val title: String,
    @field:Size(max = 2000)
    val description: String? = null
)

data class AssignWorkOrderRequest(
    @field:NotNull
    val technicianId: UUID
)

data class CompleteWorkOrderRequest(
    @field:NotBlank
    val completionAct: String, // JSON payload representing task completions & annotations
    val completionNotes: String? = null
)

data class CreateTaskRequest(
    @field:NotBlank
    @field:Size(max = 255)
    val title: String,
    val description: String? = null,
    val sortOrder: Int = 0
)

data class TaskResponse(
    val id: UUID,
    val workOrderId: UUID,
    val title: String,
    val description: String?,
    val status: String,
    val sortOrder: Int,
    val completedAt: Instant?,
    val completedBy: UUID?,
    val createdAt: Instant
)

data class HistoryResponse(
    val id: UUID,
    val workOrderId: UUID,
    val equipmentId: UUID,
    val eventType: String,
    val eventData: String?,
    val createdAt: Instant,
    val createdBy: UUID?
)

data class WorkOrderResponse(
    val id: UUID,
    val woNumber: String,
    val equipmentId: UUID,
    val type: String,
    val priority: String,
    val status: WorkOrderStatus,
    val scheduledDate: Instant?,
    val startedAt: Instant?,
    val completedDate: Instant?,
    val technicianId: UUID?,
    val title: String,
    val description: String?,
    val completionAct: String?,
    val signatureHash: String?,
    val createdAt: Instant,
    val updatedAt: Instant
)
