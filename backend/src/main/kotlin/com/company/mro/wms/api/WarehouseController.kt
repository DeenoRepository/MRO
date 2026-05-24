package com.company.mro.wms.api

import com.company.mro.wms.application.WarehouseService
import com.company.mro.wms.dto.CreateWarehouseRequest
import com.company.mro.wms.dto.WarehouseResponse
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
class WarehouseController(
    private val warehouseService: WarehouseService
) {
    @GetMapping
    @PreAuthorize("hasAuthority('WMS_READ')")
    fun getAll(): List<WarehouseResponse> = warehouseService.getAll()

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('WMS_WRITE')")
    fun create(@Valid @RequestBody request: CreateWarehouseRequest): WarehouseResponse =
        warehouseService.create(request)
}

