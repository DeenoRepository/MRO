package com.company.mro.eps.persistence

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ExternalIntegrationLogRepository : JpaRepository<ExternalIntegrationLogEntity, UUID> {
    fun findTop200ByIntegrationNameOrderByCreatedAtDesc(integrationName: String): List<ExternalIntegrationLogEntity>
    fun findTop200ByOrderByCreatedAtDesc(): List<ExternalIntegrationLogEntity>
}
