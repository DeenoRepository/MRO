package com.company.mro.wms.persistence

import com.company.mro.wms.domain.ReservationStatus
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.time.Instant
import java.util.UUID

interface ReservationRepository : JpaRepository<ReservationEntity, UUID> {
    fun findByWarehouseIdAndStatus(warehouseId: UUID, status: ReservationStatus): List<ReservationEntity>
    fun findByPartIdAndStatus(partId: UUID, status: ReservationStatus): List<ReservationEntity>
    fun findByReferenceTypeAndReferenceId(referenceType: String, referenceId: UUID): List<ReservationEntity>
    fun findByStatus(status: ReservationStatus): List<ReservationEntity>
    
    @Query("SELECT r FROM ReservationEntity r WHERE r.status = com.company.mro.wms.domain.ReservationStatus.RESERVED AND r.expiresAt IS NOT NULL AND r.expiresAt < :now")
    fun findExpiredReservations(now: Instant): List<ReservationEntity>
}
