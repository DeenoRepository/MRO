package com.company.mro.wms.api

import com.company.mro.wms.application.ReservationService
import com.company.mro.wms.dto.CreateReservationRequest
import com.company.mro.wms.dto.ReservationResponse
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/wms/reservations")
class ReservationController(
    private val reservationService: ReservationService
) {
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('WMS_RESERVE')")
    fun create(@Valid @RequestBody request: CreateReservationRequest): ReservationResponse =
        reservationService.create(request)

    @PostMapping("/{id}/release")
    @PreAuthorize("hasAuthority('WMS_RESERVE')")
    fun release(@PathVariable id: UUID): ReservationResponse = reservationService.release(id)

    @PostMapping("/{id}/consume")
    @PreAuthorize("hasAuthority('WMS_CONSUME')")
    fun consume(@PathVariable id: UUID): ReservationResponse = reservationService.consume(id)
}

