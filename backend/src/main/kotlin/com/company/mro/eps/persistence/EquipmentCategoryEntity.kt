package com.company.mro.eps.persistence

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "equipment_categories", schema = "eps")
class EquipmentCategoryEntity(
    @Id
    var id: UUID,
    @Column(nullable = false, unique = true, length = 64)
    var code: String,
    @Column(nullable = false, length = 255)
    var name: String,
    @Column(name = "parent_id")
    var parentId: UUID? = null,
    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true,
    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now(),
    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now()
)
