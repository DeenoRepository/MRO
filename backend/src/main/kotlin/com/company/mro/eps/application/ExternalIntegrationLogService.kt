package com.company.mro.eps.application

import com.company.mro.audit.application.AuditService
import com.company.mro.eps.dto.CreateExternalIntegrationLogRequest
import com.company.mro.eps.dto.ExternalIntegrationLogResponse
import com.company.mro.eps.persistence.ExternalIntegrationLogEntity
import com.company.mro.eps.persistence.ExternalIntegrationLogRepository
import com.company.mro.eps.persistence.EquipmentRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.Instant
import java.util.UUID

@Service
class ExternalIntegrationLogService(
    private val integrationLogRepository: ExternalIntegrationLogRepository,
    private val equipmentRepository: EquipmentRepository,
    private val auditService: AuditService
) {
    @Transactional
    fun create(request: CreateExternalIntegrationLogRequest): ExternalIntegrationLogResponse {
        request.equipmentId?.let {
            if (!equipmentRepository.existsById(it)) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Referenced equipment not found")
            }
        }
        val entity = ExternalIntegrationLogEntity(
            id = UUID.randomUUID(),
            integrationName = request.integrationName.trim().uppercase(),
            direction = request.direction.trim().uppercase(),
            operation = request.operation.trim().uppercase(),
            equipmentId = request.equipmentId,
            requestPayload = request.requestPayload?.trim(),
            responsePayload = request.responsePayload?.trim(),
            statusCode = request.statusCode,
            status = request.status.trim().uppercase(),
            errorMessage = request.errorMessage?.trim(),
            createdAt = Instant.now()
        )
        val saved = integrationLogRepository.save(entity)
        auditService.log("EPS_EXTERNAL_INTEGRATION_LOGGED", "EPS", "external_integration_log", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional(readOnly = true)
    fun getRecent(integrationName: String?): List<ExternalIntegrationLogResponse> {
        val logs = if (integrationName.isNullOrBlank()) {
            integrationLogRepository.findTop200ByOrderByCreatedAtDesc()
        } else {
            integrationLogRepository.findTop200ByIntegrationNameOrderByCreatedAtDesc(integrationName.trim().uppercase())
        }
        return logs.map { it.toResponse() }
    }

    private fun ExternalIntegrationLogEntity.toResponse(): ExternalIntegrationLogResponse = ExternalIntegrationLogResponse(
        id = id,
        integrationName = integrationName,
        direction = direction,
        operation = operation,
        equipmentId = equipmentId,
        requestPayload = requestPayload,
        responsePayload = responsePayload,
        statusCode = statusCode,
        status = status,
        errorMessage = errorMessage,
        createdAt = createdAt
    )
}
