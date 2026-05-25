package com.company.mro.reporting.dto

import java.time.Instant
import java.util.UUID

data class EquipmentReliabilityResponse(
    val equipmentId: UUID,
    val periodStart: Instant?,
    val periodEnd: Instant?,
    val failuresCount: Int,
    val mttrHours: Double?,
    val mtbfHours: Double?
)
