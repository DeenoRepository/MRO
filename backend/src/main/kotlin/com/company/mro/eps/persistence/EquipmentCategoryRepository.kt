package com.company.mro.eps.persistence

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface EquipmentCategoryRepository : JpaRepository<EquipmentCategoryEntity, UUID> {
    fun existsByCodeAndIsActiveTrue(code: String): Boolean
    fun existsByCode(code: String): Boolean
    fun findByParentId(parentId: UUID?): List<EquipmentCategoryEntity>
}
