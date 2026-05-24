package com.company.mro.wms.persistence

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.util.UUID

@Entity
@Table(name = "warehouses", schema = "wms")
class WarehouseEntity(
    @Id
    var id: UUID,
    @Column(nullable = false, unique = true, length = 32)
    var code: String,
    @Column(nullable = false, length = 255)
    var name: String,
    @Column(nullable = false, length = 32)
    var type: String,
    @Column(name = "custodian_id")
    var custodianId: UUID? = null,
    @Column(length = 255)
    var location: String? = null,
    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true
)

