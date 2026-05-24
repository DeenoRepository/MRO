package com.company.mro.srs.dto

import com.company.mro.srs.domain.TicketStatus
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.time.Instant
import java.util.UUID

data class CreateTicketRequest(
    @field:NotBlank
    @field:Size(max = 64)
    val ticketNumber: String,
    val equipmentId: UUID? = null,
    @field:NotBlank
    @field:Size(max = 255)
    val title: String,
    @field:Size(max = 4000)
    val description: String? = null,
    @field:Size(max = 32)
    val priority: String? = null
)

data class AssignTicketRequest(
    @field:NotNull
    val assigneeId: UUID
)

data class AddTicketCommentRequest(
    @field:NotBlank
    @field:Size(max = 4000)
    val body: String
)

data class TicketResponse(
    val id: UUID,
    val ticketNumber: String,
    val requesterId: UUID?,
    val assigneeId: UUID?,
    val equipmentId: UUID?,
    val workOrderId: UUID?,
    val title: String,
    val description: String?,
    val priority: String,
    val status: TicketStatus,
    val createdAt: Instant,
    val updatedAt: Instant,
    val resolvedAt: Instant?
)

data class TicketCommentResponse(
    val id: UUID,
    val ticketId: UUID,
    val authorId: UUID?,
    val body: String,
    val createdAt: Instant
)

