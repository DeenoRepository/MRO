package com.company.mro.srs.persistence

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "external_api_log", schema = "srs")
class ExternalApiLogEntity(
    @Id
    var id: UUID,

    @Column(name = "system_name", nullable = false, length = 128)
    var systemName: String,

    @Column(nullable = false, length = 32)
    var direction: String,

    @Column(name = "request_payload", columnDefinition = "jsonb")
    var requestPayload: String? = null,

    @Column(name = "response_payload", columnDefinition = "jsonb")
    var responsePayload: String? = null,

    @Column(name = "status_code")
    var statusCode: Int? = null,

    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now()
)
