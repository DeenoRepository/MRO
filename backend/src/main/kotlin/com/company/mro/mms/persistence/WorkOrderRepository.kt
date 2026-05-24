package com.company.mro.mms.persistence

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface WorkOrderRepository : JpaRepository<WorkOrderEntity, UUID> {
    fun existsByWoNumber(woNumber: String): Boolean
}

