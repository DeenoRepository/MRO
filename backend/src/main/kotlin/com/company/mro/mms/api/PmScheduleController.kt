package com.company.mro.mms.api

import com.company.mro.core.api.ApiSuccessResponse
import com.company.mro.core.api.successResponse
import com.company.mro.mms.application.PmScheduleService
import com.company.mro.mms.dto.CreatePmScheduleRequest
import com.company.mro.mms.dto.PmScheduleResponse
import com.company.mro.mms.dto.UpdatePmScheduleRequest
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
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/mms/pm-schedules")
@Tag(name = "MMS PM Schedules")
class PmScheduleController(
    private val pmScheduleService: PmScheduleService
) {
    @GetMapping
    @Operation(summary = "List PM schedules")
    @PreAuthorize("hasAuthority('MMS_READ')")
    fun getAll(): ApiSuccessResponse<List<PmScheduleResponse>> = successResponse(pmScheduleService.getAll())

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create PM schedule")
    @PreAuthorize("hasAuthority('MMS_WRITE')")
    fun create(@Valid @RequestBody request: CreatePmScheduleRequest): ApiSuccessResponse<PmScheduleResponse> =
        successResponse(pmScheduleService.create(request))

    @PutMapping("/{id}")
    @Operation(summary = "Update PM schedule")
    @PreAuthorize("hasAuthority('MMS_WRITE')")
    fun update(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdatePmScheduleRequest
    @PostMapping("/generate-due")
    @Operation(summary = "Generate work orders for due PM schedules")
    @PreAuthorize("hasAuthority('MMS_WRITE')")
    fun generateDue(): ApiSuccessResponse<Int> = successResponse(pmScheduleService.generateDueWorkOrders())
}
