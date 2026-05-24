package com.company.mro.eps.dto

import java.time.Instant
import java.util.UUID

data class EquipmentDocumentResponse(
    val id: UUID,
    val equipmentId: UUID,
    val documentType: String,
    val fileName: String,
    val filePath: String,
    val version: Int,
    val checksumSha256: String,
    val extractedTextSnippet: String?,
    val uploadedAt: Instant,
    val uploadedBy: UUID?
)
