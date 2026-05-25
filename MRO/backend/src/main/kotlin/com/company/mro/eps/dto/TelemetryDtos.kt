package com.company.mro.eps.dto

import com.company.mro.eps.domain.TelemetryMetricType
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

data class IngestTelemetryRequest(
    @field:NotNull
    val metricType: TelemetryMetricType,
    @field:NotNull
    val metricValue: BigDecimal,
    @field:Size(max = 32)
    val unit: String? = null,
    val recordedAt: Instant? = null,
    @field:Size(max = 64)
    val source: String? = null
)

data class TelemetryPointResponse(
    val id: UUID,
    val equipmentId: UUID,
    val metricType: TelemetryMetricType,
    val metricValue: BigDecimal,
    val unit: String?,
    val recordedAt: Instant,
    val source: String?,
    val createdAt: Instant
)
