package com.company.mro.eps.application

import com.company.mro.audit.application.AuditService
import com.company.mro.eps.dto.EquipmentDocumentResponse
import com.company.mro.eps.persistence.EquipmentDocumentEntity
import com.company.mro.eps.persistence.EquipmentDocumentRepository
import com.company.mro.eps.persistence.EquipmentRepository
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
class EquipmentDocumentService(
    private val equipmentRepository: EquipmentRepository,
    private val documentRepository: EquipmentDocumentRepository,
    private val auditService: AuditService,
    @Value("\${mro.document-storage-dir:./documents_storage}")
    private val storageDir: String
) {
    init {
        val dir = File(storageDir)
        if (!dir.exists()) {
            dir.mkdirs()
        }
    }

    @Transactional(readOnly = true)
    fun getDocumentsByEquipment(equipmentId: UUID): List<EquipmentDocumentResponse> {
        if (!equipmentRepository.existsById(equipmentId)) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Equipment not found")
        }
        return documentRepository.findByEquipmentId(equipmentId).map { it.toResponse() }
    }

    @Transactional
    fun uploadDocument(
        equipmentId: UUID,
        documentType: String,
        fileName: String,
        fileBytes: ByteArray
    ): EquipmentDocumentResponse {
        if (!equipmentRepository.existsById(equipmentId)) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Equipment not found")
        }

        val checksum = sha256(fileBytes)
        val fileId = UUID.randomUUID()
        val fileExtension = fileName.substringAfterLast('.', "")
        val targetFileName = if (fileExtension.isNotEmpty()) "$fileId.$fileExtension" else fileId.toString()
        val targetPath = Paths.get(storageDir, targetFileName)

        runCatching {
            Files.write(targetPath, fileBytes)
        }.onFailure {
            throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to save file locally", it)
        }

        // Determine next version if file with the same name exists for this equipment
        val existingDocs = documentRepository.findByEquipmentId(equipmentId)
        val nextVersion = (existingDocs.filter { it.fileName == fileName }.maxOfOrNull { it.version } ?: 0) + 1

        val entity = EquipmentDocumentEntity(
            id = fileId,
            equipmentId = equipmentId,
            documentType = documentType.trim(),
            fileName = fileName.trim(),
            filePath = targetPath.toAbsolutePath().toString(),
            version = nextVersion,
            checksumSha256 = checksum,
            uploadedAt = Instant.now(),
            uploadedBy = null // No db user profile loaded
        )

        val saved = documentRepository.save(entity)
        auditService.log("EPS_DOCUMENT_UPLOADED", "EPS", "equipment_document", saved.id.toString())

        return saved.toResponse()
    }

    @Transactional(readOnly = true)
    fun getDocumentFile(documentId: UUID): File {
        val doc = documentRepository.findById(documentId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Document metadata not found") }
        val file = File(doc.filePath)
        if (!file.exists()) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Physical document file not found")
        }
        return file
    }

    private fun sha256(bytes: ByteArray): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val hash = digest.digest(bytes)
        return hash.joinToString("") { "%02x".format(it) }
    }

    private fun EquipmentDocumentEntity.toResponse() = EquipmentDocumentResponse(
        id = id,
        equipmentId = equipmentId,
        documentType = documentType,
        fileName = fileName,
        filePath = filePath,
        version = version,
        checksumSha256 = checksumSha256,
        uploadedAt = uploadedAt,
        uploadedBy = uploadedBy
    )
}
