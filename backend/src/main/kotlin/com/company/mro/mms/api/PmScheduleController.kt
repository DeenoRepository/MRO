package com.company.mro.mms.api

import com.company.mro.mms.application.PmScheduleService
import com.company.mro.mms.dto.CreatePmScheduleRequest
import com.company.mro.mms.dto.PmScheduleResponse
import com.company.mro.mms.dto.UpdatePmScheduleRequest
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
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
@RequestMapping("/api/v1/mms/pm-schedules")
class PmScheduleController(
    private val pmScheduleService: PmScheduleService
) {
    @GetMapping
    @PreAuthorize("hasAuthority('MMS_READ')")
    fun getAll(): List<PmScheduleResponse> = pmScheduleService.getAll()

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('MMS_WRITE')")
    fun create(@Valid @RequestBody request: CreatePmScheduleRequest): PmScheduleResponse =
        pmScheduleService.create(request)

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('MMS_WRITE')")
    fun update(@PathVariable id: UUID, @Valid @RequestBody request: UpdatePmScheduleRequest): PmScheduleResponse =
        pmScheduleService.update(id, request)
}

