package com.company.mro.wms.application

import com.company.mro.audit.application.AuditService
import com.company.mro.wms.dto.CreateWarehouseRequest
import com.company.mro.wms.dto.WarehouseResponse
import com.company.mro.wms.persistence.WarehouseEntity
import com.company.mro.wms.persistence.WarehouseRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.util.UUID

@Service
class WarehouseService(
    private val warehouseRepository: WarehouseRepository,
    private val auditService: AuditService
) {
    @Transactional(readOnly = true)
    fun getAll(): List<WarehouseResponse> = warehouseRepository.findAll().map { it.toResponse() }

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
                isActive = true
            )
        )
        auditService.log("WAREHOUSE_CREATED", "WMS", "warehouse", saved.id.toString())
        return saved.toResponse()
    }

    private fun WarehouseEntity.toResponse(): WarehouseResponse = WarehouseResponse(
        id = id,
        code = code,
        name = name,
        type = type,
        custodianId = custodianId,
        location = location,
        isActive = isActive
    )
}

