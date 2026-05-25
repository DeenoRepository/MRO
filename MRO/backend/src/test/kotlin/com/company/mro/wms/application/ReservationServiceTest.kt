package com.company.mro.wms.application

import com.company.mro.audit.application.AuditService
import com.company.mro.wms.domain.ReservationStatus
import com.company.mro.wms.persistence.PartRepository
import com.company.mro.wms.persistence.ReservationEntity
import com.company.mro.wms.persistence.ReservationRepository
import com.company.mro.wms.persistence.StockMovementRepository
import com.company.mro.wms.persistence.WarehouseRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.web.server.ResponseStatusException
import java.math.BigDecimal
import java.time.Instant
import java.util.Optional
import java.util.UUID
import org.mockito.Mockito.`when` as whenever

@ExtendWith(MockitoExtension::class)
class ReservationServiceTest {
    @Mock
    private lateinit var reservationRepository: ReservationRepository

    @Mock
    private lateinit var stockMovementRepository: StockMovementRepository

    @Mock
    private lateinit var warehouseRepository: WarehouseRepository

    @Mock
    private lateinit var partRepository: PartRepository

    @Mock
    private lateinit var auditService: AuditService

    @InjectMocks
    private lateinit var reservationService: ReservationService

    @Test
    fun `cannot consume released reservation`() {
        val id = UUID.randomUUID()
        val entity = ReservationEntity(
            id = id,
            warehouseId = UUID.randomUUID(),
            partId = UUID.randomUUID(),
            quantity = BigDecimal.ONE,
            status = ReservationStatus.RELEASED,
            createdAt = Instant.now()
        )
        whenever(reservationRepository.findById(id)).thenReturn(Optional.of(entity))

        assertThrows(ResponseStatusException::class.java) {
            reservationService.consume(id)
        }
    }

    @Test
    fun `reserved reservation can be released`() {
        val id = UUID.randomUUID()
        val entity = ReservationEntity(
            id = id,
            warehouseId = UUID.randomUUID(),
            partId = UUID.randomUUID(),
            quantity = BigDecimal.ONE,
            status = ReservationStatus.RESERVED,
            createdAt = Instant.now()
        )
        whenever(reservationRepository.findById(id)).thenReturn(Optional.of(entity))
        whenever(reservationRepository.save(entity)).thenReturn(entity)

        val response = reservationService.release(id)
        assertEquals(ReservationStatus.RELEASED, response.status)
    }
}

