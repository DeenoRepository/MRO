package com.company.mro.eps.api

import com.company.mro.core.api.ApiSuccessResponse
import com.company.mro.eps.application.EquipmentService
import com.company.mro.core.api.successResponse
import com.company.mro.eps.dto.CreateEquipmentRequest
import com.company.mro.eps.dto.ChangeEquipmentStatusRequest
import com.company.mro.eps.dto.EquipmentMobileListResponse
import com.company.mro.eps.dto.EquipmentQrPayloadResponse
import com.company.mro.eps.dto.EquipmentResponse
import com.company.mro.eps.dto.UpdateEquipmentRequest
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/eps/equipment")
@Tag(name = "EPS Equipment")
class EquipmentController(
    private val equipmentService: EquipmentService
) {
    @GetMapping
    @Operation(summary = "List equipment")
    @PreAuthorize("hasAuthority('EPS_READ')")
    fun getAll(): ApiSuccessResponse<List<EquipmentResponse>> = successResponse(equipmentService.getAll())

    @GetMapping("/mobile")
    @Operation(summary = "List equipment with compact payload for mobile clients")
    @PreAuthorize("hasAuthority('EPS_READ')")
    fun getMobileList(
        @RequestParam("limit", required = false) limit: Int?,
        @RequestParam("offset", required = false) offset: Int?
    ): ApiSuccessResponse<EquipmentMobileListResponse> = successResponse(equipmentService.getMobileList(limit, offset))

    @GetMapping("/{id}")
    @Operation(summary = "Get equipment by id")
    @PreAuthorize("hasAuthority('EPS_READ')")
    fun getById(@PathVariable id: UUID): ApiSuccessResponse<EquipmentResponse> =
        successResponse(equipmentService.getById(id))

    @GetMapping("/{id}/qr-payload")
    @Operation(summary = "Get QR payload for equipment quick actions")
    @PreAuthorize("hasAuthority('EPS_READ')")
    fun getQrPayload(@PathVariable id: UUID): ApiSuccessResponse<EquipmentQrPayloadResponse> =
        successResponse(equipmentService.getQrPayload(id))

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create equipment")
    @PreAuthorize("hasAuthority('EPS_WRITE')")
    fun create(@Valid @RequestBody request: CreateEquipmentRequest): ApiSuccessResponse<EquipmentResponse> =
        successResponse(equipmentService.create(request))

    @PutMapping("/{id}")
    @Operation(summary = "Update equipment")
    @PreAuthorize("hasAuthority('EPS_WRITE')")
    fun update(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateEquipmentRequest
    ): ApiSuccessResponse<EquipmentResponse> = successResponse(equipmentService.update(id, request))

    @PatchMapping("/{id}/status")
    @Operation(summary = "Change equipment lifecycle status")
    @PreAuthorize("hasAuthority('EPS_WRITE')")
    fun changeStatus(
        @PathVariable id: UUID,
        @RequestBody request: ChangeEquipmentStatusRequest
    ): ApiSuccessResponse<EquipmentResponse> = successResponse(equipmentService.transitionStatus(id, request))

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Deactivate equipment")
    @PreAuthorize("hasAuthority('EPS_WRITE')")
    fun deactivate(@PathVariable id: UUID) = equipmentService.deactivate(id)
}
