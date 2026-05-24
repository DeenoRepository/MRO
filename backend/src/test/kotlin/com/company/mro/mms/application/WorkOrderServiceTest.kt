package com.company.mro.mms.application

import com.company.mro.audit.application.AuditService
import com.company.mro.eps.application.EquipmentLookupService
import com.company.mro.mms.domain.WorkOrderStatus
import com.company.mro.mms.dto.AssignWorkOrderRequest
import com.company.mro.mms.dto.CompleteWorkOrderRequest
import com.company.mro.mms.persistence.MaintenanceHistoryRepository
import com.company.mro.mms.persistence.WorkOrderEntity
import com.company.mro.mms.persistence.WorkOrderRepository
import com.company.mro.mms.persistence.WorkOrderTaskRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.web.server.ResponseStatusException
import java.time.Instant
import java.util.Optional
import java.util.UUID
import org.mockito.Mockito.`when` as whenever

@ExtendWith(MockitoExtension::class)
class WorkOrderServiceTest {
    @Mock
    private lateinit var workOrderRepository: WorkOrderRepository

    @Mock
    private lateinit var taskRepository: WorkOrderTaskRepository

    @Mock
    private lateinit var historyRepository: MaintenanceHistoryRepository

    @Mock
    private lateinit var equipmentLookupService: EquipmentLookupService

    @Mock
    private lateinit var auditService: AuditService

    @InjectMocks
    private lateinit var workOrderService: WorkOrderService

    @Test
    fun `cannot complete open work order`() {
        val id = UUID.randomUUID()
        val entity = WorkOrderEntity(
            id = id,
            woNumber = "WO-1",
            equipmentId = UUID.randomUUID(),
            type = "CORRECTIVE",
            status = WorkOrderStatus.OPEN,
            title = "Inspection",
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )
        whenever(workOrderRepository.findById(id)).thenReturn(Optional.of(entity))

        assertThrows(ResponseStatusException::class.java) {
            workOrderService.complete(id, CompleteWorkOrderRequest(completionAct = "{}"))
        }
    }

    @Test
    fun `assigned work order can be completed`() {
        val id = UUID.randomUUID()
        val entity = WorkOrderEntity(
            id = id,
            woNumber = "WO-2",
            equipmentId = UUID.randomUUID(),
            type = "CORRECTIVE",
            status = WorkOrderStatus.OPEN,
            title = "Repair",
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )
        whenever(workOrderRepository.findById(id)).thenReturn(Optional.of(entity))
        whenever(workOrderRepository.save(entity)).thenReturn(entity)

        workOrderService.assign(id, AssignWorkOrderRequest(UUID.randomUUID()))
        
        // Start Work Order
        workOrderService.start(id)

        val response = workOrderService.complete(id, CompleteWorkOrderRequest(completionAct = "{}"))

        assertEquals(WorkOrderStatus.COMPLETED, response.status)
    }
}

