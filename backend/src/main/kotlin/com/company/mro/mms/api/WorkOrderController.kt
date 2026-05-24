package com.company.mro.mms.api

import com.company.mro.mms.application.WorkOrderService
import com.company.mro.mms.dto.AssignWorkOrderRequest
import com.company.mro.mms.dto.CreateWorkOrderRequest
import com.company.mro.mms.dto.WorkOrderResponse
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
class WorkOrderController(
    private val workOrderService: WorkOrderService
) {
    @GetMapping
    @PreAuthorize("hasAuthority('MMS_READ')")
    fun getAll(): List<WorkOrderResponse> = workOrderService.getAll()

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('MMS_READ')")
    fun getById(@PathVariable id: UUID): WorkOrderResponse = workOrderService.getById(id)

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('MMS_WRITE')")
    fun create(@Valid @RequestBody request: CreateWorkOrderRequest): WorkOrderResponse =
        workOrderService.create(request)

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAuthority('MMS_ASSIGN')")
    fun assign(@PathVariable id: UUID, @Valid @RequestBody request: AssignWorkOrderRequest): WorkOrderResponse =
        workOrderService.assign(id, request)

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAuthority('MMS_COMPLETE')")
    fun complete(@PathVariable id: UUID): WorkOrderResponse = workOrderService.complete(id)

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('MMS_WRITE')")
    fun cancel(@PathVariable id: UUID): WorkOrderResponse = workOrderService.cancel(id)
}

