package com.company.mro.wms.api

import com.company.mro.core.api.ApiSuccessResponse
import com.company.mro.core.api.successResponse
import com.company.mro.wms.application.WarehouseService
import com.company.mro.wms.dto.CreateWarehouseRequest
import com.company.mro.wms.dto.UpdateWarehouseRequest
import com.company.mro.wms.dto.WarehouseResponse
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
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/wms/warehouses")
@Tag(name = "WMS Warehouses")
class WarehouseController(
    private val warehouseService: WarehouseService
) {
    @GetMapping
    @Operation(summary = "List warehouses")
    @PreAuthorize("hasAuthority('WMS_READ')")
    fun getAll(): ApiSuccessResponse<List<WarehouseResponse>> = successResponse(warehouseService.getAll())

    @GetMapping("/{id}")
    @Operation(summary = "Get warehouse by ID")
    @PreAuthorize("hasAuthority('WMS_READ')")
    fun getById(@PathVariable id: UUID): ApiSuccessResponse<WarehouseResponse> =
        successResponse(warehouseService.getById(id))

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create warehouse")
    @PreAuthorize("hasAuthority('WMS_WAREHOUSE_MANAGE')")
    fun create(@Valid @RequestBody request: CreateWarehouseRequest): ApiSuccessResponse<WarehouseResponse> =
        successResponse(warehouseService.create(request))

    @PutMapping("/{id}")
    @Operation(summary = "Update warehouse")
    @PreAuthorize("hasAuthority('WMS_WAREHOUSE_MANAGE')")
    fun update(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateWarehouseRequest
    ): ApiSuccessResponse<WarehouseResponse> =
        successResponse(warehouseService.update(id, request))

    @PostMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate warehouse")
    @PreAuthorize("hasAuthority('WMS_WAREHOUSE_MANAGE')")
    fun deactivate(@PathVariable id: UUID): ApiSuccessResponse<WarehouseResponse> =
        successResponse(warehouseService.deactivate(id))

    @PostMapping("/{id}/assign-custodian")
    @Operation(summary = "Assign custodian to warehouse")
    @PreAuthorize("hasAuthority('WMS_WAREHOUSE_MANAGE')")
    fun assignCustodian(
        @PathVariable id: UUID,
        @RequestParam(required = false) custodianId: UUID?
    ): ApiSuccessResponse<WarehouseResponse> =
        successResponse(warehouseService.assignCustodian(id, custodianId))
}
