package com.company.mro.srs.application

import com.company.mro.audit.application.AuditService
import com.company.mro.eps.application.EquipmentLookupService
import com.company.mro.srs.domain.TicketStatus
import com.company.mro.srs.dto.AssignTicketRequest
import com.company.mro.srs.dto.CreateTicketRequest
import com.company.mro.srs.persistence.RequestTypeEntity
import com.company.mro.srs.persistence.RequestTypeRepository
import com.company.mro.srs.persistence.TicketEntity
import com.company.mro.srs.persistence.TicketRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.web.server.ResponseStatusException
import java.time.Duration
import java.time.Instant
import java.util.Optional
import java.util.UUID
import org.mockito.Mockito.`when` as whenever

@ExtendWith(MockitoExtension::class)
class TicketServiceTest {
    @Mock
    private lateinit var ticketRepository: TicketRepository

    @Mock
    private lateinit var requestTypeRepository: RequestTypeRepository

    @Mock
    private lateinit var equipmentLookupService: EquipmentLookupService

    @Mock
    private lateinit var auditService: AuditService

    @InjectMocks
    private lateinit var ticketService: TicketService

    private fun anyString(): String {
        org.mockito.Mockito.any(String::class.java)
        return ""
    }

    private fun anyTicketEntity(): TicketEntity {
        org.mockito.Mockito.any(TicketEntity::class.java)
        return TicketEntity(
            id = UUID.randomUUID(),
            ticketNumber = "",
            title = "",
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )
    }

    @Test
    fun `cannot resolve open ticket directly`() {
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
            ticketService.changeStatus(id, "RESOLVED")
        }
    }

    @Test
    fun `valid transition flow works`() {
        val id = UUID.randomUUID()
        val entity = TicketEntity(
            id = id,
            ticketNumber = "TKT-2",
            title = "Issue",
            status = TicketStatus.OPEN,
            createdAt = Instant.now(),
            updatedAt = Instant.now()
        )
        
        whenever(ticketRepository.findById(id)).thenReturn(Optional.of(entity))
        whenever(ticketRepository.save(anyTicketEntity())).thenReturn(entity)

        // Test assign
        val assigneeId = UUID.randomUUID()
        val assignResponse = ticketService.assign(id, AssignTicketRequest(assigneeId))
        assertEquals(TicketStatus.ASSIGNED, assignResponse.status)
        assertEquals(assigneeId, assignResponse.assigneeId)

        // Transition from ASSIGNED to IN_PROGRESS
        val progressResponse = ticketService.changeStatus(id, "IN_PROGRESS")
        assertEquals(TicketStatus.IN_PROGRESS, progressResponse.status)

        // Transition from IN_PROGRESS to RESOLVED
        val resolvedResponse = ticketService.changeStatus(id, "RESOLVED")
        assertEquals(TicketStatus.RESOLVED, resolvedResponse.status)
        assertNotNull(resolvedResponse.resolvedAt)

        // Transition from RESOLVED to CLOSED
        val closedResponse = ticketService.changeStatus(id, "CLOSED")
        assertEquals(TicketStatus.CLOSED, closedResponse.status)
        assertNotNull(closedResponse.closedAt)
    }

    @Test
    fun `ticket creation calculates SLA due date correctly`() {
        val reqTypeId = UUID.randomUUID()
        val equipId = UUID.randomUUID()
        val request = CreateTicketRequest(
            requestTypeId = reqTypeId,
            equipmentId = equipId,
            title = "Hardware Fault",
            description = "Server failed",
            priority = "HIGH"
        )

        val requestType = RequestTypeEntity(
            id = reqTypeId,
            code = "HW_FAULT",
            name = "Hardware Fault",
            defaultPriority = "HIGH",
            slaHours = 48,
            isActive = true,
            createdAt = Instant.now()
        )

        whenever(equipmentLookupService.existsById(equipId)).thenReturn(true)
        whenever(requestTypeRepository.findById(reqTypeId)).thenReturn(Optional.of(requestType))
        whenever(ticketRepository.existsByTicketNumber(anyString())).thenReturn(false)
        whenever(ticketRepository.save(anyTicketEntity())).thenAnswer { it.arguments[0] as TicketEntity }

        val ticket = ticketService.create(request)
        assertEquals(TicketStatus.OPEN, ticket.status)
        assertNotNull(ticket.dueAt)
        // verify dueAt is roughly 48 hours from now
        val expectedDue = ticket.openedAt.plus(Duration.ofHours(48))
        assertEquals(expectedDue, ticket.dueAt)
    }

    @Test
    fun `ticket creation with null SLA request type sets null dueAt`() {
        val reqTypeId = UUID.randomUUID()
        val request = CreateTicketRequest(
            requestTypeId = reqTypeId,
            equipmentId = null,
            title = "Query",
            description = "General query",
            priority = "LOW"
        )

        val requestType = RequestTypeEntity(
            id = reqTypeId,
            code = "GENERAL",
            name = "General Query",
            defaultPriority = "LOW",
            slaHours = null,
            isActive = true,
            createdAt = Instant.now()
        )

        whenever(requestTypeRepository.findById(reqTypeId)).thenReturn(Optional.of(requestType))
        whenever(ticketRepository.existsByTicketNumber(anyString())).thenReturn(false)
        whenever(ticketRepository.save(anyTicketEntity())).thenAnswer { it.arguments[0] as TicketEntity }

        val ticket = ticketService.create(request)
        assertNull(ticket.dueAt)
    }
}

