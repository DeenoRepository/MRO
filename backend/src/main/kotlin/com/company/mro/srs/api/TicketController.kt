package com.company.mro.srs.api

import com.company.mro.core.api.ApiSuccessResponse
import com.company.mro.core.api.successResponse
import com.company.mro.srs.application.TicketService
import com.company.mro.srs.dto.AddTicketCommentRequest
import com.company.mro.srs.dto.AssignTicketRequest
import com.company.mro.srs.dto.CreateTicketRequest
import com.company.mro.srs.dto.TicketCommentResponse
import com.company.mro.srs.dto.TicketResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/srs/tickets")
@Tag(name = "SRS Tickets")
class TicketController(
    private val ticketService: TicketService
) {
    @GetMapping
    @Operation(summary = "List tickets")
    @PreAuthorize("hasAuthority('SRS_READ')")
    fun getAll(): ApiSuccessResponse<List<TicketResponse>> = successResponse(ticketService.getAll())

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
    fun resolve(@PathVariable id: UUID): ApiSuccessResponse<TicketResponse> = successResponse(ticketService.resolve(id))

    @PostMapping("/{id}/close")
    @Operation(summary = "Close ticket")
    @PreAuthorize("hasAuthority('SRS_RESOLVE')")
    fun close(@PathVariable id: UUID): ApiSuccessResponse<TicketResponse> = successResponse(ticketService.close(id))

    @PostMapping("/{id}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Add ticket comment")
    @PreAuthorize("hasAuthority('SRS_WRITE')")
    fun addComment(
        @PathVariable id: UUID,
        @Valid @RequestBody request: AddTicketCommentRequest
    ): ApiSuccessResponse<TicketCommentResponse> = successResponse(ticketService.addComment(id, request))

    @PostMapping("/{id}/create-work-order")
    @Operation(summary = "Create work order from ticket")
    @PreAuthorize("hasAuthority('SRS_WRITE')")
    fun createWorkOrder(@PathVariable id: UUID): ApiSuccessResponse<TicketResponse> =
        successResponse(ticketService.createWorkOrder(id))
}
