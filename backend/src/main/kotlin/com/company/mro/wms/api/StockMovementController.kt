package com.company.mro.wms.api

import com.company.mro.core.api.ApiSuccessResponse
import com.company.mro.core.api.successResponse
import com.company.mro.wms.application.StockService
import com.company.mro.wms.dto.CreateStockMovementRequest
import com.company.mro.wms.dto.StockMovementResponse
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
@RequestMapping("/api/v1/wms/stock-movements")
@Tag(name = "WMS Stock Movements")
class StockMovementController(
    private val stockService: StockService
) {
    @PostMapping("/receipt")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Receive stock")
    @PreAuthorize("hasAuthority('WMS_STOCK_RECEIVE')")
    fun receive(@Valid @RequestBody request: CreateStockMovementRequest): ApiSuccessResponse<StockMovementResponse> =
        successResponse(stockService.receiveStock(request))

    @PostMapping("/issue")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Issue stock")
    @PreAuthorize("hasAuthority('WMS_STOCK_ISSUE')")
    fun issue(@Valid @RequestBody request: CreateStockMovementRequest): ApiSuccessResponse<StockMovementResponse> =
        successResponse(stockService.issueStock(request))

    @PostMapping("/adjustment")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Adjust stock")
    @PreAuthorize("hasAuthority('WMS_STOCK_ADJUST')")
    fun adjust(@Valid @RequestBody request: CreateStockMovementRequest): ApiSuccessResponse<StockMovementResponse> =
        successResponse(stockService.adjustStock(request))

    @GetMapping("/warehouse/{warehouseId}")
    @Operation(summary = "Get stock movements by warehouse ID")
    @PreAuthorize("hasAuthority('WMS_READ')")
    fun getByWarehouse(@PathVariable warehouseId: UUID): ApiSuccessResponse<List<StockMovementResponse>> =
        successResponse(stockService.getMovementsByWarehouse(warehouseId))

    @GetMapping("/part/{partId}")
    @Operation(summary = "Get stock movements by part ID")
    @PreAuthorize("hasAuthority('WMS_READ')")
    fun getByPart(@PathVariable partId: UUID): ApiSuccessResponse<List<StockMovementResponse>> =
        successResponse(stockService.getMovementsByPart(partId))
}
