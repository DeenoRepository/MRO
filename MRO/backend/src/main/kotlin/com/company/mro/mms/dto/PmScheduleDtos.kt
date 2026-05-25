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

    val description: String? = null,

    @field:NotBlank
    @field:Size(max = 32)
    val frequencyType: String, // 'DAYS', 'WEEKS', 'MONTHS'

    @field:NotNull
    val frequencyValue: Int,

    @field:NotNull
    val nextDueDate: LocalDate
)

data class UpdatePmScheduleRequest(
    @field:NotBlank
    @field:Size(max = 255)
    val name: String,

    val description: String? = null,

    @field:NotBlank
    @field:Size(max = 32)
    val frequencyType: String,

    @field:NotNull
    val frequencyValue: Int,

    @field:NotNull
    val nextDueDate: LocalDate,

    @field:NotNull
    val isActive: Boolean
)

data class PmScheduleResponse(
    val id: UUID,
    val equipmentId: UUID,
    val name: String,
    val description: String?,
    val frequencyType: String,
    val frequencyValue: Int,
    val nextDueDate: LocalDate,
    val lastGeneratedDate: LocalDate?,
    val isActive: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant
)
