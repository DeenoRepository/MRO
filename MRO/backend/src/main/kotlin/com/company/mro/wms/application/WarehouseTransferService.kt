package com.company.mro.wms.application

import com.company.mro.audit.application.AuditService
import com.company.mro.wms.dto.CreateWarehouseTransferRequest
import com.company.mro.wms.dto.WarehouseTransferResponse
import com.company.mro.wms.persistence.PartRepository
import com.company.mro.wms.persistence.StockLevelEntity
import com.company.mro.wms.persistence.StockLevelRepository
import com.company.mro.wms.persistence.StockMovementEntity
import com.company.mro.wms.persistence.StockMovementRepository
import com.company.mro.wms.persistence.WarehouseRepository
import com.company.mro.wms.persistence.WarehouseTransferEntity
import com.company.mro.wms.persistence.WarehouseTransferRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

@Service
class WarehouseTransferService(
    private val transferRepository: WarehouseTransferRepository,
    private val warehouseRepository: WarehouseRepository,
    private val partRepository: PartRepository,
    private val stockLevelRepository: StockLevelRepository,
    private val stockMovementRepository: StockMovementRepository,
    private val auditService: AuditService
) {
    @Transactional
    fun create(request: CreateWarehouseTransferRequest, requestedBy: UUID? = null): WarehouseTransferResponse {
        if (request.sourceWarehouseId == request.targetWarehouseId) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Source and target warehouses must be different")
        }
        val source = warehouseRepository.findById(request.sourceWarehouseId)
            .orElseThrow { ResponseStatusException(HttpStatus.BAD_REQUEST, "Source warehouse not found") }
        if (!source.isActive) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Source warehouse is inactive")
        }
        val target = warehouseRepository.findById(request.targetWarehouseId)
            .orElseThrow { ResponseStatusException(HttpStatus.BAD_REQUEST, "Target warehouse not found") }
        if (!target.isActive) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Target warehouse is inactive")
        }
        val part = partRepository.findById(request.partId)
            .orElseThrow { ResponseStatusException(HttpStatus.BAD_REQUEST, "Part not found") }
        if (!part.isActive) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Part is inactive")
        }

        val entity = transferRepository.save(
            WarehouseTransferEntity(
                id = UUID.randomUUID(),
                sourceWarehouseId = request.sourceWarehouseId,
                targetWarehouseId = request.targetWarehouseId,
                partId = request.partId,
                quantity = request.quantity,
                status = "DRAFT",
                requestedBy = requestedBy,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        auditService.log("WMS_TRANSFER_CREATED", "WMS", "warehouse_transfer", entity.id.toString())
        return entity.toResponse()
    }

    @Transactional
    fun submit(id: UUID): WarehouseTransferResponse {
        val entity = findEntity(id)
        if (entity.status != "DRAFT") {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Only DRAFT transfers can be submitted")
        }
        entity.status = "REQUESTED"
        entity.updatedAt = Instant.now()
        val saved = transferRepository.save(entity)
        return saved.toResponse()
    }

    @Transactional
    fun approve(id: UUID, approvedBy: UUID? = null): WarehouseTransferResponse {
        val entity = findEntity(id)
        if (entity.status != "REQUESTED") {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Only REQUESTED transfers can be approved")
        }

        // Validate stock availability
        val level = stockLevelRepository.findByWarehouseIdAndPartId(entity.sourceWarehouseId, entity.partId)
            ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "No stock level records found at source warehouse")

        val available = level.quantityOnHand.subtract(level.quantityReserved)
        if (available.compareTo(entity.quantity) < 0) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient available stock at source warehouse")
        }

        entity.status = "APPROVED"
        entity.approvedBy = approvedBy
        entity.updatedAt = Instant.now()
        val saved = transferRepository.save(entity)
        auditService.log("WMS_TRANSFER_APPROVED", "WMS", "warehouse_transfer", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun start(id: UUID): WarehouseTransferResponse {
        val entity = findEntity(id)
        if (entity.status != "APPROVED") {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Only APPROVED transfers can be started")
        }

        val level = stockLevelRepository.findByWarehouseIdAndPartId(entity.sourceWarehouseId, entity.partId)
            ?: throw ResponseStatusException(HttpStatus.BAD_REQUEST, "No stock level records found at source warehouse")

        val available = level.quantityOnHand.subtract(level.quantityReserved)
        if (available.compareTo(entity.quantity) < 0) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient available stock at source warehouse")
        }

        // Decrease stock at source warehouse
        level.quantityOnHand = level.quantityOnHand.subtract(entity.quantity).max(BigDecimal.ZERO)
        level.updatedAt = Instant.now()
        stockLevelRepository.save(level)

        // Record stock movement (TRANSFER_OUT)
        stockMovementRepository.save(
            StockMovementEntity(
                id = UUID.randomUUID(),
                warehouseId = entity.sourceWarehouseId,
                partId = entity.partId,
                movementType = "TRANSFER_OUT",
                quantity = entity.quantity,
                referenceType = "WAREHOUSE_TRANSFER",
                referenceId = entity.id,
                reason = "Transfer start to warehouse ${entity.targetWarehouseId}",
                createdAt = Instant.now()
            )
        )

        entity.status = "IN_TRANSIT"
        entity.updatedAt = Instant.now()
        val saved = transferRepository.save(entity)
        auditService.log("WMS_TRANSFER_STARTED", "WMS", "warehouse_transfer", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun complete(id: UUID): WarehouseTransferResponse {
        val entity = findEntity(id)
        if (entity.status != "IN_TRANSIT") {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Only IN_TRANSIT transfers can be completed")
        }

        val level = stockLevelRepository.findByWarehouseIdAndPartId(entity.targetWarehouseId, entity.partId)
            ?: StockLevelEntity(
                id = UUID.randomUUID(),
                warehouseId = entity.targetWarehouseId,
                partId = entity.partId,
                quantityOnHand = BigDecimal.ZERO,
                quantityReserved = BigDecimal.ZERO
            )

        // Increase stock at target warehouse
        level.quantityOnHand = level.quantityOnHand.add(entity.quantity)
        level.updatedAt = Instant.now()
        stockLevelRepository.save(level)

        // Record stock movement (TRANSFER_IN)
        stockMovementRepository.save(
            StockMovementEntity(
                id = UUID.randomUUID(),
                warehouseId = entity.targetWarehouseId,
                partId = entity.partId,
                movementType = "TRANSFER_IN",
                quantity = entity.quantity,
                referenceType = "WAREHOUSE_TRANSFER",
                referenceId = entity.id,
                reason = "Transfer complete from warehouse ${entity.sourceWarehouseId}",
                createdAt = Instant.now()
            )
        )

        entity.status = "COMPLETED"
        entity.updatedAt = Instant.now()
        val saved = transferRepository.save(entity)
        auditService.log("WMS_TRANSFER_COMPLETED", "WMS", "warehouse_transfer", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun cancel(id: UUID): WarehouseTransferResponse {
        val entity = findEntity(id)
        if (entity.status == "COMPLETED" || entity.status == "CANCELLED") {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot cancel a completed or already cancelled transfer")
        }

        // If transfer was already IN_TRANSIT, we must return the stock to source warehouse
        if (entity.status == "IN_TRANSIT") {
            val level = stockLevelRepository.findByWarehouseIdAndPartId(entity.sourceWarehouseId, entity.partId)
                ?: StockLevelEntity(
                    id = UUID.randomUUID(),
                    warehouseId = entity.sourceWarehouseId,
                    partId = entity.partId,
                    quantityOnHand = BigDecimal.ZERO,
                    quantityReserved = BigDecimal.ZERO
                )
            level.quantityOnHand = level.quantityOnHand.add(entity.quantity)
            level.updatedAt = Instant.now()
            stockLevelRepository.save(level)

            stockMovementRepository.save(
                StockMovementEntity(
                    id = UUID.randomUUID(),
                    warehouseId = entity.sourceWarehouseId,
                    partId = entity.partId,
                    movementType = "TRANSFER_IN",
                    quantity = entity.quantity,
                    referenceType = "WAREHOUSE_TRANSFER",
                    referenceId = entity.id,
                    reason = "Cancelled transfer stock return",
                    createdAt = Instant.now()
                )
            )
        }

        entity.status = "CANCELLED"
        entity.updatedAt = Instant.now()
        val saved = transferRepository.save(entity)
        auditService.log("WMS_TRANSFER_CANCELLED", "WMS", "warehouse_transfer", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional(readOnly = true)
    fun getById(id: UUID): WarehouseTransferResponse = findEntity(id).toResponse()

    @Transactional(readOnly = true)
    fun searchTransfers(
        sourceWarehouseId: UUID?,
        targetWarehouseId: UUID?,
        status: String?
    ): List<WarehouseTransferResponse> {
        var results = if (status != null) {
            transferRepository.findByStatus(status)
        } else {
            transferRepository.findAll()
        }

        if (sourceWarehouseId != null) {
            results = results.filter { it.sourceWarehouseId == sourceWarehouseId }
        }
        if (targetWarehouseId != null) {
            results = results.filter { it.targetWarehouseId == targetWarehouseId }
        }

        return results.map { it.toResponse() }
    }

    private fun findEntity(id: UUID): WarehouseTransferEntity =
        transferRepository.findById(id)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Warehouse transfer not found") }

    private fun WarehouseTransferEntity.toResponse(): WarehouseTransferResponse = WarehouseTransferResponse(
        id = id,
        sourceWarehouseId = sourceWarehouseId,
        targetWarehouseId = targetWarehouseId,
        partId = partId,
        quantity = quantity,
        status = status,
        requestedBy = requestedBy,
        approvedBy = approvedBy,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}
