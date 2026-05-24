package com.company.mro.eps.persistence

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "external_integration_log", schema = "eps")
class ExternalIntegrationLogEntity(
    @Id
    var id: UUID,
    @Column(name = "integration_name", nullable = false, length = 128)
    var integrationName: String,
    @Column(nullable = false, length = 32)
    var direction: String,
    @Column(nullable = false, length = 64)
    var operation: String,
    @Column(name = "equipment_id")
    var equipmentId: UUID? = null,
    @Column(name = "request_payload", columnDefinition = "jsonb")
    var requestPayload: String? = null,
    @Column(name = "response_payload", columnDefinition = "jsonb")
    var responsePayload: String? = null,
    @Column(name = "status_code")
    var statusCode: Int? = null,
    @Column(nullable = false, length = 32)
    var status: String,
    @Column(name = "error_message")
    var errorMessage: String? = null,
    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now()
)
