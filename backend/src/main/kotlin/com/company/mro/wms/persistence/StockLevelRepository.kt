package com.company.mro.wms.persistence

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.util.UUID

interface StockLevelRepository : JpaRepository<StockLevelEntity, UUID> {
    fun findByWarehouseIdAndPartId(warehouseId: UUID, partId: UUID): StockLevelEntity?
    fun findByPartId(partId: UUID): List<StockLevelEntity>
    fun findByWarehouseId(warehouseId: UUID): List<StockLevelEntity>

    @Query("""
        SELECT s FROM StockLevelEntity s 
        JOIN PartEntity p ON s.partId = p.id 
        WHERE (s.quantityOnHand - s.quantityReserved) < p.minStockLevel
    """)
    fun findBelowMinimum(): List<StockLevelEntity>
}
