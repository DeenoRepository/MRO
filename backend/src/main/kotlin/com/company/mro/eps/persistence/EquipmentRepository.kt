package com.company.mro.eps.persistence

import com.company.mro.eps.domain.EquipmentStatus
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.UUID

interface EquipmentRepository : JpaRepository<EquipmentEntity, UUID> {
    fun existsByAssetTag(assetTag: String): Boolean

    @Query(
        """
        SELECT e.id as id,
               e.assetTag as assetTag,
               e.name as name,
               e.category as category,
               e.status as status,
               e.location as location,
               e.updatedAt as updatedAt
        FROM EquipmentEntity e
        WHERE (:status IS NULL OR e.status = :status)
          AND (:category IS NULL OR LOWER(e.category) = LOWER(:category))
        ORDER BY e.updatedAt DESC
        """
    )
    fun findOverview(
        @Param("status") status: EquipmentStatus?,
        @Param("category") category: String?
    ): List<EquipmentOverviewProjection>
}
