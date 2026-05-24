package com.company.mro.eps.dto

data class RoadmapPhaseCoverage(
    val phase: String,
    val implemented: Int,
    val total: Int
)

data class RoadmapReadinessResponse(
    val implementedCapabilities: Map<String, Boolean>,
    val phaseCoverage: List<RoadmapPhaseCoverage>,
    val totalImplemented: Int,
    val totalPlanned: Int
)
