package com.company.mro.mms.api

import com.company.mro.mms.application.WorkOrderService
import com.company.mro.mms.domain.WorkOrderStatus
import com.company.mro.mms.dto.WorkOrderResponse
import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.any
import org.mockito.Mockito.`when`
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.context.annotation.Import
import org.springframework.http.MediaType
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.time.Instant
import java.util.UUID

@WebMvcTest(controllers = [WorkOrderController::class])
@Import(com.company.mro.core.config.SecurityConfig::class)
class WorkOrderControllerSecurityTest {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @MockBean
    private lateinit var workOrderService: WorkOrderService

    @Test
    fun `viewer cannot create work order`() {
        val payload = mapOf(
            "woNumber" to "WO-1000",
            "equipmentId" to UUID.randomUUID(),
            "type" to "CORRECTIVE"
        )
        mockMvc.perform(
            post("/api/v1/mms/work-orders")
                .with(httpBasic("viewer", "viewer"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload))
        ).andExpect(status().isForbidden)
    }

    @Test
    fun `admin can create work order`() {
        val equipmentId = UUID.randomUUID()
        val payload = mapOf(
            "woNumber" to "WO-1001",
            "equipmentId" to equipmentId,
            "type" to "CORRECTIVE"
        )
        `when`(workOrderService.create(any())).thenReturn(
            WorkOrderResponse(
                id = UUID.randomUUID(),
                woNumber = "WO-1001",
                equipmentId = equipmentId,
                type = "CORRECTIVE",
                priority = "MEDIUM",
                status = WorkOrderStatus.OPEN,
                scheduledDate = null,
                completedDate = null,
                technicianId = null,
                description = null,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        mockMvc.perform(
            post("/api/v1/mms/work-orders")
                .with(httpBasic("admin", "admin"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload))
        ).andExpect(status().isCreated)
    }
}

