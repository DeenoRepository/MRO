package com.company.mro.srs.api

import com.company.mro.core.api.ApiSuccessResponse
import com.company.mro.core.api.successResponse
import com.company.mro.srs.application.TicketService
import com.company.mro.srs.application.TicketCommentService
import com.company.mro.srs.application.TicketAttachmentService
import com.company.mro.srs.application.WorkOrderIntegrationService
import com.company.mro.srs.domain.TicketStatus
import com.company.mro.srs.dto.AddTicketCommentRequest
import com.company.mro.srs.dto.AssignTicketRequest
import com.company.mro.srs.dto.ChangeTicketStatusRequest
import com.company.mro.srs.dto.CreateTicketRequest
import com.company.mro.srs.dto.TicketAttachmentResponse
import com.company.mro.srs.dto.TicketCommentResponse
import com.company.mro.srs.dto.TicketResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.core.io.FileSystemResource
import org.springframework.core.io.Resource
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.server.ResponseStatusException
import java.util.UUID

@RestController
@RequestMapping("/api/v1/srs/tickets")
@Tag(name = "SRS Tickets")
class TicketController(
    private val ticketService: TicketService,
    private val ticketCommentService: TicketCommentService,
    private val ticketAttachmentService: TicketAttachmentService,
    private val workOrderIntegrationService: WorkOrderIntegrationService
) {
    @GetMapping
    @Operation(summary = "List and search tickets")
    @PreAuthorize("hasAuthority('SRS_READ')")
    fun getAll(
        @RequestParam(required = false) ticketNumber: String?,
        @RequestParam(required = false) status: TicketStatus?,
        @RequestParam(required = false) priority: String?,
        @RequestParam(required = false) requestTypeId: UUID?,
        @RequestParam(required = false) requesterId: UUID?,
        @RequestParam(required = false) assigneeId: UUID?,
        @RequestParam(required = false) equipmentId: UUID?
    ): ApiSuccessResponse<List<TicketResponse>> =
        successResponse(ticketService.searchTickets(ticketNumber, status, priority, requestTypeId, requesterId, assigneeId, equipmentId))

    @GetMapping("/{id}")
    @Operation(summary = "Get ticket by id")
    @PreAuthorize("hasAuthority('SRS_READ')")
    fun getById(@PathVariable id: UUID): ApiSuccessResponse<TicketResponse> = successResponse(ticketService.getById(id))

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create ticket")
    @PreAuthorize("hasAuthority('SRS_WRITE')")
    fun create(@Valid @RequestBody request: CreateTicketRequest): ApiSuccessResponse<TicketResponse> =
        successResponse(ticketService.create(request))

    @PostMapping("/{id}/assign")
    @Operation(summary = "Assign ticket")
    @PreAuthorize("hasAuthority('SRS_ASSIGN')")
    fun assign(
        @PathVariable id: UUID,
        @Valid @RequestBody request: AssignTicketRequest
    ): ApiSuccessResponse<TicketResponse> = successResponse(ticketService.assign(id, request))

    @PostMapping("/{id}/resolve")
    @Operation(summary = "Resolve ticket")
    @PreAuthorize("hasAuthority('SRS_RESOLVE')")
    fun resolve(@PathVariable id: UUID): ApiSuccessResponse<TicketResponse> = 
        successResponse(ticketService.changeStatus(id, "RESOLVED"))

    @PostMapping("/{id}/close")
    @Operation(summary = "Close ticket")
    @PreAuthorize("hasAuthority('SRS_RESOLVE')")
    fun close(@PathVariable id: UUID): ApiSuccessResponse<TicketResponse> = 
        successResponse(ticketService.changeStatus(id, "CLOSED"))

    @PostMapping("/{id}/status")
    @Operation(summary = "Change ticket status")
    @PreAuthorize("hasAuthority('SRS_RESOLVE')")
    fun changeStatus(
        @PathVariable id: UUID,
        @Valid @RequestBody request: ChangeTicketStatusRequest
    ): ApiSuccessResponse<TicketResponse> =
        successResponse(ticketService.changeStatus(id, request.status))

    @PostMapping("/{id}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Add ticket comment")
    @PreAuthorize("hasAuthority('SRS_WRITE')")
    fun addComment(
        @PathVariable id: UUID,
        @Valid @RequestBody request: AddTicketCommentRequest
    ): ApiSuccessResponse<TicketCommentResponse> = 
        successResponse(ticketCommentService.addComment(id, request))

    @GetMapping("/{id}/comments")
    @Operation(summary = "Get ticket comments")
    @PreAuthorize("hasAuthority('SRS_READ')")
    fun getComments(
        @PathVariable id: UUID,
        authentication: Authentication
    ): ApiSuccessResponse<List<TicketCommentResponse>> {
        val canViewInternal = authentication.authorities.any { it.authority in listOf("SRS_ASSIGN", "SRS_RESOLVE", "SRS_WRITE") }
        return successResponse(ticketCommentService.getComments(id, canViewInternal))
    }

    @PostMapping("/{id}/attachments")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Upload ticket attachment")
    @PreAuthorize("hasAuthority('SRS_WRITE')")
    fun uploadAttachment(
        @PathVariable id: UUID,
        @RequestParam("file") file: MultipartFile
    ): ApiSuccessResponse<TicketAttachmentResponse> {
        if (file.isEmpty) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty")
        }
        val response = ticketAttachmentService.uploadAttachment(
            ticketId = id,
            fileName = file.originalFilename ?: "uploaded_file",
            fileBytes = file.bytes,
            mimeType = file.contentType,
            fileSize = file.size
        )
        return successResponse(response)
    }

    @GetMapping("/{id}/attachments")
    @Operation(summary = "List attachments for a ticket")
    @PreAuthorize("hasAuthority('SRS_READ')")
    fun getAttachments(@PathVariable id: UUID): ApiSuccessResponse<List<TicketAttachmentResponse>> =
        successResponse(ticketAttachmentService.getAttachmentsByTicket(id))

    @GetMapping("/attachments/{attachmentId}/download")
    @Operation(summary = "Download a ticket attachment file")
    @PreAuthorize("hasAuthority('SRS_READ')")
    fun downloadAttachment(@PathVariable attachmentId: UUID): ResponseEntity<Resource> {
        val file = ticketAttachmentService.getAttachmentFile(attachmentId)
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

    @PostMapping("/{id}/create-work-order")
    @Operation(summary = "Create work order from ticket")
    @PreAuthorize("hasAuthority('SRS_WRITE')")
    fun createWorkOrder(@PathVariable id: UUID): ApiSuccessResponse<TicketResponse> {
        val ticket = ticketService.getById(id)
        val equipmentId = ticket.equipmentId ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Ticket must reference an equipment to create a work order")
        val description = ticket.description ?: ticket.title
        val priority = ticket.priority
        
        workOrderIntegrationService.createWorkOrderFromTicket(
            ticketId = id,
            equipmentId = equipmentId,
            priority = priority,
            description = description
        )
        
        return successResponse(ticketService.getById(id))
    }
}
