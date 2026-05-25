package com.company.mro.eps.api

import com.company.mro.core.api.ApiSuccessResponse
import com.company.mro.core.api.successResponse
import com.company.mro.eps.application.EquipmentTelemetryService
import com.company.mro.eps.domain.TelemetryMetricType
import com.company.mro.eps.dto.IngestTelemetryRequest
import com.company.mro.eps.dto.TelemetryPointResponse
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
@RequestMapping("/api/v1/eps/equipment")
@Tag(name = "EPS Telemetry")
class EquipmentTelemetryController(
    private val telemetryService: EquipmentTelemetryService
) {
    @PostMapping("/{id}/telemetry")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Ingest telemetry point for equipment")
    @PreAuthorize("hasAuthority('EPS_TELEMETRY_WRITE')")
    fun ingest(
        @PathVariable id: UUID,
        @Valid @RequestBody request: IngestTelemetryRequest
    ): ApiSuccessResponse<TelemetryPointResponse> = successResponse(telemetryService.ingest(id, request))

    @GetMapping("/{id}/telemetry")
    @Operation(summary = "List recent telemetry points for equipment")
    @PreAuthorize("hasAuthority('EPS_READ')")
    fun getRecent(
        @PathVariable id: UUID,
        @RequestParam("metricType", required = false) metricType: TelemetryMetricType?
    ): ApiSuccessResponse<List<TelemetryPointResponse>> = successResponse(telemetryService.getRecent(id, metricType))
}
