package com.company.mro.wms.api

import com.company.mro.core.api.ApiSuccessResponse
import com.company.mro.core.api.successResponse
import com.company.mro.wms.application.PartService
import com.company.mro.wms.dto.CreatePartRequest
import com.company.mro.wms.dto.UpdatePartRequest
import com.company.mro.wms.dto.PartResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/wms/parts")
@Tag(name = "WMS Parts")
class PartController(
    private val partService: PartService
) {
    @GetMapping
    @Operation(summary = "List parts")
    @PreAuthorize("hasAuthority('WMS_READ')")
    fun getAll(): ApiSuccessResponse<List<PartResponse>> = successResponse(partService.getAll())

    @GetMapping("/{id}")
    @Operation(summary = "Get part by ID")
    @PreAuthorize("hasAuthority('WMS_READ')")
    fun getById(@PathVariable id: UUID): ApiSuccessResponse<PartResponse> =
        successResponse(partService.getById(id))

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create part")
    @PreAuthorize("hasAuthority('WMS_PART_MANAGE')")
    fun create(@Valid @RequestBody request: CreatePartRequest): ApiSuccessResponse<PartResponse> =
        successResponse(partService.create(request))

    @PutMapping("/{id}")
    @Operation(summary = "Update part")
    @PreAuthorize("hasAuthority('WMS_PART_MANAGE')")
    fun update(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdatePartRequest
    ): ApiSuccessResponse<PartResponse> =
        successResponse(partService.update(id, request))

    @PostMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate part")
    @PreAuthorize("hasAuthority('WMS_PART_MANAGE')")
    fun deactivate(@PathVariable id: UUID): ApiSuccessResponse<PartResponse> =
        successResponse(partService.deactivate(id))
}
