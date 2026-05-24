package com.company.mro.eps.persistence

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.UUID

interface EquipmentDocumentRepository : JpaRepository<EquipmentDocumentEntity, UUID> {
    fun findByEquipmentId(equipmentId: UUID): List<EquipmentDocumentEntity>
    fun findByEquipmentIdAndDocumentTypeIgnoreCaseAndFileNameOrderByVersionDesc(
        equipmentId: UUID,
        documentType: String,
        fileName: String
    ): List<EquipmentDocumentEntity>

    @Query(
        """
        SELECT d
        FROM EquipmentDocumentEntity d
        WHERE (:equipmentId IS NULL OR d.equipmentId = :equipmentId)
          AND (
            LOWER(d.fileName) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(d.documentType) LIKE LOWER(CONCAT('%', :query, '%'))
            OR LOWER(COALESCE(d.extractedText, '')) LIKE LOWER(CONCAT('%', :query, '%'))
          )
        ORDER BY d.uploadedAt DESC
        """
    )
    fun searchDocuments(
        @Param("query") query: String,
        @Param("equipmentId") equipmentId: UUID?
    ): List<EquipmentDocumentEntity>
}
