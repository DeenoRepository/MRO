package com.company.mro.wms.application

import com.company.mro.audit.application.AuditService
import com.company.mro.wms.domain.ReservationStatus
import com.company.mro.wms.dto.CreateReservationRequest
import com.company.mro.wms.dto.ReservationResponse
import com.company.mro.wms.persistence.PartRepository
import com.company.mro.wms.persistence.ReservationEntity
import com.company.mro.wms.persistence.ReservationRepository
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
class ReservationService(
    private val reservationRepository: ReservationRepository,
    private val stockMovementRepository: StockMovementRepository,
    private val stockLevelRepository: StockLevelRepository,
    private val warehouseRepository: WarehouseRepository,
    private val partRepository: PartRepository,
    private val auditService: AuditService
) {
    @Transactional
    fun create(request: CreateReservationRequest): ReservationResponse {
        val warehouse = warehouseRepository.findById(request.warehouseId)
            .orElseThrow { ResponseStatusException(HttpStatus.BAD_REQUEST, "Warehouse not found") }
        if (!warehouse.isActive) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot reserve in inactive warehouse")
        }

        val part = partRepository.findById(request.partId)
            .orElseThrow { ResponseStatusException(HttpStatus.BAD_REQUEST, "Part not found") }
        if (!part.isActive) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot reserve inactive part")
        }

        val level = stockLevelRepository.findByWarehouseIdAndPartId(request.warehouseId, request.partId)
            ?: StockLevelEntity(
                id = UUID.randomUUID(),
                warehouseId = request.warehouseId,
                partId = request.partId,
                quantityOnHand = BigDecimal.ZERO,
                quantityReserved = BigDecimal.ZERO
            )

        val available = level.quantityOnHand.subtract(level.quantityReserved)
        if (available.compareTo(request.quantity) < 0) {
            throw ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Insufficient available stock for reservation. Available: $available, Requested: ${request.quantity}"
            )
        }

        val saved = reservationRepository.save(
            ReservationEntity(
                id = UUID.randomUUID(),
                warehouseId = request.warehouseId,
                partId = request.partId,
                quantity = request.quantity,
                status = ReservationStatus.RESERVED,
                referenceType = request.referenceType?.trim(),
                referenceId = request.referenceId,
                expiresAt = request.expiresAt,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )

        level.quantityReserved = level.quantityReserved.add(request.quantity)
        level.updatedAt = Instant.now()
        stockLevelRepository.save(level)

        auditService.log("WMS_RESERVATION_CREATED", "WMS", "reservation", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun release(id: UUID): ReservationResponse {
        val entity = findReservation(id)
        if (entity.status != ReservationStatus.RESERVED) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Only RESERVED reservations can be released")
        }

        entity.status = ReservationStatus.RELEASED
        entity.updatedAt = Instant.now()
        val saved = reservationRepository.save(entity)

        val level = stockLevelRepository.findByWarehouseIdAndPartId(saved.warehouseId, saved.partId)
        if (level != null) {
            level.quantityReserved = level.quantityReserved.subtract(saved.quantity).max(BigDecimal.ZERO)
            level.updatedAt = Instant.now()
            stockLevelRepository.save(level)
        }

        auditService.log("WMS_RESERVATION_RELEASED", "WMS", "reservation", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun consume(id: UUID): ReservationResponse {
        val entity = findReservation(id)
        return consumeWithQuantity(entity.id, entity.quantity)
    }

    @Transactional
    fun consumeWithQuantity(id: UUID, quantity: BigDecimal): ReservationResponse {
        val entity = findReservation(id)
        if (entity.status != ReservationStatus.RESERVED) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Only RESERVED reservations can be consumed")
        }
        if (quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Consumption quantity must be positive")
        }
        if (quantity.compareTo(entity.quantity) > 0) {
            throw ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Cannot consume more than reserved. Reserved: ${entity.quantity}, Requested: $quantity"
            )
        }

        val level = stockLevelRepository.findByWarehouseIdAndPartId(entity.warehouseId, entity.partId)
            ?: throw ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Stock level record missing for reservation")

        // Update stock level quantities
        level.quantityOnHand = level.quantityOnHand.subtract(quantity).max(BigDecimal.ZERO)
        level.quantityReserved = level.quantityReserved.subtract(quantity).max(BigDecimal.ZERO)
        level.updatedAt = Instant.now()
        stockLevelRepository.save(level)

        // Save stock movement ledger
        stockMovementRepository.save(
            StockMovementEntity(
                id = UUID.randomUUID(),
                warehouseId = entity.warehouseId,
                partId = entity.partId,
                movementType = "CONSUMPTION",
                quantity = quantity,
                referenceType = entity.referenceType,
                referenceId = entity.referenceId,
                reason = "Consumed reservation $id",
                createdAt = Instant.now()
            )
        )

        if (quantity.compareTo(entity.quantity) == 0) {
            entity.status = ReservationStatus.CONSUMED
        } else {
            entity.quantity = entity.quantity.subtract(quantity)
        }
        entity.updatedAt = Instant.now()
        val saved = reservationRepository.save(entity)

        auditService.log("WMS_RESERVATION_CONSUMED", "WMS", "reservation", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun expireReservations(): Int {
        val expiredList = reservationRepository.findExpiredReservations(Instant.now())
        var count = 0
        for (reservation in expiredList) {
            reservation.status = ReservationStatus.RELEASED // Treat expired as released to return stock
            reservation.updatedAt = Instant.now()
            reservationRepository.save(reservation)

            val level = stockLevelRepository.findByWarehouseIdAndPartId(reservation.warehouseId, reservation.partId)
            if (level != null) {
                level.quantityReserved = level.quantityReserved.subtract(reservation.quantity).max(BigDecimal.ZERO)
                level.updatedAt = Instant.now()
                stockLevelRepository.save(level)
            }

            auditService.log("WMS_RESERVATION_EXPIRED", "WMS", "reservation", reservation.id.toString())
            count++
        }
        return count
    }

    @Transactional(readOnly = true)
    fun getReservation(id: UUID): ReservationResponse = findReservation(id).toResponse()

    @Transactional(readOnly = true)
    fun searchReservations(
        warehouseId: UUID?,
        partId: UUID?,
        status: ReservationStatus?,
        referenceType: String?,
        referenceId: UUID?
    ): List<ReservationResponse> {
        var results = if (warehouseId != null && status != null) {
            reservationRepository.findByWarehouseIdAndStatus(warehouseId, status)
        } else if (status != null) {
            reservationRepository.findByStatus(status)
        } else {
            reservationRepository.findAll()
        }

        if (warehouseId != null && status == null) {
            results = results.filter { it.warehouseId == warehouseId }
        }
        if (partId != null) {
            results = results.filter { it.partId == partId }
        }
        if (!referenceType.isNullOrBlank()) {
            results = results.filter { it.referenceType?.equals(referenceType.trim(), ignoreCase = true) == true }
        }
        if (referenceId != null) {
            results = results.filter { it.referenceId == referenceId }
        }

        return results.map { it.toResponse() }
    }

    private fun findReservation(id: UUID): ReservationEntity =
        reservationRepository.findById(id)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Reservation not found") }

    private fun ReservationEntity.toResponse(): ReservationResponse = ReservationResponse(
        id = id,
        warehouseId = warehouseId,
        partId = partId,
        quantity = quantity,
        status = status,
        referenceType = referenceType,
        referenceId = referenceId,
        expiresAt = expiresAt,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}
