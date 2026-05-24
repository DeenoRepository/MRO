package com.company.mro.srs.api

import com.company.mro.core.api.ApiSuccessResponse
import com.company.mro.core.api.successResponse
import com.company.mro.srs.application.RequestTypeService
import com.company.mro.srs.dto.CreateRequestTypeRequest
import com.company.mro.srs.dto.RequestTypeResponse
import com.company.mro.srs.dto.UpdateRequestTypeRequest
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/v1/srs/request-types")
@Tag(name = "SRS Request Types")
class RequestTypeController(
    private val requestTypeService: RequestTypeService
) {
    @GetMapping
    @Operation(summary = "List all request types")
    @PreAuthorize("hasAuthority('SRS_READ')")
    fun getAll(): ApiSuccessResponse<List<RequestTypeResponse>> =
        successResponse(requestTypeService.getAll())

    @GetMapping("/{id}")
    @Operation(summary = "Get request type by id")
    @PreAuthorize("hasAuthority('SRS_READ')")
    fun getById(@PathVariable id: UUID): ApiSuccessResponse<RequestTypeResponse> =
        successResponse(requestTypeService.getById(id))

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create request type")
    @PreAuthorize("hasAuthority('SRS_WRITE')")
    fun create(@Valid @RequestBody request: CreateRequestTypeRequest): ApiSuccessResponse<RequestTypeResponse> =
        successResponse(requestTypeService.create(request))

    @PutMapping("/{id}")
    @Operation(summary = "Update request type")
    @PreAuthorize("hasAuthority('SRS_WRITE')")
    fun update(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateRequestTypeRequest
    ): ApiSuccessResponse<RequestTypeResponse> =
        successResponse(requestTypeService.update(id, request))

    @DeleteMapping("/{id}")
    @Operation(summary = "Deactivate request type")
    @PreAuthorize("hasAuthority('SRS_WRITE')")
    fun deactivate(@PathVariable id: UUID): ApiSuccessResponse<RequestTypeResponse> =
        successResponse(requestTypeService.deactivate(id))
}
