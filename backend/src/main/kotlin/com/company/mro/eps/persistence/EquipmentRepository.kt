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
        SELECT e.*
        FROM eps.equipment e
        WHERE (:status IS NULL OR e.status = CAST(:status AS VARCHAR))
          AND (:category IS NULL OR e.category ILIKE CAST(:category AS VARCHAR))
          AND (
            :searchTerm IS NULL
            OR e.asset_tag ILIKE CONCAT('%', CAST(:searchTerm AS VARCHAR), '%')
            OR e.name ILIKE CONCAT('%', CAST(:searchTerm AS VARCHAR), '%')
            OR e.category ILIKE CONCAT('%', CAST(:searchTerm AS VARCHAR), '%')
            OR COALESCE(e.serial_number, '') ILIKE CONCAT('%', CAST(:searchTerm AS VARCHAR), '%')
            OR COALESCE(e.manufacturer, '') ILIKE CONCAT('%', CAST(:searchTerm AS VARCHAR), '%')
            OR COALESCE(e.location, '') ILIKE CONCAT('%', CAST(:searchTerm AS VARCHAR), '%')
          )
        """,
        countQuery = """
        SELECT COUNT(*)
        FROM eps.equipment e
        WHERE (:status IS NULL OR e.status = CAST(:status AS VARCHAR))
          AND (:category IS NULL OR e.category ILIKE CAST(:category AS VARCHAR))
          AND (
            :searchTerm IS NULL
            OR e.asset_tag ILIKE CONCAT('%', CAST(:searchTerm AS VARCHAR), '%')
            OR e.name ILIKE CONCAT('%', CAST(:searchTerm AS VARCHAR), '%')
            OR e.category ILIKE CONCAT('%', CAST(:searchTerm AS VARCHAR), '%')
            OR COALESCE(e.serial_number, '') ILIKE CONCAT('%', CAST(:searchTerm AS VARCHAR), '%')
            OR COALESCE(e.manufacturer, '') ILIKE CONCAT('%', CAST(:searchTerm AS VARCHAR), '%')
            OR COALESCE(e.location, '') ILIKE CONCAT('%', CAST(:searchTerm AS VARCHAR), '%')
          )
        """,
        nativeQuery = true
    )
    fun findRegistryPage(
        @Param("status") status: EquipmentStatus?,
        @Param("category") category: String?,
        @Param("searchTerm") searchTerm: String?,
        pageable: Pageable
    ): Page<EquipmentEntity>
}
