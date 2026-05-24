package com.company.mro.eps.persistence

import com.company.mro.eps.domain.EquipmentMediaType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "equipment_media", schema = "eps")
class EquipmentMediaEntity(
    @Id
    var id: UUID,
    @Column(name = "equipment_id", nullable = false)
    var equipmentId: UUID,
    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", nullable = false, length = 32)
    var mediaType: EquipmentMediaType,
    @Column(name = "file_name", nullable = false, length = 255)
    var fileName: String,
    @Column(name = "file_path", nullable = false)
    var filePath: String,
    @Column(name = "mime_type", length = 128)
    var mimeType: String? = null,
    @Column(name = "file_size")
    var fileSize: Long? = null,
    @Column(name = "checksum_sha256", nullable = false, length = 64)
    var checksumSha256: String,
    @Column(name = "uploaded_at", nullable = false)
    var uploadedAt: Instant = Instant.now(),
    @Column(name = "uploaded_by")
    var uploadedBy: UUID? = null,
    @Column(name = "annotation")
    var annotation: String? = null
)
