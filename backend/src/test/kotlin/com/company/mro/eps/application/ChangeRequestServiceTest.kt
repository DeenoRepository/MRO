package com.company.mro.eps.application

import com.company.mro.audit.application.AuditService
import com.company.mro.eps.domain.ChangeRiskLevel
import com.company.mro.eps.dto.CreateChangeRequest
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
    }
}
