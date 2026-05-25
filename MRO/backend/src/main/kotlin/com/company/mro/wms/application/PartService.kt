package com.company.mro.wms.application

import com.company.mro.audit.application.AuditService
import com.company.mro.wms.domain.ReservationStatus
import com.company.mro.wms.dto.CreatePartRequest
import com.company.mro.wms.dto.UpdatePartRequest
import com.company.mro.wms.dto.PartResponse
import com.company.mro.wms.persistence.PartEntity
import com.company.mro.wms.persistence.PartRepository
import com.company.mro.wms.persistence.ReservationRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

@Service
class PartService(
    private val partRepository: PartRepository,
    private val reservationRepository: ReservationRepository,
    private val auditService: AuditService
) {
    @Transactional(readOnly = true)
    fun getAll(): List<PartResponse> = partRepository.findAll().map { it.toResponse() }

    @Transactional(readOnly = true)
    fun getById(id: UUID): PartResponse = findEntity(id).toResponse()

    @Transactional
    fun create(request: CreatePartRequest): PartResponse {
        if (partRepository.existsByPartNumber(request.partNumber.trim())) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "Part number already exists")
        }
        val saved = partRepository.save(
            PartEntity(
                id = UUID.randomUUID(),
                partNumber = request.partNumber.trim().uppercase(),
                name = request.name.trim(),
                description = request.description?.trim(),
                unit = request.unit?.trim()?.uppercase() ?: "PCS",
                manufacturer = request.manufacturer?.trim(),
                model = request.model?.trim(),
                minStockLevel = request.minStockLevel ?: BigDecimal.ZERO,
                metadata = request.metadata?.trim(),
                isActive = true
            )
        )
        auditService.log("WMS_PART_CREATED", "WMS", "part", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun update(id: UUID, request: UpdatePartRequest): PartResponse {
        val entity = findEntity(id)
        entity.name = request.name.trim()
        entity.description = request.description?.trim()
        entity.unit = request.unit?.trim()?.uppercase() ?: "PCS"
        entity.manufacturer = request.manufacturer?.trim()
        entity.model = request.model?.trim()
        entity.minStockLevel = request.minStockLevel ?: BigDecimal.ZERO
        entity.metadata = request.metadata?.trim()
        entity.updatedAt = Instant.now()

        if (entity.isActive && !request.isActive) {
            validateDeactivation(id)
            entity.isActive = false
            auditService.log("WMS_PART_DEACTIVATED", "WMS", "part", id.toString())
        } else if (!entity.isActive && request.isActive) {
            entity.isActive = true
        }

        val saved = partRepository.save(entity)
        auditService.log("WMS_PART_UPDATED", "WMS", "part", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun deactivate(id: UUID): PartResponse {
        val entity = findEntity(id)
        if (entity.isActive) {
            validateDeactivation(id)
            entity.isActive = false
            entity.updatedAt = Instant.now()
            val saved = partRepository.save(entity)
            auditService.log("WMS_PART_DEACTIVATED", "WMS", "part", id.toString())
            return saved.toResponse()
        }
        return entity.toResponse()
    }

    private fun findEntity(id: UUID): PartEntity =
        partRepository.findById(id)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Part not found") }

    private fun validateDeactivation(partId: UUID) {
        val activeReservations = reservationRepository.findByPartIdAndStatus(partId, ReservationStatus.RESERVED)
        if (activeReservations.isNotEmpty()) {
            throw ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Cannot deactivate part with active reservations"
            )
        }
    }

    private fun PartEntity.toResponse(): PartResponse = PartResponse(
        id = id,
        partNumber = partNumber,
        name = name,
        description = description,
        unit = unit,
        manufacturer = manufacturer,
        model = model,
        minStockLevel = minStockLevel,
        isActive = isActive,
        metadata = metadata,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}
