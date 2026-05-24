package com.company.mro.mms.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

data class CreatePmScheduleRequest(
    @field:NotNull
    val equipmentId: UUID,
    @field:NotBlank
    @field:Size(max = 255)
    val name: String,
    @field:NotBlank
    @field:Size(max = 64)
    val frequency: String,
    @field:NotNull
    val nextDueDate: LocalDate
)

data class UpdatePmScheduleRequest(
    @field:NotBlank
    @field:Size(max = 255)
    val name: String,
    @field:NotBlank
    @field:Size(max = 64)
    val frequency: String,
    @field:NotNull
    val nextDueDate: LocalDate,
    @field:NotNull
    val isActive: Boolean
)

data class PmScheduleResponse(
    val id: UUID,
    val equipmentId: UUID,
    val name: String,
    val frequency: String,
    val nextDueDate: LocalDate,
    val isActive: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant
)

