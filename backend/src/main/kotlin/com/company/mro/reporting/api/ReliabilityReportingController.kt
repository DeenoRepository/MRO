package com.company.mro.reporting.api

import com.company.mro.core.api.ApiSuccessResponse
import com.company.mro.core.api.successResponse
import com.company.mro.reporting.application.ReliabilityReportingService
import com.company.mro.reporting.dto.EquipmentReliabilityResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.util.UUID

@RestController
@RequestMapping("/api/v1/reporting/reliability")
@Tag(name = "Reporting Reliability")
class ReliabilityReportingController(
    private val reliabilityReportingService: ReliabilityReportingService
) {
    @GetMapping("/equipment/{equipmentId}")
    @Operation(summary = "Get MTBF/MTTR reliability metrics for equipment")
    @PreAuthorize("hasAuthority('EPS_READ')")
    fun getEquipmentReliability(
        @PathVariable equipmentId: UUID,
        @RequestParam("from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) from: Instant?,
        @RequestParam("to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) to: Instant?
    ): ApiSuccessResponse<EquipmentReliabilityResponse> =
        successResponse(reliabilityReportingService.getEquipmentReliability(equipmentId, from, to))
}
