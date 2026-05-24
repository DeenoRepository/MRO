package com.company.mro.eps.application

import com.company.mro.audit.application.AuditService
import com.company.mro.eps.domain.TelemetryMetricType
import com.company.mro.eps.dto.IngestTelemetryRequest
import com.company.mro.eps.dto.TelemetryPointResponse
import com.company.mro.eps.persistence.EquipmentRepository
import com.company.mro.eps.persistence.EquipmentTelemetryEntity
import com.company.mro.eps.persistence.EquipmentTelemetryRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.Instant
import java.util.UUID

@Service
class EquipmentTelemetryService(
    private val equipmentRepository: EquipmentRepository,
    private val telemetryRepository: EquipmentTelemetryRepository,
    private val auditService: AuditService
) {
    @Transactional
    fun ingest(equipmentId: UUID, request: IngestTelemetryRequest): TelemetryPointResponse {
        if (!equipmentRepository.existsById(equipmentId)) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Equipment not found")
        }
        val now = Instant.now()
        val entity = EquipmentTelemetryEntity(
            id = UUID.randomUUID(),
            equipmentId = equipmentId,
            metricType = request.metricType,
            metricValue = request.metricValue,
            unit = request.unit?.trim(),
            recordedAt = request.recordedAt ?: now,
            source = request.source?.trim(),
            createdAt = now
        )
        val saved = telemetryRepository.save(entity)
        auditService.log("EPS_TELEMETRY_INGESTED", "EPS", "equipment_telemetry", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional(readOnly = true)
    fun getRecent(equipmentId: UUID, metricType: TelemetryMetricType?): List<TelemetryPointResponse> {
        if (!equipmentRepository.existsById(equipmentId)) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Equipment not found")
        }
        val records = if (metricType == null) {
            telemetryRepository.findTop100ByEquipmentIdOrderByRecordedAtDesc(equipmentId)
        } else {
            telemetryRepository.findTop100ByEquipmentIdAndMetricTypeOrderByRecordedAtDesc(equipmentId, metricType)
        }
        return records.map { it.toResponse() }
    }

    private fun EquipmentTelemetryEntity.toResponse(): TelemetryPointResponse = TelemetryPointResponse(
        id = id,
        equipmentId = equipmentId,
        metricType = metricType,
        metricValue = metricValue,
        unit = unit,
        recordedAt = recordedAt,
        source = source,
        createdAt = createdAt
    )
}
