package com.company.mro.wms.application

import com.company.mro.audit.application.AuditService
import com.company.mro.wms.domain.ReservationStatus
import com.company.mro.wms.dto.CreateWarehouseRequest
import com.company.mro.wms.dto.UpdateWarehouseRequest
import com.company.mro.wms.dto.WarehouseResponse
import com.company.mro.wms.persistence.ReservationRepository
import com.company.mro.wms.persistence.WarehouseEntity
import com.company.mro.wms.persistence.WarehouseRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.Instant
import java.util.UUID

@Service
class WarehouseService(
    private val warehouseRepository: WarehouseRepository,
    private val reservationRepository: ReservationRepository,
    private val auditService: AuditService
) {
    @Transactional(readOnly = true)
    fun getAll(): List<WarehouseResponse> = warehouseRepository.findAll().map { it.toResponse() }

    @Transactional(readOnly = true)
    fun getById(id: UUID): WarehouseResponse = findEntity(id).toResponse()

    @Transactional
    fun create(request: CreateWarehouseRequest): WarehouseResponse {
        if (warehouseRepository.existsByCode(request.code.trim())) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "Warehouse code already exists")
        }
        val saved = warehouseRepository.save(
            WarehouseEntity(
                id = UUID.randomUUID(),
                code = request.code.trim().uppercase(),
                name = request.name.trim(),
                type = request.type.trim().uppercase(),
                custodianId = request.custodianId,
                location = request.location?.trim(),
                description = request.description?.trim(),
                isActive = true
            )
        )
        auditService.log("WMS_WAREHOUSE_CREATED", "WMS", "warehouse", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun update(id: UUID, request: UpdateWarehouseRequest): WarehouseResponse {
        val entity = findEntity(id)
        entity.name = request.name.trim()
        entity.type = request.type.trim().uppercase()
        entity.custodianId = request.custodianId
        entity.location = request.location?.trim()
        entity.description = request.description?.trim()
        entity.updatedAt = Instant.now()
        
        if (entity.isActive && !request.isActive) {
            validateDeactivation(id)
            entity.isActive = false
            auditService.log("WMS_WAREHOUSE_DEACTIVATED", "WMS", "warehouse", id.toString())
        } else if (!entity.isActive && request.isActive) {
            entity.isActive = true
        }

        val saved = warehouseRepository.save(entity)
        auditService.log("WMS_WAREHOUSE_UPDATED", "WMS", "warehouse", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun deactivate(id: UUID): WarehouseResponse {
        val entity = findEntity(id)
        if (entity.isActive) {
            validateDeactivation(id)
            entity.isActive = false
            entity.updatedAt = Instant.now()
            val saved = warehouseRepository.save(entity)
            auditService.log("WMS_WAREHOUSE_DEACTIVATED", "WMS", "warehouse", id.toString())
            return saved.toResponse()
        }
        return entity.toResponse()
    }

    @Transactional
    fun assignCustodian(id: UUID, custodianId: UUID?): WarehouseResponse {
        val entity = findEntity(id)
        entity.custodianId = custodianId
        entity.updatedAt = Instant.now()
        val saved = warehouseRepository.save(entity)
        auditService.log("WMS_WAREHOUSE_CUSTODIAN_ASSIGNED", "WMS", "warehouse", saved.id.toString())
        return saved.toResponse()
    }

    private fun findEntity(id: UUID): WarehouseEntity =
        warehouseRepository.findById(id)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Warehouse not found") }

    private fun validateDeactivation(warehouseId: UUID) {
        val activeReservations = reservationRepository.findByWarehouseIdAndStatus(warehouseId, ReservationStatus.RESERVED)
        if (activeReservations.isNotEmpty()) {
            throw ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Cannot deactivate warehouse with active reservations"
            )
        }
    }

    private fun WarehouseEntity.toResponse(): WarehouseResponse = WarehouseResponse(
        id = id,
        code = code,
        name = name,
        type = type,
        custodianId = custodianId,
        location = location,
        description = description,
        isActive = isActive,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}
