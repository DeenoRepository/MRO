package com.company.mro.srs.persistence

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ExternalApiLogRepository : JpaRepository<ExternalApiLogEntity, UUID> {
    fun findBySystemName(systemName: String): List<ExternalApiLogEntity>
}
