package com.company.mro.wms.persistence

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface StockMovementRepository : JpaRepository<StockMovementEntity, UUID> {
    fun findByWarehouseId(warehouseId: UUID): List<StockMovementEntity>
    fun findByPartId(partId: UUID): List<StockMovementEntity>
    fun findByReferenceTypeAndReferenceId(referenceType: String, referenceId: UUID): List<StockMovementEntity>
}
