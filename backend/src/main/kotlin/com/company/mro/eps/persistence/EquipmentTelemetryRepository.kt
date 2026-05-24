package com.company.mro.eps.persistence

import com.company.mro.eps.domain.TelemetryMetricType
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface EquipmentTelemetryRepository : JpaRepository<EquipmentTelemetryEntity, UUID> {
    fun findTop100ByEquipmentIdOrderByRecordedAtDesc(equipmentId: UUID): List<EquipmentTelemetryEntity>
    fun findTop100ByEquipmentIdAndMetricTypeOrderByRecordedAtDesc(
        equipmentId: UUID,
        metricType: TelemetryMetricType
    ): List<EquipmentTelemetryEntity>
}
