package com.company.mro.eps.api

import com.company.mro.core.api.ApiSuccessResponse
import com.company.mro.core.api.successResponse
import com.company.mro.eps.application.EquipmentMediaService
import com.company.mro.eps.domain.EquipmentMediaType
import com.company.mro.eps.dto.EquipmentMediaResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.core.io.FileSystemResource
import org.springframework.core.io.Resource
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException
import java.util.UUID

@RestController
@RequestMapping("/api/v1/eps/equipment")
@Tag(name = "EPS Equipment Media")
class EquipmentMediaController(
    private val mediaService: EquipmentMediaService
) {
    @GetMapping("/{id}/media")
    @Operation(summary = "List media for an equipment")
    @PreAuthorize("hasAuthority('EPS_READ')")
    fun getMedia(@PathVariable id: UUID): ApiSuccessResponse<List<EquipmentMediaResponse>> =
        successResponse(mediaService.getMediaByEquipment(id))

    @PostMapping("/{id}/media")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Upload media for an equipment")
    @PreAuthorize("hasAnyAuthority('EPS_MEDIA_UPLOAD', 'EPS_WRITE')")
    fun uploadMedia(
        @PathVariable id: UUID,
        @RequestParam("mediaType") mediaType: EquipmentMediaType,
        @RequestParam("file") file: MultipartFile,
        @RequestParam("annotation", required = false) annotation: String?
    ): ApiSuccessResponse<EquipmentMediaResponse> {
        if (file.isEmpty) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty")
        }
        return successResponse(
            mediaService.uploadMedia(
                equipmentId = id,
                mediaType = mediaType,
                fileName = file.originalFilename ?: "uploaded_media",
                mimeType = file.contentType,
                fileBytes = file.bytes,
                annotation = annotation
            )
        )
    }

    @GetMapping("/media/{mediaId}/download")
    @Operation(summary = "Download equipment media file")
    @PreAuthorize("hasAuthority('EPS_READ')")
    fun downloadMedia(@PathVariable mediaId: UUID): ResponseEntity<Resource> {
        val file = mediaService.getMediaFile(mediaId)
        val resource = FileSystemResource(file)
        val headers = HttpHeaders().apply {
            add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"${file.name}\"")
            contentType = MediaType.APPLICATION_OCTET_STREAM
        }
        return ResponseEntity.ok()
            .headers(headers)
            .contentLength(file.length())
            .body(resource)
    }
}
