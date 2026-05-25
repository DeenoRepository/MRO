package com.company.mro.eps.application

import com.company.mro.audit.application.AuditService
import com.company.mro.eps.domain.ComplianceRecordStatus
import com.company.mro.eps.dto.ComplianceRecordResponse
import com.company.mro.eps.dto.CreateComplianceRecordRequest
import com.company.mro.eps.persistence.ComplianceRecordEntity
import com.company.mro.eps.persistence.ComplianceRecordRepository
import com.company.mro.eps.persistence.EquipmentRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@Service
class ComplianceRecordService(
    private val equipmentRepository: EquipmentRepository,
    private val complianceRecordRepository: ComplianceRecordRepository,
    private val auditService: AuditService
) {
    @Transactional
    fun create(equipmentId: UUID, request: CreateComplianceRecordRequest): ComplianceRecordResponse {
        if (!equipmentRepository.existsById(equipmentId)) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Equipment not found")
        }
        if (request.validFrom != null && request.validFrom.isAfter(request.validUntil)) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "validFrom cannot be after validUntil")
        }
        val now = Instant.now()
        val entity = ComplianceRecordEntity(
            id = UUID.randomUUID(),
            equipmentId = equipmentId,
            recordType = request.recordType.trim().uppercase(),
            title = request.title.trim(),
            validFrom = request.validFrom,
            validUntil = request.validUntil,
            status = determineStatus(request.validUntil),
            notes = request.notes?.trim(),
            createdAt = now,
            updatedAt = now
        )
        val saved = complianceRecordRepository.save(entity)
        auditService.log("EPS_COMPLIANCE_RECORD_CREATED", "EPS", "compliance_record", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional(readOnly = true)
    fun getByEquipment(equipmentId: UUID): List<ComplianceRecordResponse> {
        if (!equipmentRepository.existsById(equipmentId)) {
            throw ResponseStatusException(HttpStatus.NOT_FOUND, "Equipment not found")
        }
        return complianceRecordRepository.findByEquipmentId(equipmentId).map { it.toResponse() }
    }

    @Transactional(readOnly = true)
    fun getExpiring(beforeDate: LocalDate): List<ComplianceRecordResponse> =
        complianceRecordRepository.findByValidUntilLessThanEqualOrderByValidUntilAsc(beforeDate).map { it.toResponse() }

    private fun determineStatus(validUntil: LocalDate): ComplianceRecordStatus {
        val today = LocalDate.now()
        return when {
            validUntil.isBefore(today) -> ComplianceRecordStatus.EXPIRED
            !validUntil.isAfter(today.plusDays(30)) -> ComplianceRecordStatus.EXPIRING
            else -> ComplianceRecordStatus.VALID
        }
    }

    private fun ComplianceRecordEntity.toResponse(): ComplianceRecordResponse = ComplianceRecordResponse(
        id = id,
        equipmentId = equipmentId,
        recordType = recordType,
        title = title,
        validFrom = validFrom,
        validUntil = validUntil,
        status = status,
        notes = notes,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}
