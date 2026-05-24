package com.company.mro.eps.persistence

import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDate
import java.util.UUID

interface ComplianceRecordRepository : JpaRepository<ComplianceRecordEntity, UUID> {
    fun findByEquipmentId(equipmentId: UUID): List<ComplianceRecordEntity>
    fun findByValidUntilLessThanEqualOrderByValidUntilAsc(validUntil: LocalDate): List<ComplianceRecordEntity>
}
