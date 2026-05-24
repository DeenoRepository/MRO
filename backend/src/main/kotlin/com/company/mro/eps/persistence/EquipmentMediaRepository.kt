package com.company.mro.eps.persistence

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface EquipmentMediaRepository : JpaRepository<EquipmentMediaEntity, UUID> {
    fun findByEquipmentIdOrderByUploadedAtDesc(equipmentId: UUID): List<EquipmentMediaEntity>
}
