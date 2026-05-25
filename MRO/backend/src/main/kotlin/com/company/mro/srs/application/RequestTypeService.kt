package com.company.mro.srs.application

import com.company.mro.audit.application.AuditService
import com.company.mro.srs.dto.CreateRequestTypeRequest
import com.company.mro.srs.dto.UpdateRequestTypeRequest
import com.company.mro.srs.dto.RequestTypeResponse
import com.company.mro.srs.persistence.RequestTypeEntity
import com.company.mro.srs.persistence.RequestTypeRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.Instant
import java.util.UUID

@Service
class RequestTypeService(
    private val requestTypeRepository: RequestTypeRepository,
    private val auditService: AuditService
) {
    @Transactional(readOnly = true)
    fun getAll(): List<RequestTypeResponse> = requestTypeRepository.findAll().map { it.toResponse() }

    @Transactional(readOnly = true)
    fun getById(id: UUID): RequestTypeResponse = findEntity(id).toResponse()

    @Transactional
    fun create(request: CreateRequestTypeRequest): RequestTypeResponse {
        val code = request.code.trim().uppercase()
        if (requestTypeRepository.findByCode(code) != null) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "Request type code already exists")
        }

        val saved = requestTypeRepository.save(
            RequestTypeEntity(
                id = UUID.randomUUID(),
                code = code,
                name = request.name.trim(),
                description = request.description?.trim(),
                defaultPriority = request.defaultPriority.trim().uppercase(),
                slaHours = request.slaHours,
                isActive = true,
                createdAt = Instant.now()
            )
        )
        auditService.log("SRS_REQUEST_TYPE_CREATED", "SRS", "request_type", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun update(id: UUID, request: UpdateRequestTypeRequest): RequestTypeResponse {
        val entity = findEntity(id)
        entity.name = request.name.trim()
        entity.description = request.description?.trim()
        entity.defaultPriority = request.defaultPriority.trim().uppercase()
        entity.slaHours = request.slaHours
        entity.isActive = request.isActive

        val saved = requestTypeRepository.save(entity)
        auditService.log("SRS_REQUEST_TYPE_UPDATED", "SRS", "request_type", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun deactivate(id: UUID): RequestTypeResponse {
        val entity = findEntity(id)
        entity.isActive = false
        val saved = requestTypeRepository.save(entity)
        auditService.log("SRS_REQUEST_TYPE_DEACTIVATED", "SRS", "request_type", saved.id.toString())
        return saved.toResponse()
    }

    private fun findEntity(id: UUID): RequestTypeEntity =
        requestTypeRepository.findById(id)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Request type not found") }

    private fun RequestTypeEntity.toResponse(): RequestTypeResponse = RequestTypeResponse(
        id = id,
        code = code,
        name = name,
        description = description,
        defaultPriority = defaultPriority,
        slaHours = slaHours,
        isActive = isActive
    )
}
