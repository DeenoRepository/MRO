package com.company.mro.eps.application

import com.company.mro.audit.application.AuditService
import com.company.mro.eps.domain.ChangeRiskLevel
import com.company.mro.eps.domain.ChangeRequestStatus
import com.company.mro.eps.dto.CreateChangeRequest
import com.company.mro.eps.dto.CreateEquipmentRequest
import com.company.mro.eps.dto.DecideChangeRequest
import com.company.mro.eps.dto.EquipmentResponse
import com.company.mro.eps.domain.EquipmentStatus
import com.company.mro.eps.persistence.ChangeRequestEntity
import com.company.mro.eps.persistence.ChangeRequestRepository
import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.ArgumentMatchers.any
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.Mockito.`when` as whenever
import java.time.Instant
import java.util.Optional
import java.util.UUID

@ExtendWith(MockitoExtension::class)
class ChangeRequestServiceTest {
    @Mock
    private lateinit var changeRequestRepository: ChangeRequestRepository

    @Mock
    private lateinit var equipmentService: EquipmentService

    @Mock
    private lateinit var auditService: AuditService

    @Mock
    private lateinit var objectMapper: ObjectMapper

    @InjectMocks
    private lateinit var service: ChangeRequestService

    @Test
    fun `high risk request requires escalation`() {
        val request = CreateChangeRequest(
            entityType = "equipment",
            entityId = null,
            changeType = "CREATE",
            proposedData = """{"assetTag":"EQ-1","name":"Pump","category":"PUMP"}""",
            riskLevel = ChangeRiskLevel.HIGH,
            impactSummary = "Affects production line A"
        )
        whenever(objectMapper.readValue(request.proposedData, com.company.mro.eps.dto.CreateEquipmentRequest::class.java))
            .thenReturn(com.company.mro.eps.dto.CreateEquipmentRequest("EQ-1", "Pump", "PUMP"))
        whenever(changeRequestRepository.save(any())).thenAnswer { it.arguments[0] }

        val response = service.createChangeRequest(request)

        assertEquals(ChangeRiskLevel.HIGH, response.riskLevel)
        assertEquals(true, response.requiresEscalation)
        assertEquals(2, response.approvalsRequired)
        assertEquals(0, response.approvalsCompleted)
    }

    @Test
    fun `high risk request is approved only after second approval step`() {
        val id = UUID.randomUUID()
        val entity = ChangeRequestEntity(
            id = id,
            entityType = "EQUIPMENT",
            entityId = null,
            changeType = "CREATE",
            proposedData = """{"assetTag":"EQ-2","name":"Pump 2","category":"PUMP"}""",
            status = ChangeRequestStatus.PENDING,
            riskLevel = ChangeRiskLevel.HIGH,
            requiresEscalation = true,
            approvalsRequired = 2,
            approvalsCompleted = 0,
            createdAt = Instant.now()
        )
        whenever(changeRequestRepository.findById(id)).thenReturn(Optional.of(entity))
        whenever(changeRequestRepository.save(any())).thenAnswer { it.arguments[0] }
        whenever(objectMapper.readValue(entity.proposedData, CreateEquipmentRequest::class.java))
            .thenReturn(CreateEquipmentRequest("EQ-2", "Pump 2", "PUMP"))
        whenever(equipmentService.create(any())).thenReturn(
            EquipmentResponse(
                id = UUID.randomUUID(),
                assetTag = "EQ-2",
                name = "Pump 2",
                category = "PUMP",
                status = EquipmentStatus.ACTIVE,
                location = null,
                manufacturer = null,
                model = null,
                serialNumber = null,
                parentEquipmentId = null,
                installDate = null,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )

        val first = service.approve(id, DecideChangeRequest("step1"))
        val second = service.approve(id, DecideChangeRequest("step2"))

        assertEquals(ChangeRequestStatus.PENDING, first.status)
        assertEquals(1, first.approvalsCompleted)
        assertEquals(ChangeRequestStatus.APPROVED, second.status)
        assertEquals(2, second.approvalsCompleted)
    }
}
