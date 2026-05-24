package com.company.mro.wms.api

import com.company.mro.wms.application.StockMovementService
import com.company.mro.wms.dto.CreateStockMovementRequest
import com.company.mro.wms.dto.StockMovementResponse
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/wms/stock-movements")
class StockMovementController(
    private val stockMovementService: StockMovementService
) {
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('WMS_WRITE')")
    fun create(@Valid @RequestBody request: CreateStockMovementRequest): StockMovementResponse =
        stockMovementService.create(request)
}

