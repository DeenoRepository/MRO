package com.company.mro.srs.persistence

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "request_types", schema = "srs")
class RequestTypeEntity(
    @Id
    var id: UUID,

    @Column(nullable = false, unique = true, length = 64)
    var code: String,

    @Column(nullable = false, length = 255)
    var name: String,

    @Column(columnDefinition = "text")
    var description: String? = null,

    @Column(name = "default_priority", nullable = false, length = 32)
    var defaultPriority: String = "MEDIUM",

    @Column(name = "sla_hours")
    var slaHours: Int? = null,

    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,

    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now()
)
