package com.company.mro.eps.api

import com.company.mro.core.api.ApiSuccessResponse
import com.company.mro.core.api.successResponse
import com.company.mro.eps.application.EquipmentDocumentService
import com.company.mro.eps.dto.EquipmentDocumentResponse
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
import java.util.UUID

@RestController
@RequestMapping("/api/v1/eps/equipment")
@Tag(name = "EPS Equipment Documents")
class EquipmentDocumentController(
    private val documentService: EquipmentDocumentService
) {
    @GetMapping("/{id}/documents")
    @Operation(summary = "List documents for an equipment")
    @PreAuthorize("hasAuthority('EPS_READ')")
    fun getDocuments(@PathVariable id: UUID): ApiSuccessResponse<List<EquipmentDocumentResponse>> {
        return successResponse(documentService.getDocumentsByEquipment(id))
    }

    @GetMapping("/{id}/documents/versions")
    @Operation(summary = "List document versions for an equipment document key")
    @PreAuthorize("hasAuthority('EPS_READ')")
    fun getDocumentVersions(
        @PathVariable id: UUID,
        @RequestParam("documentType") documentType: String,
        @RequestParam("fileName") fileName: String
    ): ApiSuccessResponse<List<EquipmentDocumentResponse>> {
        return successResponse(documentService.getDocumentVersions(id, documentType, fileName))
    }

    @GetMapping("/documents/search")
    @Operation(summary = "Search document metadata and extracted text")
    @PreAuthorize("hasAuthority('EPS_READ')")
    fun searchDocuments(
        @RequestParam("query") query: String,
        @RequestParam("equipmentId", required = false) equipmentId: UUID?
    ): ApiSuccessResponse<List<EquipmentDocumentResponse>> =
        successResponse(documentService.searchDocuments(query, equipmentId))

    @PostMapping("/{id}/documents")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Upload a document for an equipment")
    @PreAuthorize("hasAnyAuthority('EPS_WRITE', 'EPS_DOCUMENT_UPLOAD')")
    fun uploadDocument(
        @PathVariable id: UUID,
        @RequestParam("documentType") documentType: String,
        @RequestParam("file") file: MultipartFile,
        @RequestParam("extractedText", required = false) extractedText: String?
    ): ApiSuccessResponse<EquipmentDocumentResponse> {
        if (file.isEmpty) {
            throw org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty")
        }
        val response = documentService.uploadDocument(
            equipmentId = id,
            documentType = documentType,
            fileName = file.originalFilename ?: "uploaded_file",
            fileBytes = file.bytes,
            extractedText = extractedText
        )
        return successResponse(response)
    }

    @GetMapping("/documents/{documentId}/download")
    @Operation(summary = "Download an equipment document file")
    @PreAuthorize("hasAuthority('EPS_READ')")
    fun downloadDocument(@PathVariable documentId: UUID): ResponseEntity<Resource> {
        val file = documentService.getDocumentFile(documentId)
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
