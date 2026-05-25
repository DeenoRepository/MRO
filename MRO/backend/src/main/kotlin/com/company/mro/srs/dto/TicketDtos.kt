package com.company.mro.srs.dto

import com.company.mro.srs.domain.TicketStatus
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

data class CreateTicketRequest(
    val requestTypeId: UUID? = null,
    val equipmentId: UUID? = null,
    
    @field:NotBlank
    @field:Size(max = 255)
    val title: String = "",
    
    val description: String? = null,
    
    @field:Size(max = 32)
    val priority: String = "MEDIUM",
    
    val assigneeId: UUID? = null
)

data class UpdateTicketRequest(
    @field:NotBlank
    @field:Size(max = 255)
    val title: String = "",
    
    val description: String? = null,
    
    @field:Size(max = 32)
    val priority: String = "MEDIUM",
    
    val assigneeId: UUID? = null,
    
    val dueAt: Instant? = null
)

data class AssignTicketRequest(
    @field:NotNull
    val assigneeId: UUID? = null
)

data class ChangeTicketStatusRequest(
    @field:NotBlank
    @field:Size(max = 32)
    val status: String = ""
)

data class AddTicketCommentRequest(
    @field:NotBlank
    @field:Size(max = 4000)
    val commentText: String = "",
    
    val isInternal: Boolean = false
)

data class TicketResponse(
    val id: UUID,
    val ticketNumber: String,
    val requestTypeId: UUID?,
    val requesterId: UUID?,
    val assigneeId: UUID?,
    val equipmentId: UUID?,
    val workOrderId: UUID?, // Deprecated / DB compatibility
    val linkedWorkOrderId: UUID?, // Clean boundary reference
    val title: String,
    val description: String?,
    val priority: String,
    val status: TicketStatus,
    val openedAt: Instant,
    val assignedAt: Instant?,
    val resolvedAt: Instant?,
    val closedAt: Instant?,
    val dueAt: Instant?,
    val createdBy: UUID?,
    val updatedBy: UUID?,
    val createdAt: Instant,
    val updatedAt: Instant
)

data class TicketCommentResponse(
    val id: UUID,
    val ticketId: UUID,
    val commentText: String,
    val isInternal: Boolean,
    val createdBy: UUID?,
    val createdAt: Instant
)

data class TicketAttachmentResponse(
    val id: UUID,
    val ticketId: UUID,
    val fileName: String,
    val mimeType: String?,
    val fileSize: Long?,
    val uploadedBy: UUID?,
    val uploadedAt: Instant
)

data class WorkOrderCreationRequest(
    @field:NotNull
    val ticketId: UUID,
    
    @field:NotNull
    val equipmentId: UUID,
    
    @field:NotBlank
    val priority: String,
    
    @field:NotBlank
    val description: String
)
