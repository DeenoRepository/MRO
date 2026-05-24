package com.company.mro.eps.persistence

import com.company.mro.eps.domain.TelemetryMetricType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "equipment_telemetry", schema = "eps")
class EquipmentTelemetryEntity(
    @Id
    var id: UUID,
    @Column(name = "equipment_id", nullable = false)
    var equipmentId: UUID,
    @Enumerated(EnumType.STRING)
    @Column(name = "metric_type", nullable = false, length = 32)
    var metricType: TelemetryMetricType,
    @Column(name = "metric_value", nullable = false, precision = 18, scale = 4)
    var metricValue: BigDecimal,
    @Column(length = 32)
    var unit: String? = null,
    @Column(name = "recorded_at", nullable = false)
    var recordedAt: Instant,
    @Column(length = 64)
    var source: String? = null,
    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now()
)
