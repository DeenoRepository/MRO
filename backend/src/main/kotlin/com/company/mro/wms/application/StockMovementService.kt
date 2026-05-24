package com.company.mro.wms.application

import com.company.mro.audit.application.AuditService
import com.company.mro.wms.dto.CreateStockMovementRequest
import com.company.mro.wms.dto.StockMovementResponse
import com.company.mro.wms.persistence.PartRepository
import com.company.mro.wms.persistence.StockMovementEntity
import com.company.mro.wms.persistence.StockMovementRepository
import com.company.mro.wms.persistence.WarehouseRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.Instant
import java.util.UUID

@Service
class StockMovementService(
    private val stockMovementRepository: StockMovementRepository,
    private val warehouseRepository: WarehouseRepository,
    private val partRepository: PartRepository,
    private val auditService: AuditService
) {
    @Transactional
    fun create(request: CreateStockMovementRequest): StockMovementResponse {
        if (!warehouseRepository.existsById(request.warehouseId)) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Warehouse not found")
        }
        if (!partRepository.existsById(request.partId)) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Part not found")
        }

        val saved = stockMovementRepository.save(
            StockMovementEntity(
                id = UUID.randomUUID(),
                warehouseId = request.warehouseId,
                partId = request.partId,
                movementType = request.movementType.trim().uppercase(),
                quantity = request.quantity,
                referenceType = request.referenceType?.trim(),
                referenceId = request.referenceId,
                createdAt = Instant.now()
            )
        )
        auditService.log("STOCK_MOVEMENT_CREATED", "WMS", "stock_movement", saved.id.toString())
        return saved.toResponse()
    }

    private fun StockMovementEntity.toResponse(): StockMovementResponse = StockMovementResponse(
        id = id,
        warehouseId = warehouseId,
        partId = partId,
        movementType = movementType,
        quantity = quantity,
        referenceType = referenceType,
        referenceId = referenceId,
        createdAt = createdAt
    )
}

