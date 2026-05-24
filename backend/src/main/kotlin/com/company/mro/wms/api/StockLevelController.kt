package com.company.mro.wms.api

import com.company.mro.core.api.ApiSuccessResponse
import com.company.mro.core.api.successResponse
import com.company.mro.wms.application.StockService
import com.company.mro.wms.dto.StockLevelResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/wms/stock-levels")
@Tag(name = "WMS Stock Levels")
class StockLevelController(
    private val stockService: StockService
) {
    @GetMapping
    @Operation(summary = "Search stock levels")
    @PreAuthorize("hasAuthority('WMS_READ')")
    fun search(
        @RequestParam(required = false) warehouseId: UUID?,
        @RequestParam(required = false) partId: UUID?,
        @RequestParam(required = false) belowMinimum: Boolean?
    ): ApiSuccessResponse<List<StockLevelResponse>> =
        successResponse(stockService.searchStockLevels(warehouseId, partId, belowMinimum))

    @GetMapping("/below-minimum")
    @Operation(summary = "Get all stock levels below minimum")
    @PreAuthorize("hasAuthority('WMS_READ')")
    fun getBelowMinimum(): ApiSuccessResponse<List<StockLevelResponse>> =
        successResponse(stockService.getBelowMinimumStock())

    @GetMapping("/warehouse/{warehouseId}/part/{partId}")
    @Operation(summary = "Get specific stock level")
    @PreAuthorize("hasAuthority('WMS_READ')")
    fun getStockLevel(
        @PathVariable warehouseId: UUID,
        @PathVariable partId: UUID
    ): ApiSuccessResponse<StockLevelResponse> =
        successResponse(stockService.getStockLevel(warehouseId, partId))
}
