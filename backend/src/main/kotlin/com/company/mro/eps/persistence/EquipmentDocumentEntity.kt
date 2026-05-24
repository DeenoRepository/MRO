package com.company.mro.eps.persistence

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "equipment_documents", schema = "eps")
class EquipmentDocumentEntity(
    @Id
    var id: UUID,

    @Column(name = "equipment_id", nullable = false)
    var equipmentId: UUID,

    @Column(name = "document_type", nullable = false, length = 64)
    var documentType: String,

    @Column(name = "file_name", nullable = false, length = 255)
    var fileName: String,

    @Column(name = "file_path", nullable = false)
    var filePath: String,

    @Column(nullable = false)
    var version: Int = 1,

    @Column(name = "checksum_sha256", nullable = false, length = 64)
    var checksumSha256: String,
    @Column(name = "extracted_text")
    var extractedText: String? = null,

    @Column(name = "uploaded_at", nullable = false)
    var uploadedAt: Instant = Instant.now(),

    @Column(name = "uploaded_by")
    var uploadedBy: UUID? = null
)
