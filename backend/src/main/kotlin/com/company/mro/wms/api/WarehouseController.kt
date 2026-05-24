package com.company.mro.wms.api

import com.company.mro.core.api.ApiSuccessResponse
import com.company.mro.core.api.successResponse
import com.company.mro.wms.application.WarehouseService
import com.company.mro.wms.dto.CreateWarehouseRequest
import com.company.mro.wms.dto.WarehouseResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

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

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create warehouse")
    @PreAuthorize("hasAuthority('WMS_WRITE')")
    fun create(@Valid @RequestBody request: CreateWarehouseRequest): ApiSuccessResponse<WarehouseResponse> =
        successResponse(warehouseService.create(request))
}
