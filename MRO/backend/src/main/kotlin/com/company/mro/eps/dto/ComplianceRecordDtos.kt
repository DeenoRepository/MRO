package com.company.mro.eps.dto

import com.company.mro.eps.domain.ComplianceRecordStatus
import jakarta.validation.constraints.FutureOrPresent
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

data class CreateComplianceRecordRequest(
    @field:NotBlank
    @field:Size(max = 64)
    val recordType: String,
    @field:NotBlank
    @field:Size(max = 255)
    val title: String,
    val validFrom: LocalDate? = null,
    @field:NotNull
    @field:FutureOrPresent
    val validUntil: LocalDate,
    val notes: String? = null
)

data class ComplianceRecordResponse(
    val id: UUID,
    val equipmentId: UUID,
    val recordType: String,
    val title: String,
    val validFrom: LocalDate?,
    val validUntil: LocalDate,
    val status: ComplianceRecordStatus,
    val notes: String?,
    val createdAt: Instant,
    val updatedAt: Instant
)
