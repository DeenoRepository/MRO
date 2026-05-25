package com.company.mro.wms.application

import com.company.mro.audit.application.AuditService
import com.company.mro.wms.dto.CreateStockMovementRequest
import com.company.mro.wms.dto.StockLevelResponse
import com.company.mro.wms.dto.StockMovementResponse
import com.company.mro.wms.persistence.PartRepository
import com.company.mro.wms.persistence.StockLevelEntity
import com.company.mro.wms.persistence.StockLevelRepository
import com.company.mro.wms.persistence.StockMovementEntity
import com.company.mro.wms.persistence.StockMovementRepository
import com.company.mro.wms.persistence.WarehouseRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

@Service
class StockService(
    private val stockMovementRepository: StockMovementRepository,
    private val stockLevelRepository: StockLevelRepository,
    private val warehouseRepository: WarehouseRepository,
    private val partRepository: PartRepository,
    private val auditService: AuditService
) {
    @Transactional
    fun receiveStock(request: CreateStockMovementRequest): StockMovementResponse {
        val warehouse = warehouseRepository.findById(request.warehouseId)
            .orElseThrow { ResponseStatusException(HttpStatus.BAD_REQUEST, "Warehouse not found") }
        if (!warehouse.isActive) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot receive stock into inactive warehouse")
        }

        val part = partRepository.findById(request.partId)
            .orElseThrow { ResponseStatusException(HttpStatus.BAD_REQUEST, "Part not found") }
        if (!part.isActive) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot receive inactive part")
        }

        val movement = stockMovementRepository.save(
            StockMovementEntity(
                id = UUID.randomUUID(),
                warehouseId = request.warehouseId,
                partId = request.partId,
                movementType = "RECEIPT",
                quantity = request.quantity,
                referenceType = request.referenceType?.trim(),
                referenceId = request.referenceId,
                reason = request.reason?.trim(),
                createdAt = Instant.now()
            )
        )

        val level = stockLevelRepository.findByWarehouseIdAndPartId(request.warehouseId, request.partId)
            ?: StockLevelEntity(
                id = UUID.randomUUID(),
                warehouseId = request.warehouseId,
                partId = request.partId,
                quantityOnHand = BigDecimal.ZERO,
                quantityReserved = BigDecimal.ZERO
            )

        level.quantityOnHand = level.quantityOnHand.add(request.quantity)
        level.updatedAt = Instant.now()
        stockLevelRepository.save(level)

        auditService.log("WMS_STOCK_RECEIVED", "WMS", "stock_movement", movement.id.toString())
        return movement.toResponse()
    }

    @Transactional
    fun issueStock(request: CreateStockMovementRequest): StockMovementResponse {
        val warehouse = warehouseRepository.findById(request.warehouseId)
            .orElseThrow { ResponseStatusException(HttpStatus.BAD_REQUEST, "Warehouse not found") }
        if (!warehouse.isActive) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot issue stock from inactive warehouse")
        }

        val part = partRepository.findById(request.partId)
            .orElseThrow { ResponseStatusException(HttpStatus.BAD_REQUEST, "Part not found") }
        if (!part.isActive) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot issue inactive part")
        }

        val level = stockLevelRepository.findByWarehouseIdAndPartId(request.warehouseId, request.partId)
            ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "No stock level records found for this part and warehouse")

        val available = level.quantityOnHand.subtract(level.quantityReserved)
        if (available.compareTo(request.quantity) < 0) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient available quantity. Available: $available, Requested: ${request.quantity}")
        }

        val movement = stockMovementRepository.save(
            StockMovementEntity(
                id = UUID.randomUUID(),
                warehouseId = request.warehouseId,
                partId = request.partId,
                movementType = "ISSUE",
                quantity = request.quantity,
                referenceType = request.referenceType?.trim(),
                referenceId = request.referenceId,
                reason = request.reason?.trim(),
                createdAt = Instant.now()
            )
        )

        level.quantityOnHand = level.quantityOnHand.subtract(request.quantity)
        level.updatedAt = Instant.now()
        stockLevelRepository.save(level)

        auditService.log("WMS_STOCK_ISSUED", "WMS", "stock_movement", movement.id.toString())
        return movement.toResponse()
    }

    @Transactional
    fun adjustStock(request: CreateStockMovementRequest): StockMovementResponse {
        val warehouse = warehouseRepository.findById(request.warehouseId)
            .orElseThrow { ResponseStatusException(HttpStatus.BAD_REQUEST, "Warehouse not found") }
        if (!warehouse.isActive) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot adjust stock in inactive warehouse")
        }

        val part = partRepository.findById(request.partId)
            .orElseThrow { ResponseStatusException(HttpStatus.BAD_REQUEST, "Part not found") }
        if (!part.isActive) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot adjust inactive part")
        }

        val type = request.movementType.trim().uppercase()
        if (type != "ADJUSTMENT_IN" && type != "ADJUSTMENT_OUT") {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid adjustment type: $type")
        }

        val level = stockLevelRepository.findByWarehouseIdAndPartId(request.warehouseId, request.partId)
            ?: StockLevelEntity(
                id = UUID.randomUUID(),
                warehouseId = request.warehouseId,
                partId = request.partId,
                quantityOnHand = BigDecimal.ZERO,
                quantityReserved = BigDecimal.ZERO
            )

        if (type == "ADJUSTMENT_OUT") {
            val available = level.quantityOnHand.subtract(level.quantityReserved)
            if (available.compareTo(request.quantity) < 0) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient available quantity for negative adjustment. Available: $available, Requested: ${request.quantity}")
            }
            level.quantityOnHand = level.quantityOnHand.subtract(request.quantity)
        } else {
            level.quantityOnHand = level.quantityOnHand.add(request.quantity)
        }

        val movement = stockMovementRepository.save(
            StockMovementEntity(
                id = UUID.randomUUID(),
                warehouseId = request.warehouseId,
                partId = request.partId,
                movementType = type,
                quantity = request.quantity,
                referenceType = request.referenceType?.trim(),
                referenceId = request.referenceId,
                reason = request.reason?.trim(),
                createdAt = Instant.now()
            )
        )

        level.updatedAt = Instant.now()
        stockLevelRepository.save(level)

        auditService.log("WMS_STOCK_ADJUSTED", "WMS", "stock_movement", movement.id.toString())
        return movement.toResponse()
    }

    @Transactional(readOnly = true)
    fun getStockLevel(warehouseId: UUID, partId: UUID): StockLevelResponse {
        val level = stockLevelRepository.findByWarehouseIdAndPartId(warehouseId, partId)
            ?: throw ResponseStatusException(HttpStatus.NOT_FOUND, "Stock level record not found")
        return level.toResponse()
    }

    @Transactional(readOnly = true)
    fun getBelowMinimumStock(): List<StockLevelResponse> {
        return stockLevelRepository.findBelowMinimum().map { it.toResponse() }
    }

    @Transactional(readOnly = true)
    fun searchStockLevels(warehouseId: UUID?, partId: UUID?, belowMinimum: Boolean?): List<StockLevelResponse> {
        val all = if (warehouseId != null && partId != null) {
            val res = stockLevelRepository.findByWarehouseIdAndPartId(warehouseId, partId)
            if (res != null) listOf(res) else emptyList()
        } else if (warehouseId != null) {
            stockLevelRepository.findByWarehouseId(warehouseId)
        } else if (partId != null) {
            stockLevelRepository.findByPartId(partId)
        } else {
            stockLevelRepository.findAll()
        }

        var mapped = all.map { it.toResponse() }
        if (belowMinimum == true) {
            mapped = mapped.filter { it.belowMinimum }
        }
        return mapped
    }

    @Transactional(readOnly = true)
    fun getMovementsByWarehouse(warehouseId: UUID): List<StockMovementResponse> =
        stockMovementRepository.findByWarehouseId(warehouseId).map { it.toResponse() }

    @Transactional(readOnly = true)
    fun getMovementsByPart(partId: UUID): List<StockMovementResponse> =
        stockMovementRepository.findByPartId(partId).map { it.toResponse() }

    private fun StockLevelEntity.toResponse(): StockLevelResponse {
        val warehouse = warehouseRepository.findById(warehouseId).get()
        val part = partRepository.findById(partId).get()
        val available = quantityOnHand.subtract(quantityReserved)
        val isBelow = available.compareTo(part.minStockLevel) < 0
        return StockLevelResponse(
            id = id,
            warehouseId = warehouseId,
            warehouseCode = warehouse.code,
            partId = partId,
            partNumber = part.partNumber,
            partName = part.name,
            quantityOnHand = quantityOnHand,
            quantityReserved = quantityReserved,
            quantityAvailable = available,
            minStockLevel = part.minStockLevel,
            belowMinimum = isBelow
        )
    }

    private fun StockMovementEntity.toResponse(): StockMovementResponse = StockMovementResponse(
        id = id,
        warehouseId = warehouseId,
        partId = partId,
        movementType = movementType,
        quantity = quantity,
        referenceType = referenceType,
        referenceId = referenceId,
        reason = reason,
        createdAt = createdAt
    )
}
