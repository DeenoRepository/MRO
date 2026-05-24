package com.company.mro.mms.api

import com.company.mro.core.api.ApiSuccessResponse
import com.company.mro.core.api.successResponse
import com.company.mro.mms.application.WorkOrderService
import com.company.mro.mms.dto.AssignWorkOrderRequest
import com.company.mro.mms.dto.CreateWorkOrderRequest
import com.company.mro.mms.dto.WorkOrderResponse
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
@RequestMapping("/api/v1/mms/work-orders")
@Tag(name = "MMS Work Orders")
class WorkOrderController(
    private val workOrderService: WorkOrderService
) {
    @GetMapping
    @Operation(summary = "List work orders")
    @PreAuthorize("hasAuthority('MMS_READ')")
    fun getAll(): ApiSuccessResponse<List<WorkOrderResponse>> = successResponse(workOrderService.getAll())

    @GetMapping("/{id}")
    @Operation(summary = "Get work order by id")
    @PreAuthorize("hasAuthority('MMS_READ')")
    fun getById(@PathVariable id: UUID): ApiSuccessResponse<WorkOrderResponse> =
        successResponse(workOrderService.getById(id))

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create work order")
    @PreAuthorize("hasAuthority('MMS_WRITE')")
    fun create(@Valid @RequestBody request: CreateWorkOrderRequest): ApiSuccessResponse<WorkOrderResponse> =
        successResponse(workOrderService.create(request))

    @PostMapping("/{id}/assign")
    @Operation(summary = "Assign work order")
    @PreAuthorize("hasAuthority('MMS_ASSIGN')")
    fun assign(
        @PathVariable id: UUID,
        @Valid @RequestBody request: AssignWorkOrderRequest
    ): ApiSuccessResponse<WorkOrderResponse> = successResponse(workOrderService.assign(id, request))

    @PostMapping("/{id}/complete")
    @Operation(summary = "Complete work order")
    @PreAuthorize("hasAuthority('MMS_COMPLETE')")
    fun complete(@PathVariable id: UUID): ApiSuccessResponse<WorkOrderResponse> =
        successResponse(workOrderService.complete(id))

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel work order")
    @PreAuthorize("hasAuthority('MMS_WRITE')")
    fun cancel(@PathVariable id: UUID): ApiSuccessResponse<WorkOrderResponse> =
        successResponse(workOrderService.cancel(id))
}
