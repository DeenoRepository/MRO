package com.company.mro.mms.persistence

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface MaintenanceHistoryRepository : JpaRepository<MaintenanceHistoryEntity, UUID> {
    fun findByWorkOrderId(workOrderId: UUID): List<MaintenanceHistoryEntity>
    fun findByEquipmentId(equipmentId: UUID): List<MaintenanceHistoryEntity>
}
