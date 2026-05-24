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
    companion object {
        private const val DEFAULT_SEARCH_LIMIT = 50
        private const val MAX_SEARCH_LIMIT = 500
    }
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

    @Transactional(readOnly = true)
    fun getDocumentVersions(equipmentId: UUID, documentType: String, fileName: String): List<EquipmentDocumentResponse> {
        if (!equipmentRepository.existsById(equipmentId)) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Equipment not found")
        }
        val normalizedType = documentType.trim()
        val normalizedName = fileName.trim()
        if (normalizedType.isEmpty() || normalizedName.isEmpty()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "documentType and fileName are required")
        }
        return documentRepository
            .findByEquipmentIdAndDocumentTypeIgnoreCaseAndFileNameOrderByVersionDesc(
                equipmentId = equipmentId,
                documentType = normalizedType,
                fileName = normalizedName
            )
            .map { it.toResponse() }
    }

    @Transactional
    fun uploadDocument(
        equipmentId: UUID,
        documentType: String,
        fileName: String,
        fileBytes: ByteArray,
        extractedText: String? = null
    ): EquipmentDocumentResponse {
        if (!equipmentRepository.existsById(equipmentId)) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Equipment not found")
        }

        val normalizedType = documentType.trim()
        val normalizedName = fileName.trim()
        if (normalizedType.isEmpty() || normalizedName.isEmpty()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "documentType and fileName are required")
        }

        val checksum = sha256(fileBytes)
        val fileId = UUID.randomUUID()
        val fileExtension = normalizedName.substringAfterLast('.', "")
        val targetFileName = if (fileExtension.isNotEmpty()) "$fileId.$fileExtension" else fileId.toString()
        val targetPath = Paths.get(storageDir, targetFileName)

        runCatching {
            Files.write(targetPath, fileBytes)
        }.onFailure {
            throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to save file locally", it)
        }

        val existingVersions = documentRepository.findByEquipmentIdAndDocumentTypeIgnoreCaseAndFileNameOrderByVersionDesc(
            equipmentId = equipmentId,
            documentType = normalizedType,
            fileName = normalizedName
        )
        val nextVersion = (existingVersions.firstOrNull()?.version ?: 0) + 1

        val entity = EquipmentDocumentEntity(
            id = fileId,
            equipmentId = equipmentId,
            documentType = normalizedType,
            fileName = normalizedName,
            filePath = targetPath.toAbsolutePath().toString(),
            version = nextVersion,
            checksumSha256 = checksum,
            extractedText = extractedText?.trim(),
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

    @Transactional(readOnly = true)
    fun searchDocuments(query: String, equipmentId: UUID?, limit: Int?): List<EquipmentDocumentResponse> {
        val normalizedQuery = query.trim()
        if (normalizedQuery.length < 2) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "query must be at least 2 characters")
        }
        val resolvedLimit = (limit ?: DEFAULT_SEARCH_LIMIT).coerceAtMost(MAX_SEARCH_LIMIT)
        if (resolvedLimit <= 0) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "limit must be greater than 0")
        }
        equipmentId?.let {
            if (!equipmentRepository.existsById(it)) {
                throw ResponseStatusException(HttpStatus.NOT_FOUND, "Equipment not found")
            }
        }
        return documentRepository.searchDocuments(normalizedQuery, equipmentId)
            .take(resolvedLimit)
            .map { it.toResponse() }
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
        extractedTextSnippet = extractedText?.take(500),
        uploadedAt = uploadedAt,
        uploadedBy = uploadedBy
    )
}
