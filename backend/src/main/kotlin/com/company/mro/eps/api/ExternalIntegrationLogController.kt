package com.company.mro.eps.api

import com.company.mro.core.api.ApiSuccessResponse
import com.company.mro.core.api.successResponse
import com.company.mro.eps.application.ExternalIntegrationLogService
import com.company.mro.eps.dto.CreateExternalIntegrationLogRequest
import com.company.mro.eps.dto.ExternalIntegrationLogResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/eps/integrations/logs")
@Tag(name = "EPS External Integration Logs")
class ExternalIntegrationLogController(
    private val integrationLogService: ExternalIntegrationLogService
) {
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create external integration log record")
    @PreAuthorize("hasAuthority('EPS_INTEGRATION_LOG_WRITE')")
    fun create(
        @Valid @RequestBody request: CreateExternalIntegrationLogRequest
    ): ApiSuccessResponse<ExternalIntegrationLogResponse> = successResponse(integrationLogService.create(request))

    @GetMapping
    @Operation(summary = "Get recent external integration logs")
    @PreAuthorize("hasAuthority('EPS_INTEGRATION_LOG_READ')")
    fun getRecent(
        @RequestParam("integrationName", required = false) integrationName: String?
    ): ApiSuccessResponse<List<ExternalIntegrationLogResponse>> = successResponse(integrationLogService.getRecent(integrationName))
}
