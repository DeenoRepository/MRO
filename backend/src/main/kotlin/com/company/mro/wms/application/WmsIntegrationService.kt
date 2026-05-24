package com.company.mro.wms.application

import java.math.BigDecimal
import java.util.UUID

interface WmsIntegrationService {
    fun reserveStock(warehouseId: UUID, partId: UUID, quantity: BigDecimal, referenceId: UUID): UUID
    fun consumeReservation(reservationId: UUID, quantity: BigDecimal)
    fun releaseReservation(reservationId: UUID)
}
