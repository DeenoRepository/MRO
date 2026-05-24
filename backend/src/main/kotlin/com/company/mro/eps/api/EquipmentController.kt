package com.company.mro.eps.api

import com.company.mro.eps.application.EquipmentService
import com.company.mro.eps.dto.CreateEquipmentRequest
import com.company.mro.eps.dto.EquipmentResponse
import com.company.mro.eps.dto.UpdateEquipmentRequest
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/eps/equipment")
class EquipmentController(
    private val equipmentService: EquipmentService
) {
    @GetMapping
    @PreAuthorize("hasAuthority('EPS_READ')")
    fun getAll(): List<EquipmentResponse> = equipmentService.getAll()

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('EPS_READ')")
    fun getById(@PathVariable id: UUID): EquipmentResponse = equipmentService.getById(id)

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('EPS_WRITE')")
    fun create(@Valid @RequestBody request: CreateEquipmentRequest): EquipmentResponse =
        equipmentService.create(request)

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('EPS_WRITE')")
    fun update(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateEquipmentRequest
    ): EquipmentResponse = equipmentService.update(id, request)

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('EPS_WRITE')")
    fun deactivate(@PathVariable id: UUID) = equipmentService.deactivate(id)
}

