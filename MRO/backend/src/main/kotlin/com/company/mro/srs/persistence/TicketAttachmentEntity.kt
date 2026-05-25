package com.company.mro.srs.persistence

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "ticket_attachments", schema = "srs")
class TicketAttachmentEntity(
    @Id
    var id: UUID,

    @Column(name = "ticket_id", nullable = false)
    var ticketId: UUID,

    @Column(name = "file_name", nullable = false, length = 255)
    var fileName: String,

    @Column(name = "file_path", nullable = false, columnDefinition = "text")
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
    var uploadedBy: UUID? = null
)
