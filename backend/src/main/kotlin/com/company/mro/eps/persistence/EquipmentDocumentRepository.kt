package com.company.mro.eps.persistence

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface EquipmentDocumentRepository : JpaRepository<EquipmentDocumentEntity, UUID> {
    fun findByEquipmentId(equipmentId: UUID): List<EquipmentDocumentEntity>
}
