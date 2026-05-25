package com.company.mro.srs.application

import com.company.mro.audit.application.AuditService
import com.company.mro.srs.dto.TicketAttachmentResponse
import com.company.mro.srs.persistence.TicketAttachmentEntity
import com.company.mro.srs.persistence.TicketAttachmentRepository
import com.company.mro.srs.persistence.TicketRepository
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.io.File
import java.nio.file.Files
import java.nio.file.Paths
import java.security.MessageDigest
import java.time.Instant
import java.util.UUID

@Service
class TicketAttachmentService(
    private val ticketRepository: TicketRepository,
    private val attachmentRepository: TicketAttachmentRepository,
    private val auditService: AuditService,
    @Value("\${mro.attachment-storage-dir:./attachments_storage}")
    private val storageDir: String
) {
    init {
        val dir = File(storageDir)
        if (!dir.exists()) {
            dir.mkdirs()
        }
    }

    @Transactional
    fun uploadAttachment(
        ticketId: UUID,
        fileName: String,
        fileBytes: ByteArray,
        mimeType: String?,
        fileSize: Long?,
        uploadedBy: UUID? = null
    ): TicketAttachmentResponse {
        if (!ticketRepository.existsById(ticketId)) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found")
        }

        val checksum = sha256(fileBytes)
        val attachmentId = UUID.randomUUID()
        val fileExtension = fileName.substringAfterLast('.', "")
        val targetFileName = if (fileExtension.isNotEmpty()) "$attachmentId.$fileExtension" else attachmentId.toString()
        val targetPath = Paths.get(storageDir, targetFileName)

        runCatching {
            Files.write(targetPath, fileBytes)
        }.onFailure {
            throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to save file locally", it)
        }

        val entity = TicketAttachmentEntity(
            id = attachmentId,
            ticketId = ticketId,
            fileName = fileName.trim(),
            filePath = targetPath.toAbsolutePath().toString(),
            mimeType = mimeType?.trim(),
            fileSize = fileSize,
            checksumSha256 = checksum,
            uploadedAt = Instant.now(),
            uploadedBy = uploadedBy
        )

        val saved = attachmentRepository.save(entity)
        auditService.log("SRS_ATTACHMENT_UPLOADED", "SRS", "ticket_attachment", saved.id.toString())

        return saved.toResponse()
    }

    @Transactional(readOnly = true)
    fun getAttachmentsByTicket(ticketId: UUID): List<TicketAttachmentResponse> {
        if (!ticketRepository.existsById(ticketId)) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Ticket not found")
        }
        return attachmentRepository.findAllByTicketId(ticketId).map { it.toResponse() }
    }

    @Transactional(readOnly = true)
    fun getAttachmentFile(attachmentId: UUID): File {
        val doc = attachmentRepository.findById(attachmentId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Attachment metadata not found") }
        val file = File(doc.filePath)
        if (!file.exists()) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Physical file not found")
        }
        return file
    }

    private fun sha256(bytes: ByteArray): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val hash = digest.digest(bytes)
        return hash.joinToString("") { "%02x".format(it) }
    }

    private fun TicketAttachmentEntity.toResponse() = TicketAttachmentResponse(
        id = id,
        ticketId = ticketId,
        fileName = fileName,
        mimeType = mimeType,
        fileSize = fileSize,
        uploadedBy = uploadedBy,
        uploadedAt = uploadedAt
    )
}
