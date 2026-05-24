package com.company.mro.srs.application

import com.company.mro.audit.application.AuditService
import com.company.mro.mms.application.WorkOrderCommandService
import com.company.mro.srs.persistence.TicketEntity
import com.company.mro.srs.persistence.TicketRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
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
import org.mockito.Mockito.verify

@ExtendWith(MockitoExtension::class)
class WorkOrderIntegrationServiceTest {
    @Mock
    private lateinit var ticketRepository: TicketRepository

    @Mock
    private lateinit var workOrderCommandService: WorkOrderCommandService

    @Mock
    private lateinit var auditService: AuditService

    @InjectMocks
    private lateinit var workOrderIntegrationService: WorkOrderIntegrationService

    @Test
    fun `creates work order from ticket and links it`() {
        val ticketId = UUID.randomUUID()
        val equipmentId = UUID.randomUUID()
        val workOrderId = UUID.randomUUID()

        val ticket = TicketEntity(
            id = ticketId,
            ticketNumber = "TK-12345",
            title = "Faulty Pump",
            description = "Water pump is leaking",
            priority = "HIGH",
            status = com.company.mro.srs.domain.TicketStatus.OPEN,
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )

        whenever(ticketRepository.findById(ticketId)).thenReturn(Optional.of(ticket))
        whenever(workOrderCommandService.createFromTicket(ticketId, equipmentId, "Water pump is leaking", "HIGH"))
            .thenReturn(workOrderId)
        whenever(ticketRepository.save(ticket)).thenReturn(ticket)

        val resultId = workOrderIntegrationService.createWorkOrderFromTicket(
            ticketId = ticketId,
            equipmentId = equipmentId,
            priority = "HIGH",
            description = "Water pump is leaking"
        )

        assertEquals(workOrderId, resultId)
        assertEquals(workOrderId, ticket.linkedWorkOrderId)
        verify(auditService).log("SRS_WORK_ORDER_CREATED_FROM_TICKET", "SRS", "ticket", ticketId.toString())
    }

    @Test
    fun `throws error if ticket already has a linked work order`() {
        val ticketId = UUID.randomUUID()
        val equipmentId = UUID.randomUUID()

        val ticket = TicketEntity(
            id = ticketId,
            ticketNumber = "TK-12345",
            title = "Faulty Pump",
            description = "Water pump is leaking",
            priority = "HIGH",
            status = com.company.mro.srs.domain.TicketStatus.OPEN,
            linkedWorkOrderId = UUID.randomUUID(),
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )

        whenever(ticketRepository.findById(ticketId)).thenReturn(Optional.of(ticket))

        assertThrows(ResponseStatusException::class.java) {
            workOrderIntegrationService.createWorkOrderFromTicket(
                ticketId = ticketId,
                equipmentId = equipmentId,
                priority = "HIGH",
                description = "Water pump is leaking"
            )
        }
    }
}
