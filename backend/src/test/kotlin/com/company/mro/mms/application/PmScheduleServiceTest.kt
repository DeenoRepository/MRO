package com.company.mro.mms.application

import com.company.mro.audit.application.AuditService
import com.company.mro.eps.application.EquipmentLookupService
import com.company.mro.mms.dto.CreatePmScheduleRequest
import com.company.mro.mms.persistence.PmScheduleEntity
import com.company.mro.mms.persistence.PmScheduleRepository
import com.company.mro.mms.persistence.WorkOrderRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.Mockito.`when`
import org.mockito.Mockito.any
import org.mockito.Mockito.verify
import org.mockito.junit.jupiter.MockitoExtension
import java.time.LocalDate
import java.util.UUID

@ExtendWith(MockitoExtension::class)
class PmScheduleServiceTest {
    @Mock
    private lateinit var pmScheduleRepository: PmScheduleRepository

    @Mock
    private lateinit var workOrderRepository: WorkOrderRepository

    @Mock
    private lateinit var equipmentLookupService: EquipmentLookupService

    @Mock
    private lateinit var auditService: AuditService

    @InjectMocks
    private lateinit var pmScheduleService: PmScheduleService

    @Test
    fun `generateDueWorkOrders creates work orders for due schedules`() {
        val scheduleId = UUID.randomUUID()
        val equipmentId = UUID.randomUUID()
        val schedule = PmScheduleEntity(
            id = scheduleId,
            equipmentId = equipmentId,
            name = "Monthly Inspection",
            frequencyType = "MONTHS",
            frequencyValue = 1,
            nextDueDate = LocalDate.now().minusDays(1),
            isActive = true
        )

        `when`(pmScheduleRepository.findByIsActiveTrueAndNextDueDateLessThanEqual(any()))
            .thenReturn(listOf(schedule))
        `when`(workOrderRepository.existsByWoNumber(any())).thenReturn(false)

        val count = pmScheduleService.generateDueWorkOrders()

        assertEquals(1, count)
        verify(workOrderRepository).save(any())
        verify(pmScheduleRepository).save(schedule)
        assertEquals(LocalDate.now().plusMonths(1), schedule.nextDueDate)
    }
}
