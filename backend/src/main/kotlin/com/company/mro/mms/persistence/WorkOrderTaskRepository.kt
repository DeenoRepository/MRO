package com.company.mro.mms.persistence

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface WorkOrderTaskRepository : JpaRepository<WorkOrderTaskEntity, UUID> {
    fun findByWorkOrderIdOrderBySortOrderAsc(workOrderId: UUID): List<WorkOrderTaskEntity>
}
