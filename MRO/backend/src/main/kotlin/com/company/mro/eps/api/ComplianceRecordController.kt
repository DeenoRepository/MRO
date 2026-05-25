package com.company.mro.eps.api

import com.company.mro.core.api.ApiSuccessResponse
import com.company.mro.core.api.successResponse
import com.company.mro.eps.application.ComplianceRecordService
import com.company.mro.eps.dto.ComplianceRecordResponse
import com.company.mro.eps.dto.CreateComplianceRecordRequest
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
import java.time.LocalDate
import java.util.UUID

@RestController
@RequestMapping("/api/v1/eps/compliance")
@Tag(name = "EPS Compliance")
class ComplianceRecordController(
    private val complianceRecordService: ComplianceRecordService
) {
    @PostMapping("/equipment/{equipmentId}/records")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create compliance record for equipment")
    @PreAuthorize("hasAuthority('EPS_COMPLIANCE_MANAGE')")
    fun create(
        @PathVariable equipmentId: UUID,
        @Valid @RequestBody request: CreateComplianceRecordRequest
    ): ApiSuccessResponse<ComplianceRecordResponse> =
        successResponse(complianceRecordService.create(equipmentId, request))

    @GetMapping("/equipment/{equipmentId}/records")
    @Operation(summary = "List compliance records for equipment")
    @PreAuthorize("hasAuthority('EPS_READ')")
    fun getByEquipment(@PathVariable equipmentId: UUID): ApiSuccessResponse<List<ComplianceRecordResponse>> =
        successResponse(complianceRecordService.getByEquipment(equipmentId))

    @GetMapping("/records/expiring")
    @Operation(summary = "List compliance records expiring before a date")
    @PreAuthorize("hasAuthority('EPS_READ')")
    fun getExpiring(
        @RequestParam("beforeDate") beforeDate: LocalDate
    ): ApiSuccessResponse<List<ComplianceRecordResponse>> =
        successResponse(complianceRecordService.getExpiring(beforeDate))
}
