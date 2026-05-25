package com.company.mro.mms.persistence

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "work_order_parts", schema = "mms")
class WorkOrderPartEntity(
    @Id
    var id: UUID,

    @Column(name = "work_order_id", nullable = false)
    var workOrderId: UUID,

    @Column(name = "part_id", nullable = false)
    var partId: UUID,

    @Column(name = "reservation_id")
    var reservationId: UUID? = null,

    @Column(name = "requested_qty", nullable = false, precision = 18, scale = 3)
    var requestedQty: BigDecimal,

    @Column(name = "consumed_qty", precision = 18, scale = 3)
    var consumedQty: BigDecimal = BigDecimal.ZERO,

    @Column(nullable = false, length = 32)
    var status: String = "REQUESTED", // 'REQUESTED', 'RESERVED', 'CONSUMED', 'RELEASED'

    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now(),

    @Column(name = "created_by")
    var createdBy: UUID? = null
)
