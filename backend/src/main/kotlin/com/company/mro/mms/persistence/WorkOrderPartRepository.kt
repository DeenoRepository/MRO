package com.company.mro.mms.persistence

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface WorkOrderPartRepository : JpaRepository<WorkOrderPartEntity, UUID> {
    fun findByWorkOrderId(workOrderId: UUID): List<WorkOrderPartEntity>
    fun findByReservationId(reservationId: UUID): WorkOrderPartEntity?
}
