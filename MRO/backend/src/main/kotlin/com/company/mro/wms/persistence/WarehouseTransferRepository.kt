package com.company.mro.wms.persistence

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface WarehouseTransferRepository : JpaRepository<WarehouseTransferEntity, UUID> {
    fun findByStatus(status: String): List<WarehouseTransferEntity>
    fun findBySourceWarehouseId(sourceWarehouseId: UUID): List<WarehouseTransferEntity>
    fun findByTargetWarehouseId(targetWarehouseId: UUID): List<WarehouseTransferEntity>
}
