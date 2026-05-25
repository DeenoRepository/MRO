package com.company.mro.eps.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.Instant
import java.util.UUID

data class CreateEquipmentCategoryRequest(
    @field:NotBlank
    @field:Size(max = 64)
    val code: String,
    @field:NotBlank
    @field:Size(max = 255)
    val name: String,
    val parentId: UUID? = null
)

data class UpdateEquipmentCategoryRequest(
    @field:NotBlank
    @field:Size(max = 255)
    val name: String,
    val parentId: UUID? = null,
    val isActive: Boolean = true
)

data class EquipmentCategoryResponse(
    val id: UUID,
    val code: String,
    val name: String,
    val parentId: UUID?,
    val isActive: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant
)
