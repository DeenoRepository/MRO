package com.company.mro.srs.api

import com.company.mro.srs.application.TicketService
import com.company.mro.srs.dto.AddTicketCommentRequest
import com.company.mro.srs.dto.AssignTicketRequest
import com.company.mro.srs.dto.CreateTicketRequest
import com.company.mro.srs.dto.TicketCommentResponse
import com.company.mro.srs.dto.TicketResponse
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
class TicketController(
    private val ticketService: TicketService
) {
    @GetMapping
    @PreAuthorize("hasAuthority('SRS_READ')")
    fun getAll(): List<TicketResponse> = ticketService.getAll()

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('SRS_READ')")
    fun getById(@PathVariable id: UUID): TicketResponse = ticketService.getById(id)

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('SRS_WRITE')")
    fun create(@Valid @RequestBody request: CreateTicketRequest): TicketResponse = ticketService.create(request)

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAuthority('SRS_ASSIGN')")
    fun assign(@PathVariable id: UUID, @Valid @RequestBody request: AssignTicketRequest): TicketResponse =
        ticketService.assign(id, request)

    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasAuthority('SRS_RESOLVE')")
    fun resolve(@PathVariable id: UUID): TicketResponse = ticketService.resolve(id)

    @PostMapping("/{id}/close")
    @PreAuthorize("hasAuthority('SRS_RESOLVE')")
    fun close(@PathVariable id: UUID): TicketResponse = ticketService.close(id)

    @PostMapping("/{id}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('SRS_WRITE')")
    fun addComment(
        @PathVariable id: UUID,
        @Valid @RequestBody request: AddTicketCommentRequest
    ): TicketCommentResponse = ticketService.addComment(id, request)

    @PostMapping("/{id}/create-work-order")
    @PreAuthorize("hasAuthority('SRS_WRITE')")
    fun createWorkOrder(@PathVariable id: UUID): TicketResponse = ticketService.createWorkOrder(id)
}

