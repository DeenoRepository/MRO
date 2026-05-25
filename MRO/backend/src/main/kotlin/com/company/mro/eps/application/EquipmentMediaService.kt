package com.company.mro.eps.application

import com.company.mro.audit.application.AuditService
import com.company.mro.eps.domain.EquipmentMediaType
import com.company.mro.eps.dto.EquipmentMediaResponse
import com.company.mro.eps.persistence.EquipmentMediaEntity
import com.company.mro.eps.persistence.EquipmentMediaRepository
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
class EquipmentMediaService(
    private val equipmentRepository: EquipmentRepository,
    private val mediaRepository: EquipmentMediaRepository,
    private val auditService: AuditService,
    @Value("\${mro.media-storage-dir:./media_storage}")
    private val storageDir: String
) {
    init {
        val dir = File(storageDir)
        if (!dir.exists()) {
            dir.mkdirs()
        }
    }

    @Transactional(readOnly = true)
    fun getMediaByEquipment(equipmentId: UUID): List<EquipmentMediaResponse> {
        if (!equipmentRepository.existsById(equipmentId)) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Equipment not found")
        }
        return mediaRepository.findByEquipmentIdOrderByUploadedAtDesc(equipmentId).map { it.toResponse() }
    }

    @Transactional
    fun uploadMedia(
        equipmentId: UUID,
        mediaType: EquipmentMediaType,
        fileName: String,
        mimeType: String?,
        fileBytes: ByteArray,
        annotation: String?
    ): EquipmentMediaResponse {
        if (!equipmentRepository.existsById(equipmentId)) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Equipment not found")
        }
        val normalizedName = fileName.trim()
        if (normalizedName.isEmpty()) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "fileName is required")
        }

        val checksum = sha256(fileBytes)
        val fileId = UUID.randomUUID()
        val ext = normalizedName.substringAfterLast('.', "")
        val targetName = if (ext.isNotEmpty()) "$fileId.$ext" else fileId.toString()
        val targetPath = Paths.get(storageDir, targetName)

        runCatching { Files.write(targetPath, fileBytes) }.onFailure {
            throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to save media file", it)
        }

        val entity = EquipmentMediaEntity(
            id = fileId,
            equipmentId = equipmentId,
            mediaType = mediaType,
            fileName = normalizedName,
            filePath = targetPath.toAbsolutePath().toString(),
            mimeType = mimeType?.trim(),
            fileSize = fileBytes.size.toLong(),
            checksumSha256 = checksum,
            annotation = annotation?.trim(),
            uploadedAt = Instant.now(),
            uploadedBy = null
        )
        val saved = mediaRepository.save(entity)
        auditService.log("EPS_MEDIA_UPLOADED", "EPS", "equipment_media", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional(readOnly = true)
    fun getMediaFile(mediaId: UUID): File {
        val media = mediaRepository.findById(mediaId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Media metadata not found") }
        val file = File(media.filePath)
        if (!file.exists()) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Physical media file not found")
        }
        return file
    }

    private fun sha256(bytes: ByteArray): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val hash = digest.digest(bytes)
        return hash.joinToString("") { "%02x".format(it) }
    }

    private fun EquipmentMediaEntity.toResponse(): EquipmentMediaResponse = EquipmentMediaResponse(
        id = id,
        equipmentId = equipmentId,
        mediaType = mediaType,
        fileName = fileName,
        filePath = filePath,
        mimeType = mimeType,
        fileSize = fileSize,
        checksumSha256 = checksumSha256,
        annotation = annotation,
        uploadedAt = uploadedAt,
        uploadedBy = uploadedBy
    )
}
