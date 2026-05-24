package com.company.mro.wms.application

import com.company.mro.audit.application.AuditService
import com.company.mro.wms.domain.ReservationStatus
import com.company.mro.wms.dto.CreateReservationRequest
import com.company.mro.wms.dto.ReservationResponse
import com.company.mro.wms.persistence.PartRepository
import com.company.mro.wms.persistence.ReservationEntity
import com.company.mro.wms.persistence.ReservationRepository
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
class ReservationService(
    private val reservationRepository: ReservationRepository,
    private val stockMovementRepository: StockMovementRepository,
    private val warehouseRepository: WarehouseRepository,
    private val partRepository: PartRepository,
    private val auditService: AuditService
) {
    @Transactional
    fun create(request: CreateReservationRequest): ReservationResponse {
        if (!warehouseRepository.existsById(request.warehouseId)) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Warehouse not found")
        }
        if (!partRepository.existsById(request.partId)) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Part not found")
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
                createdAt = Instant.now()
            )
        )
        auditService.log("RESERVATION_CREATED", "WMS", "reservation", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun release(id: UUID): ReservationResponse {
        val entity = findReservation(id)
        if (entity.status != ReservationStatus.RESERVED) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Only RESERVED reservations can be released")
        }
        entity.status = ReservationStatus.RELEASED
        val saved = reservationRepository.save(entity)
        auditService.log("RESERVATION_RELEASED", "WMS", "reservation", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun consume(id: UUID): ReservationResponse {
        val entity = findReservation(id)
        if (entity.status != ReservationStatus.RESERVED) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Only RESERVED reservations can be consumed")
        }
        entity.status = ReservationStatus.CONSUMED
        val saved = reservationRepository.save(entity)
        stockMovementRepository.save(
            StockMovementEntity(
                id = UUID.randomUUID(),
                warehouseId = saved.warehouseId,
                partId = saved.partId,
                movementType = "CONSUME",
                quantity = saved.quantity,
                referenceType = saved.referenceType,
                referenceId = saved.referenceId,
                createdAt = Instant.now()
            )
        )
        auditService.log("RESERVATION_CONSUMED", "WMS", "reservation", saved.id.toString())
        return saved.toResponse()
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
        createdAt = createdAt
    )
}

