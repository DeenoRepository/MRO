package com.company.mro.wms.api

import com.company.mro.core.api.ApiSuccessResponse
import com.company.mro.core.api.successResponse
import com.company.mro.wms.application.WarehouseTransferService
import com.company.mro.wms.dto.CreateWarehouseTransferRequest
import com.company.mro.wms.dto.WarehouseTransferResponse
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
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/wms/transfers")
@Tag(name = "WMS Warehouse Transfers")
class WarehouseTransferController(
    private val transferService: WarehouseTransferService
) {
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create warehouse transfer")
    @PreAuthorize("hasAuthority('WMS_TRANSFER_MANAGE')")
    fun create(
        @Valid @RequestBody request: CreateWarehouseTransferRequest
    ): ApiSuccessResponse<WarehouseTransferResponse> =
        successResponse(transferService.create(request))

    @GetMapping
    @Operation(summary = "Search warehouse transfers")
    @PreAuthorize("hasAuthority('WMS_READ')")
    fun search(
        @RequestParam(required = false) sourceWarehouseId: UUID?,
        @RequestParam(required = false) targetWarehouseId: UUID?,
        @RequestParam(required = false) status: String?
    ): ApiSuccessResponse<List<WarehouseTransferResponse>> =
        successResponse(transferService.searchTransfers(sourceWarehouseId, targetWarehouseId, status))

    @GetMapping("/{id}")
    @Operation(summary = "Get warehouse transfer by ID")
    @PreAuthorize("hasAuthority('WMS_READ')")
    fun getById(@PathVariable id: UUID): ApiSuccessResponse<WarehouseTransferResponse> =
        successResponse(transferService.getById(id))

    @PostMapping("/{id}/submit")
    @Operation(summary = "Submit warehouse transfer (DRAFT -> REQUESTED)")
    @PreAuthorize("hasAuthority('WMS_TRANSFER_MANAGE')")
    fun submit(@PathVariable id: UUID): ApiSuccessResponse<WarehouseTransferResponse> =
        successResponse(transferService.submit(id))

    @PostMapping("/{id}/approve")
    @Operation(summary = "Approve warehouse transfer (REQUESTED -> APPROVED)")
    @PreAuthorize("hasAuthority('WMS_TRANSFER_MANAGE')")
    fun approve(@PathVariable id: UUID): ApiSuccessResponse<WarehouseTransferResponse> =
        successResponse(transferService.approve(id))

    @PostMapping("/{id}/start")
    @Operation(summary = "Start warehouse transfer shipment (APPROVED -> IN_TRANSIT)")
    @PreAuthorize("hasAuthority('WMS_TRANSFER_MANAGE')")
    fun start(@PathVariable id: UUID): ApiSuccessResponse<WarehouseTransferResponse> =
        successResponse(transferService.start(id))

    @PostMapping("/{id}/complete")
    @Operation(summary = "Complete warehouse transfer (IN_TRANSIT -> COMPLETED)")
    @PreAuthorize("hasAuthority('WMS_TRANSFER_MANAGE')")
    fun complete(@PathVariable id: UUID): ApiSuccessResponse<WarehouseTransferResponse> =
        successResponse(transferService.complete(id))

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel warehouse transfer")
    @PreAuthorize("hasAuthority('WMS_TRANSFER_MANAGE')")
    fun cancel(@PathVariable id: UUID): ApiSuccessResponse<WarehouseTransferResponse> =
        successResponse(transferService.cancel(id))
}
