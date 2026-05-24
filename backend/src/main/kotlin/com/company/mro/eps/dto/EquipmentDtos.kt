package com.company.mro.eps.dto

import com.company.mro.eps.domain.EquipmentStatus
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

data class CreateEquipmentRequest(
    @field:NotBlank
    @field:Size(max = 64)
    val assetTag: String,
    @field:NotBlank
    @field:Size(max = 255)
    val name: String,
    @field:NotBlank
    @field:Size(max = 128)
    val category: String,
    @field:Size(max = 255)
    val location: String? = null,
    @field:Size(max = 255)
    val manufacturer: String? = null,
    @field:Size(max = 255)
    val model: String? = null,
    @field:Size(max = 128)
    val serialNumber: String? = null,
    val parentEquipmentId: UUID? = null,
    val installDate: LocalDate? = null
)

data class UpdateEquipmentRequest(
    @field:NotBlank
    @field:Size(max = 255)
    val name: String,
    @field:NotBlank
    @field:Size(max = 128)
    val category: String,
    @field:Size(max = 255)
    val location: String? = null,
    @field:Size(max = 255)
    val manufacturer: String? = null,
    @field:Size(max = 255)
    val model: String? = null,
    @field:Size(max = 128)
    val serialNumber: String? = null,
    val parentEquipmentId: UUID? = null,
    val installDate: LocalDate? = null
)

data class EquipmentResponse(
    val id: UUID,
    val assetTag: String,
    val name: String,
    val category: String,
    val status: EquipmentStatus,
    val location: String?,
    val manufacturer: String?,
    val model: String?,
    val serialNumber: String?,
    val parentEquipmentId: UUID?,
    val installDate: LocalDate?,
    val createdAt: Instant,
    val updatedAt: Instant
)

data class EquipmentQrPayloadResponse(
    val equipmentId: UUID,
    val equipmentUrl: String,
    val createTicketUrl: String,
    val openWorkOrdersUrl: String
)

data class ChangeEquipmentStatusRequest(
    val status: EquipmentStatus
)

data class EquipmentMobileItemResponse(
    val id: UUID,
    val assetTag: String,
    val name: String,
    val status: EquipmentStatus,
    val location: String?
)

data class EquipmentMobileListResponse(
    val items: List<EquipmentMobileItemResponse>,
    val limit: Int,
    val offset: Int,
    val nextOffset: Int?
)

data class EquipmentSearchItemResponse(
    val id: UUID,
    val assetTag: String,
    val name: String,
    val category: String,
    val status: EquipmentStatus,
    val location: String?,
    val relevanceScore: Int
)

data class DetectEquipmentDuplicateRequest(
    @field:NotBlank
    @field:Size(max = 64)
    val assetTag: String,
    @field:NotBlank
    @field:Size(max = 255)
    val name: String,
    @field:Size(max = 255)
    val manufacturer: String? = null,
    @field:Size(max = 255)
    val model: String? = null,
    @field:Size(max = 128)
    val serialNumber: String? = null
)

data class EquipmentDuplicateCandidateResponse(
    val id: UUID,
    val assetTag: String,
    val name: String,
    val serialNumber: String?,
    val manufacturer: String?,
    val model: String?,
    val duplicateScore: Int
)

data class EquipmentOverviewItemResponse(
    val id: UUID,
    val assetTag: String,
    val name: String,
    val category: String,
    val status: EquipmentStatus,
    val location: String?,
    val updatedAt: Instant
)
