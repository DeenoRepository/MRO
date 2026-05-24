package com.company.mro.wms.api

import com.company.mro.core.api.ApiSuccessResponse
import com.company.mro.core.api.successResponse
import com.company.mro.wms.application.ReservationService
import com.company.mro.wms.domain.ReservationStatus
import com.company.mro.wms.dto.CreateReservationRequest
import com.company.mro.wms.dto.ReservationResponse
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/wms/reservations")
@Tag(name = "WMS Reservations")
class ReservationController(
    private val reservationService: ReservationService
) {
    @GetMapping
    @Operation(summary = "Search reservations")
    @PreAuthorize("hasAuthority('WMS_READ')")
    fun search(
        @RequestParam(required = false) warehouseId: UUID?,
        @RequestParam(required = false) partId: UUID?,
        @RequestParam(required = false) status: ReservationStatus?,
        @RequestParam(required = false) referenceType: String?,
        @RequestParam(required = false) referenceId: UUID?
    ): ApiSuccessResponse<List<ReservationResponse>> =
        successResponse(reservationService.searchReservations(warehouseId, partId, status, referenceType, referenceId))

    @GetMapping("/{id}")
    @Operation(summary = "Get reservation by ID")
    @PreAuthorize("hasAuthority('WMS_READ')")
    fun getById(@PathVariable id: UUID): ApiSuccessResponse<ReservationResponse> =
        successResponse(reservationService.getReservation(id))

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create reservation")
    @PreAuthorize("hasAuthority('WMS_RESERVE')")
    fun create(@Valid @RequestBody request: CreateReservationRequest): ApiSuccessResponse<ReservationResponse> =
        successResponse(reservationService.create(request))

    @PostMapping("/{id}/release")
    @Operation(summary = "Release reservation")
    @PreAuthorize("hasAuthority('WMS_RESERVE')")
    fun release(@PathVariable id: UUID): ApiSuccessResponse<ReservationResponse> =
        successResponse(reservationService.release(id))

    @PostMapping("/{id}/consume")
    @Operation(summary = "Consume reservation")
    @PreAuthorize("hasAuthority('WMS_CONSUME')")
    fun consume(@PathVariable id: UUID): ApiSuccessResponse<ReservationResponse> =
        successResponse(reservationService.consume(id))

    @PostMapping("/expire")
    @Operation(summary = "Expire active reservations past their expiration date")
    @PreAuthorize("hasAuthority('WMS_RESERVE')")
    fun expire(): ApiSuccessResponse<Int> =
        successResponse(reservationService.expireReservations())
}
