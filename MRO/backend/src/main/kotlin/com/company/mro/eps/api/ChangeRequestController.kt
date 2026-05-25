package com.company.mro.eps.api

import com.company.mro.core.api.ApiSuccessResponse
import com.company.mro.core.api.successResponse
import com.company.mro.eps.application.ChangeRequestService
import com.company.mro.eps.dto.ChangeRequestResponse
import com.company.mro.eps.dto.ChangeRequestAnalyticsResponse
import com.company.mro.eps.dto.CreateChangeRequest
import com.company.mro.eps.dto.DecideChangeRequest
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
@RequestMapping("/api/v1/eps/change-requests")
@Tag(name = "EPS Change Requests")
class ChangeRequestController(
    private val changeRequestService: ChangeRequestService
) {
    @GetMapping("/analytics")
    @Operation(summary = "Get change request approval analytics")
    @PreAuthorize("hasAuthority('EPS_READ')")
    fun getAnalytics(): ApiSuccessResponse<ChangeRequestAnalyticsResponse> {
        return successResponse(changeRequestService.getAnalytics())
    }

    @GetMapping
    @Operation(summary = "List all change requests")
    @PreAuthorize("hasAuthority('EPS_READ')")
    fun getAll(): ApiSuccessResponse<List<ChangeRequestResponse>> {
        return successResponse(changeRequestService.getAll())
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get change request by id")
    @PreAuthorize("hasAuthority('EPS_READ')")
    fun getById(@PathVariable id: UUID): ApiSuccessResponse<ChangeRequestResponse> {
        return successResponse(changeRequestService.getById(id))
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Submit a change request")
    @PreAuthorize("hasAuthority('EPS_WRITE')")
    fun create(
        @Valid @RequestBody request: CreateChangeRequest
    ): ApiSuccessResponse<ChangeRequestResponse> {
        return successResponse(changeRequestService.createChangeRequest(request))
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Approve and apply a change request")
    @PreAuthorize("hasAuthority('EPS_APPROVE')")
    fun approve(
        @PathVariable id: UUID,
        @Valid @RequestBody decision: DecideChangeRequest
    ): ApiSuccessResponse<ChangeRequestResponse> {
        return successResponse(changeRequestService.approve(id, decision))
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Reject a change request")
    @PreAuthorize("hasAuthority('EPS_APPROVE')")
    fun reject(
        @PathVariable id: UUID,
        @Valid @RequestBody decision: DecideChangeRequest
    ): ApiSuccessResponse<ChangeRequestResponse> {
        return successResponse(changeRequestService.reject(id, decision))
    }
}
