package com.company.mro.mms.application

import com.company.mro.audit.application.AuditService
import com.company.mro.eps.application.EquipmentLookupService
import com.company.mro.mms.dto.CreatePmScheduleRequest
import com.company.mro.mms.dto.PmScheduleResponse
import com.company.mro.mms.dto.UpdatePmScheduleRequest
import com.company.mro.mms.persistence.PmScheduleEntity
import com.company.mro.mms.persistence.PmScheduleRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.Instant
import java.util.UUID

@Service
class PmScheduleService(
    private val pmScheduleRepository: PmScheduleRepository,
    private val equipmentLookupService: EquipmentLookupService,
    private val auditService: AuditService
) {
    @Transactional(readOnly = true)
    fun getAll(): List<PmScheduleResponse> = pmScheduleRepository.findAll().map { it.toResponse() }

    @Transactional
    fun create(request: CreatePmScheduleRequest): PmScheduleResponse {
        if (!equipmentLookupService.existsById(request.equipmentId)) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Referenced equipment not found")
        }
        val now = Instant.now()
        val entity = PmScheduleEntity(
            id = UUID.randomUUID(),
            equipmentId = request.equipmentId,
            name = request.name.trim(),
            frequency = request.frequency.trim().uppercase(),
            nextDueDate = request.nextDueDate,
            isActive = true,
            createdAt = now,
            updatedAt = now
        )
        val saved = pmScheduleRepository.save(entity)
        auditService.log("PM_SCHEDULE_CREATED", "MMS", "pm_schedule", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun update(id: UUID, request: UpdatePmScheduleRequest): PmScheduleResponse {
        val entity = pmScheduleRepository.findById(id)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "PM schedule not found") }
        entity.name = request.name.trim()
        entity.frequency = request.frequency.trim().uppercase()
        entity.nextDueDate = request.nextDueDate
        entity.isActive = request.isActive
        entity.updatedAt = Instant.now()
        val saved = pmScheduleRepository.save(entity)
        auditService.log("PM_SCHEDULE_UPDATED", "MMS", "pm_schedule", saved.id.toString())
        return saved.toResponse()
    }

    private fun PmScheduleEntity.toResponse(): PmScheduleResponse = PmScheduleResponse(
        id = id,
        equipmentId = equipmentId,
        name = name,
        frequency = frequency,
        nextDueDate = nextDueDate,
        isActive = isActive,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}

