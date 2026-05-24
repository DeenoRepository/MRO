package com.company.mro.eps.api

import com.company.mro.core.api.ApiSuccessResponse
import com.company.mro.core.api.successResponse
import com.company.mro.eps.application.RoadmapReadinessService
import com.company.mro.eps.dto.RoadmapReadinessResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/eps/roadmap")
@Tag(name = "EPS Roadmap Readiness")
class RoadmapReadinessController(
    private val roadmapReadinessService: RoadmapReadinessService
) {
    @GetMapping("/readiness")
    @Operation(summary = "Get EPS functional expansion roadmap readiness")
    @PreAuthorize("hasAuthority('EPS_READ')")
    fun getReadiness(): ApiSuccessResponse<RoadmapReadinessResponse> =
        successResponse(roadmapReadinessService.getReadiness())
}
