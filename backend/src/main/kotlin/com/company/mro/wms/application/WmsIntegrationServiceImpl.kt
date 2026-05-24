package com.company.mro.wms.application

import com.company.mro.wms.dto.CreateReservationRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.util.UUID

@Service
class WmsIntegrationServiceImpl(
    private val reservationService: ReservationService
) : WmsIntegrationService {

    @Transactional
    override fun reserveStock(warehouseId: UUID, partId: UUID, quantity: BigDecimal, referenceId: UUID): UUID {
        val request = CreateReservationRequest(
            warehouseId = warehouseId,
            partId = partId,
            quantity = quantity,
            referenceType = "WORK_ORDER",
            referenceId = referenceId
        )
        return reservationService.create(request).id
    }

    @Transactional
    override fun consumeReservation(reservationId: UUID, quantity: BigDecimal) {
        reservationService.consumeWithQuantity(reservationId, quantity)
    }

    @Transactional
    override fun releaseReservation(reservationId: UUID) {
        reservationService.release(reservationId)
    }
}
