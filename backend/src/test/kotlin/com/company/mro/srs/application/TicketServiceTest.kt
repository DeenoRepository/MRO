package com.company.mro.srs.application

import com.company.mro.audit.application.AuditService
import com.company.mro.eps.application.EquipmentLookupService
import com.company.mro.mms.application.WorkOrderCommandService
import com.company.mro.srs.domain.TicketStatus
import com.company.mro.srs.persistence.TicketCommentRepository
import com.company.mro.srs.persistence.TicketEntity
import com.company.mro.srs.persistence.TicketRepository
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
class TicketServiceTest {
    @Mock
    private lateinit var ticketRepository: TicketRepository

    @Mock
    private lateinit var ticketCommentRepository: TicketCommentRepository

    @Mock
    private lateinit var equipmentLookupService: EquipmentLookupService

    @Mock
    private lateinit var workOrderCommandService: WorkOrderCommandService

    @Mock
    private lateinit var auditService: AuditService

    @InjectMocks
    private lateinit var ticketService: TicketService

    @Test
    fun `cannot resolve open ticket`() {
        val id = UUID.randomUUID()
        val entity = TicketEntity(
            id = id,
            ticketNumber = "TKT-1",
            title = "Issue",
            status = TicketStatus.OPEN,
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )
        whenever(ticketRepository.findById(id)).thenReturn(Optional.of(entity))

        assertThrows(ResponseStatusException::class.java) {
            ticketService.resolve(id)
        }
    }

    @Test
    fun `assigned ticket can be resolved`() {
        val id = UUID.randomUUID()
        val entity = TicketEntity(
            id = id,
            ticketNumber = "TKT-2",
            title = "Issue",
            status = TicketStatus.ASSIGNED,
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )
        whenever(ticketRepository.findById(id)).thenReturn(Optional.of(entity))
        whenever(ticketRepository.save(entity)).thenReturn(entity)

        val response = ticketService.resolve(id)
        assertEquals(TicketStatus.RESOLVED, response.status)
    }
}

