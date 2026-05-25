package com.company.mro.eps.dto

import com.company.mro.eps.domain.EquipmentMediaType
import java.time.Instant
import java.util.UUID

data class EquipmentMediaResponse(
    val id: UUID,
    val equipmentId: UUID,
    val mediaType: EquipmentMediaType,
    val fileName: String,
    val filePath: String,
    val mimeType: String?,
    val fileSize: Long?,
    val checksumSha256: String,
    val annotation: String?,
    val uploadedAt: Instant,
    val uploadedBy: UUID?
)
