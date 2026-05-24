package com.company.mro.wms.application

import com.company.mro.audit.application.AuditService
import com.company.mro.wms.dto.CreatePartRequest
import com.company.mro.wms.dto.PartResponse
import com.company.mro.wms.persistence.PartEntity
import com.company.mro.wms.persistence.PartRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.math.BigDecimal
import java.util.UUID

@Service
class PartService(
    private val partRepository: PartRepository,
    private val auditService: AuditService
) {
    @Transactional(readOnly = true)
    fun getAll(): List<PartResponse> = partRepository.findAll().map { it.toResponse() }

    @Transactional
    fun create(request: CreatePartRequest): PartResponse {
        if (partRepository.existsByPartNumber(request.partNumber.trim())) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "Part number already exists")
        }
        val saved = partRepository.save(
            PartEntity(
                id = UUID.randomUUID(),
                partNumber = request.partNumber.trim().uppercase(),
                name = request.name.trim(),
                description = request.description?.trim(),
                unit = request.unit?.trim()?.uppercase() ?: "PCS",
                minStockLevel = request.minStockLevel ?: BigDecimal.ZERO
            )
        )
        auditService.log("PART_CREATED", "WMS", "part", saved.id.toString())
        return saved.toResponse()
    }

    private fun PartEntity.toResponse(): PartResponse = PartResponse(
        id = id,
        partNumber = partNumber,
        name = name,
        description = description,
        unit = unit,
        minStockLevel = minStockLevel
    )
}

