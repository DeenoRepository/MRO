package com.company.mro.eps.persistence

import com.company.mro.eps.domain.EquipmentStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
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

    @Query(
        value = """
        SELECT e
        FROM EquipmentEntity e
        WHERE (:status IS NULL OR e.status = :status)
          AND (:category IS NULL OR LOWER(e.category) = LOWER(:category))
          AND (
            :query IS NULL
            OR LOWER(e.assetTag) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(e.name) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(e.category) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(COALESCE(e.serialNumber, '')) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(COALESCE(e.manufacturer, '')) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(COALESCE(e.location, '')) LIKE LOWER(CONCAT('%', :query, '%'))
          )
        """,
        countQuery = """
        SELECT COUNT(e)
        FROM EquipmentEntity e
        WHERE (:status IS NULL OR e.status = :status)
          AND (:category IS NULL OR LOWER(e.category) = LOWER(:category))
          AND (
            :query IS NULL
            OR LOWER(e.assetTag) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(e.name) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(e.category) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(COALESCE(e.serialNumber, '')) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(COALESCE(e.manufacturer, '')) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(COALESCE(e.location, '')) LIKE LOWER(CONCAT('%', :query, '%'))
          )
        """
    )
    fun findRegistryPage(
        @Param("status") status: EquipmentStatus?,
        @Param("category") category: String?,
        @Param("query") query: String?,
        pageable: Pageable
    ): Page<EquipmentEntity>
}
