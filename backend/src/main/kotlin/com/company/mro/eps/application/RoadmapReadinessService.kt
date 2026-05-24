package com.company.mro.eps.application

import com.company.mro.eps.dto.RoadmapPhaseCoverage
import com.company.mro.eps.dto.RoadmapReadinessResponse
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class RoadmapReadinessService {
    private val implementedCapabilities: Map<String, Boolean> = linkedMapOf(
        "advanced_categories" to true,
        "equipment_hierarchy" to true,
        "document_versioning" to true,
        "qr_workflows" to true,
        "health_metrics_reliability" to true,
        "compliance_tracking" to true,
        "advanced_approvals" to true,
        "change_impact_analysis" to true,
        "iot_telemetry_foundation" to true,
        "analytics_reporting" to true,
        "mobile_optimization_backend" to true,
        "external_integrations_log" to true,
        "ai_smart_search" to true,
        "ai_duplicate_detection" to true,
        "media_photos" to true,
        "ocr_search_ready_documents" to true,
        "performance_read_optimization" to true,
        "gis_location_features" to false,
        "digital_twin_foundation" to false
    )

    private val phaseMapping: Map<String, List<String>> = mapOf(
        "Phase 1" to listOf(
            "advanced_categories",
            "equipment_hierarchy",
            "document_versioning",
            "qr_workflows"
        ),
        "Phase 2" to listOf(
            "health_metrics_reliability",
            "compliance_tracking",
            "advanced_approvals",
            "change_impact_analysis"
        ),
        "Phase 3" to listOf(
            "iot_telemetry_foundation",
            "gis_location_features",
            "analytics_reporting",
            "mobile_optimization_backend"
        ),
        "Phase 4" to listOf(
            "ai_smart_search",
            "ai_duplicate_detection",
            "digital_twin_foundation",
            "external_integrations_log"
        )
    )

    @Transactional(readOnly = true)
    fun getReadiness(): RoadmapReadinessResponse {
        val totalPlanned = implementedCapabilities.size
        val totalImplemented = implementedCapabilities.values.count { it }
        val phaseCoverage = phaseMapping.map { (phase, capabilities) ->
            val implemented = capabilities.count { implementedCapabilities[it] == true }
            RoadmapPhaseCoverage(phase = phase, implemented = implemented, total = capabilities.size)
        }
        return RoadmapReadinessResponse(
            implementedCapabilities = implementedCapabilities,
            phaseCoverage = phaseCoverage,
            totalImplemented = totalImplemented,
            totalPlanned = totalPlanned
        )
    }
}
