package com.company.mro.wms.application

import com.company.mro.audit.application.AuditService
import com.company.mro.wms.dto.CreateWarehouseTransferRequest
import com.company.mro.wms.persistence.PartEntity
import com.company.mro.wms.persistence.PartRepository
import com.company.mro.wms.persistence.StockLevelEntity
import com.company.mro.wms.persistence.StockLevelRepository
import com.company.mro.wms.persistence.StockMovementEntity
import com.company.mro.wms.persistence.StockMovementRepository
import com.company.mro.wms.persistence.WarehouseEntity
import com.company.mro.wms.persistence.WarehouseRepository
import com.company.mro.wms.persistence.WarehouseTransferEntity
import com.company.mro.wms.persistence.WarehouseTransferRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.Mockito.any
import org.mockito.Mockito.`when` as whenever
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.web.server.ResponseStatusException
import java.math.BigDecimal
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
class WarehouseTransferServiceTest {

    @Mock
    private lateinit var transferRepository: WarehouseTransferRepository

    @Mock
    private lateinit var warehouseRepository: WarehouseRepository

    @Mock
    private lateinit var partRepository: PartRepository

    @Mock
    private lateinit var stockLevelRepository: StockLevelRepository

    @Mock
    private lateinit var stockMovementRepository: StockMovementRepository

    @Mock
    private lateinit var auditService: AuditService

    @InjectMocks
    private lateinit var transferService: WarehouseTransferService

    @Test
    fun `cannot transfer to same warehouse`() {
        val warehouseId = UUID.randomUUID()
        val partId = UUID.randomUUID()

        val request = CreateWarehouseTransferRequest(
            sourceWarehouseId = warehouseId,
            targetWarehouseId = warehouseId,
            partId = partId,
            quantity = BigDecimal.TEN
        )

        assertThrows(ResponseStatusException::class.java) {
            transferService.create(request)
        }
    }

    @Test
    fun `cannot approve transfer with insufficient stock`() {
        val transferId = UUID.randomUUID()
        val sourceId = UUID.randomUUID()
        val targetId = UUID.randomUUID()
        val partId = UUID.randomUUID()

        val transfer = WarehouseTransferEntity(
            id = transferId,
            sourceWarehouseId = sourceId,
            targetWarehouseId = targetId,
            partId = partId,
            quantity = BigDecimal.TEN,
            status = "REQUESTED"
        )
        val level = StockLevelEntity(id = UUID.randomUUID(), warehouseId = sourceId, partId = partId, quantityOnHand = BigDecimal.ONE, quantityReserved = BigDecimal.ZERO)

        whenever(transferRepository.findById(transferId)).thenReturn(Optional.of(transfer))
        whenever(stockLevelRepository.findByWarehouseIdAndPartId(sourceId, partId)).thenReturn(level)

        assertThrows(ResponseStatusException::class.java) {
            transferService.approve(transferId)
        }
    }

    @Test
    fun `complete transfer increases target warehouse stock`() {
        val transferId = UUID.randomUUID()
        val sourceId = UUID.randomUUID()
        val targetId = UUID.randomUUID()
        val partId = UUID.randomUUID()

        val transfer = WarehouseTransferEntity(
            id = transferId,
            sourceWarehouseId = sourceId,
            targetWarehouseId = targetId,
            partId = partId,
            quantity = BigDecimal.TEN,
            status = "IN_TRANSIT"
        )
        val level = StockLevelEntity(id = UUID.randomUUID(), warehouseId = targetId, partId = partId, quantityOnHand = BigDecimal.ONE, quantityReserved = BigDecimal.ZERO)

        whenever(transferRepository.findById(transferId)).thenReturn(Optional.of(transfer))
        whenever(stockLevelRepository.findByWarehouseIdAndPartId(targetId, partId)).thenReturn(level)
        whenever(transferRepository.save(any(WarehouseTransferEntity::class.java))).thenAnswer { it.arguments[0] as WarehouseTransferEntity }

        val response = transferService.complete(transferId)
        assertEquals("COMPLETED", response.status)
        assertEquals(BigDecimal.valueOf(11), level.quantityOnHand)
    }
}
