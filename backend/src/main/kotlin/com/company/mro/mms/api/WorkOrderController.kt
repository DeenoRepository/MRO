package com.company.mro.mms.api

import com.company.mro.core.api.ApiSuccessResponse
import com.company.mro.core.api.successResponse
import com.company.mro.mms.application.WorkOrderService
import com.company.mro.mms.dto.AssignWorkOrderRequest
import com.company.mro.mms.dto.CompleteWorkOrderRequest
import com.company.mro.mms.dto.CreateTaskRequest
import com.company.mro.mms.dto.CreateWorkOrderRequest
import com.company.mro.mms.dto.HistoryResponse
import com.company.mro.mms.dto.TaskResponse
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
    @Operation(summary = "Assign work order to technician")
    @PreAuthorize("hasAuthority('MMS_ASSIGN')")
    fun assign(
        @PathVariable id: UUID,
        @Valid @RequestBody request: AssignWorkOrderRequest
    ): ApiSuccessResponse<WorkOrderResponse> = successResponse(workOrderService.assign(id, request))

    @PostMapping("/{id}/start")
    @Operation(summary = "Start executing work order")
    @PreAuthorize("hasAuthority('MMS_START')")
    fun start(@PathVariable id: UUID): ApiSuccessResponse<WorkOrderResponse> =
        successResponse(workOrderService.start(id))

    @PostMapping("/{id}/complete")
    @Operation(summary = "Complete work order")
    @PreAuthorize("hasAuthority('MMS_COMPLETE')")
    fun complete(
        @PathVariable id: UUID,
        @Valid @RequestBody request: CompleteWorkOrderRequest
    ): ApiSuccessResponse<WorkOrderResponse> =
        successResponse(workOrderService.complete(id, request))

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel work order")
    @PreAuthorize("hasAuthority('MMS_CANCEL')")
    fun cancel(@PathVariable id: UUID): ApiSuccessResponse<WorkOrderResponse> =
        successResponse(workOrderService.cancel(id))

    @GetMapping("/{id}/tasks")
    @Operation(summary = "Get tasks checklist for work order")
    @PreAuthorize("hasAuthority('MMS_READ')")
    fun getTasks(@PathVariable id: UUID): ApiSuccessResponse<List<TaskResponse>> =
        successResponse(workOrderService.getTasks(id))

    @PostMapping("/{id}/tasks")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Add a task to work order checklist")
    @PreAuthorize("hasAuthority('MMS_WRITE')")
    fun addTask(
        @PathVariable id: UUID,
        @Valid @RequestBody request: CreateTaskRequest
    ): ApiSuccessResponse<TaskResponse> =
        successResponse(workOrderService.addTask(id, request))

    @PostMapping("/tasks/{taskId}/complete")
    @Operation(summary = "Complete a specific task")
    @PreAuthorize("hasAuthority('MMS_COMPLETE')")
    fun completeTask(@PathVariable taskId: UUID): ApiSuccessResponse<TaskResponse> =
        successResponse(workOrderService.completeTask(taskId))

    @GetMapping("/{id}/history")
    @Operation(summary = "Get maintenance history events for work order")
    @PreAuthorize("hasAuthority('MMS_READ')")
    fun getHistory(@PathVariable id: UUID): ApiSuccessResponse<List<HistoryResponse>> =
        successResponse(workOrderService.getHistory(id))
}
