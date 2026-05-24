package com.company.mro.wms.persistence

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface WarehouseRepository : JpaRepository<WarehouseEntity, UUID> {
    fun existsByCode(code: String): Boolean
}

