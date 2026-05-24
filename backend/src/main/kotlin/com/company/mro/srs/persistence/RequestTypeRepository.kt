package com.company.mro.srs.persistence

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface RequestTypeRepository : JpaRepository<RequestTypeEntity, UUID> {
    fun findByCode(code: String): RequestTypeEntity?
    fun findByIsActive(isActive: Boolean): List<RequestTypeEntity>
}
