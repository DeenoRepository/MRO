package com.company.mro.wms.application

import com.company.mro.audit.application.AuditService
import com.company.mro.wms.dto.CreateStockMovementRequest
import com.company.mro.wms.persistence.PartEntity
import com.company.mro.wms.persistence.PartRepository
import com.company.mro.wms.persistence.StockLevelEntity
import com.company.mro.wms.persistence.StockLevelRepository
import com.company.mro.wms.persistence.StockMovementEntity
import com.company.mro.wms.persistence.StockMovementRepository
import com.company.mro.wms.persistence.WarehouseEntity
import com.company.mro.wms.persistence.WarehouseRepository
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
class StockServiceTest {

    @Mock
    private lateinit var stockMovementRepository: StockMovementRepository

    @Mock
    private lateinit var stockLevelRepository: StockLevelRepository

    @Mock
    private lateinit var warehouseRepository: WarehouseRepository

    @Mock
    private lateinit var partRepository: PartRepository

    @Mock
    private lateinit var auditService: AuditService

    @InjectMocks
    private lateinit var stockService: StockService

    @Test
    fun `cannot receive stock into inactive warehouse`() {
        val warehouseId = UUID.randomUUID()
        val partId = UUID.randomUUID()
        val warehouse = WarehouseEntity(id = warehouseId, code = "W1", name = "Warehouse 1", type = "MAIN", isActive = false)

        whenever(warehouseRepository.findById(warehouseId)).thenReturn(Optional.of(warehouse))

        val request = CreateStockMovementRequest(
            warehouseId = warehouseId,
            partId = partId,
            movementType = "RECEIPT",
            quantity = BigDecimal.TEN
        )

        assertThrows(ResponseStatusException::class.java) {
            stockService.receiveStock(request)
        }
    }

    @Test
    fun `cannot issue stock with insufficient quantity`() {
        val warehouseId = UUID.randomUUID()
        val partId = UUID.randomUUID()
        val warehouse = WarehouseEntity(id = warehouseId, code = "W1", name = "Warehouse 1", type = "MAIN", isActive = true)
        val part = PartEntity(id = partId, partNumber = "P1", name = "Part 1", isActive = true)
        val level = StockLevelEntity(id = UUID.randomUUID(), warehouseId = warehouseId, partId = partId, quantityOnHand = BigDecimal.ONE, quantityReserved = BigDecimal.ZERO)

        whenever(warehouseRepository.findById(warehouseId)).thenReturn(Optional.of(warehouse))
        whenever(partRepository.findById(partId)).thenReturn(Optional.of(part))
        whenever(stockLevelRepository.findByWarehouseIdAndPartId(warehouseId, partId)).thenReturn(level)

        val request = CreateStockMovementRequest(
            warehouseId = warehouseId,
            partId = partId,
            movementType = "ISSUE",
            quantity = BigDecimal.TEN
        )

        assertThrows(ResponseStatusException::class.java) {
            stockService.issueStock(request)
        }
    }

    @Test
    fun `issue stock updates level and saves movement`() {
        val warehouseId = UUID.randomUUID()
        val partId = UUID.randomUUID()
        val warehouse = WarehouseEntity(id = warehouseId, code = "W1", name = "Warehouse 1", type = "MAIN", isActive = true)
        val part = PartEntity(id = partId, partNumber = "P1", name = "Part 1", isActive = true)
        val level = StockLevelEntity(id = UUID.randomUUID(), warehouseId = warehouseId, partId = partId, quantityOnHand = BigDecimal.TEN, quantityReserved = BigDecimal.ZERO)

        whenever(warehouseRepository.findById(warehouseId)).thenReturn(Optional.of(warehouse))
        whenever(partRepository.findById(partId)).thenReturn(Optional.of(part))
        whenever(stockLevelRepository.findByWarehouseIdAndPartId(warehouseId, partId)).thenReturn(level)
        whenever(stockMovementRepository.save(any(StockMovementEntity::class.java))).thenAnswer { it.arguments[0] as StockMovementEntity }

        val request = CreateStockMovementRequest(
            warehouseId = warehouseId,
            partId = partId,
            movementType = "ISSUE",
            quantity = BigDecimal.valueOf(3)
        )

        val response = stockService.issueStock(request)
        assertEquals("ISSUE", response.movementType)
        assertEquals(BigDecimal.valueOf(3), response.quantity)
        assertEquals(BigDecimal.valueOf(7), level.quantityOnHand)
    }
}
