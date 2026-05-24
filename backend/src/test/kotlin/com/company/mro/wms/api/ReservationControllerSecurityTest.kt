package com.company.mro.wms.api

import com.company.mro.wms.application.ReservationService
import com.company.mro.wms.domain.ReservationStatus
import com.company.mro.wms.dto.ReservationResponse
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
import java.math.BigDecimal
import java.time.Instant
import java.util.UUID

@WebMvcTest(controllers = [ReservationController::class])
@Import(com.company.mro.core.config.SecurityConfig::class)
class ReservationControllerSecurityTest {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @MockBean
    private lateinit var reservationService: ReservationService

    @Test
    fun `viewer cannot create reservation`() {
        val payload = mapOf(
            "warehouseId" to UUID.randomUUID(),
            "partId" to UUID.randomUUID(),
            "quantity" to 2.0
        )
        mockMvc.perform(
            post("/api/v1/wms/reservations")
                .with(httpBasic("viewer", "viewer"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload))
        ).andExpect(status().isForbidden)
    }

    @Test
    fun `admin can create reservation`() {
        val payload = mapOf(
            "warehouseId" to UUID.randomUUID(),
            "partId" to UUID.randomUUID(),
            "quantity" to 2.0
        )
        `when`(reservationService.create(any())).thenReturn(
            ReservationResponse(
                id = UUID.randomUUID(),
                warehouseId = UUID.randomUUID(),
                partId = UUID.randomUUID(),
                quantity = BigDecimal("2.0"),
                status = ReservationStatus.RESERVED,
                referenceType = null,
                referenceId = null,
                expiresAt = null,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
        )
        mockMvc.perform(
            post("/api/v1/wms/reservations")
                .with(httpBasic("admin", "admin"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(payload))
        ).andExpect(status().isCreated)
    }
}

