package com.company.mro.eps.persistence

import com.company.mro.eps.domain.EquipmentStatus
import java.time.Instant
import java.util.UUID

interface EquipmentOverviewProjection {
    fun getId(): UUID
    fun getAssetTag(): String
    fun getName(): String
    fun getCategory(): String
    fun getStatus(): EquipmentStatus
    fun getLocation(): String?
    fun getUpdatedAt(): Instant
}
