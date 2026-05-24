package com.company.mro.eps.persistence

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface EquipmentRepository : JpaRepository<EquipmentEntity, UUID> {
    fun existsByAssetTag(assetTag: String): Boolean
}

