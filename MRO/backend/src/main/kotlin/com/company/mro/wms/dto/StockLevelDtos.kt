package com.company.mro.wms.dto

import java.math.BigDecimal
import java.util.UUID

data class StockLevelResponse(
    val id: UUID,
    val warehouseId: UUID,
    val warehouseCode: String,
    val partId: UUID,
    val partNumber: String,
    val partName: String,
    val quantityOnHand: BigDecimal,
    val quantityReserved: BigDecimal,
    val quantityAvailable: BigDecimal,
    val minStockLevel: BigDecimal,
    val belowMinimum: Boolean
)
