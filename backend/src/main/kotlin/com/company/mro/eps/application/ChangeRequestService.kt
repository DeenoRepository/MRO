package com.company.mro.eps.application

import com.company.mro.audit.application.AuditService
import com.company.mro.eps.domain.ChangeRequestStatus
import com.company.mro.eps.domain.ChangeRiskLevel
import com.company.mro.eps.dto.ChangeRequestResponse
import com.company.mro.eps.dto.CreateChangeRequest
import com.company.mro.eps.dto.CreateEquipmentRequest
import com.company.mro.eps.dto.DecideChangeRequest
import com.company.mro.eps.dto.UpdateEquipmentRequest
import com.company.mro.eps.persistence.ChangeRequestEntity
import com.company.mro.eps.persistence.ChangeRequestRepository
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.Instant
import java.util.UUID

@Service
class ChangeRequestService(
    private val changeRequestRepository: ChangeRequestRepository,
    private val equipmentService: EquipmentService,
    private val auditService: AuditService,
    private val objectMapper: ObjectMapper
) {
    @Transactional(readOnly = true)
    fun getAll(): List<ChangeRequestResponse> =
        changeRequestRepository.findAll().map { it.toResponse() }

    @Transactional(readOnly = true)
    fun getById(id: UUID): ChangeRequestResponse =
        findEntity(id).toResponse()

    @Transactional
    fun createChangeRequest(request: CreateChangeRequest): ChangeRequestResponse {
        // Basic validation of proposed data format
        if (request.changeType.uppercase() == "CREATE") {
            runCatching {
                objectMapper.readValue(request.proposedData, CreateEquipmentRequest::class.java)
            }.onFailure {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid proposedData for CREATE request", it)
            }
        } else if (request.changeType.uppercase() == "UPDATE") {
            if (request.entityId == null) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "entityId is required for UPDATE change request")
            }
            runCatching {
                objectMapper.readValue(request.proposedData, UpdateEquipmentRequest::class.java)
            }.onFailure {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid proposedData for UPDATE request", it)
            }
        } else {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported changeType: \${request.changeType}")
        }

        val entity = ChangeRequestEntity(
            id = UUID.randomUUID(),
            entityType = request.entityType.trim().uppercase(),
            entityId = request.entityId,
            changeType = request.changeType.trim().uppercase(),
            proposedData = request.proposedData.trim(),
            riskLevel = request.riskLevel,
            impactSummary = request.impactSummary?.trim(),
            requiresEscalation = request.riskLevel == ChangeRiskLevel.HIGH || request.riskLevel == ChangeRiskLevel.CRITICAL,
            status = ChangeRequestStatus.PENDING,
            requestedBy = null,
            createdAt = Instant.now()
        )

        val saved = changeRequestRepository.save(entity)
        auditService.log("EPS_CHANGE_REQUEST_CREATED", "EPS", "change_request", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun approve(id: UUID, decision: DecideChangeRequest): ChangeRequestResponse {
        val request = findEntity(id)
        if (request.status != ChangeRequestStatus.PENDING) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Only PENDING change requests can be approved")
        }

        val appliedEntityId: UUID
        if (request.changeType == "CREATE") {
            val createReq = objectMapper.readValue(request.proposedData, CreateEquipmentRequest::class.java)
            val createdEquipment = equipmentService.create(createReq)
            appliedEntityId = createdEquipment.id
            request.entityId = appliedEntityId
        } else {
            val entityId = request.entityId ?: throw ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Change request has no entityId for UPDATE"
            )
            val updateReq = objectMapper.readValue(request.proposedData, UpdateEquipmentRequest::class.java)
            equipmentService.update(entityId, updateReq)
            appliedEntityId = entityId
        }

        request.status = ChangeRequestStatus.APPROVED
        request.approvalNotes = decision.approvalNotes?.trim()
        request.decidedAt = Instant.now()
        request.approvedBy = null

        val saved = changeRequestRepository.save(request)
        auditService.log("EPS_CHANGE_REQUEST_APPROVED", "EPS", "change_request", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun reject(id: UUID, decision: DecideChangeRequest): ChangeRequestResponse {
        val request = findEntity(id)
        if (request.status != ChangeRequestStatus.PENDING) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Only PENDING change requests can be rejected")
        }

        request.status = ChangeRequestStatus.REJECTED
        request.approvalNotes = decision.approvalNotes?.trim()
        request.decidedAt = Instant.now()
        request.approvedBy = null

        val saved = changeRequestRepository.save(request)
        auditService.log("EPS_CHANGE_REQUEST_REJECTED", "EPS", "change_request", saved.id.toString())
        return saved.toResponse()
    }

    private fun findEntity(id: UUID): ChangeRequestEntity =
        changeRequestRepository.findById(id)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Change request not found") }

    private fun ChangeRequestEntity.toResponse() = ChangeRequestResponse(
        id = id,
        entityType = entityType,
        entityId = entityId,
        changeType = changeType,
        proposedData = proposedData,
        riskLevel = riskLevel,
        impactSummary = impactSummary,
        requiresEscalation = requiresEscalation,
        status = status,
        requestedBy = requestedBy,
        approvedBy = approvedBy,
        approvalNotes = approvalNotes,
        createdAt = createdAt,
        decidedAt = decidedAt
    )
}
