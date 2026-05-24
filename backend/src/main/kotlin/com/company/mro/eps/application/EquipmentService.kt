package com.company.mro.eps.application

import com.company.mro.audit.application.AuditService
import com.company.mro.eps.domain.EquipmentStatus
import com.company.mro.eps.dto.CreateEquipmentRequest
import com.company.mro.eps.dto.EquipmentQrPayloadResponse
import com.company.mro.eps.dto.EquipmentResponse
import com.company.mro.eps.dto.UpdateEquipmentRequest
import com.company.mro.eps.persistence.EquipmentEntity
import com.company.mro.eps.persistence.EquipmentRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.Instant
import java.util.UUID

@Service
class EquipmentService(
    private val equipmentRepository: EquipmentRepository,
    private val equipmentCategoryService: EquipmentCategoryService,
    private val auditService: AuditService
) : EquipmentLookupService {
    @Transactional(readOnly = true)
    fun getAll(): List<EquipmentResponse> = equipmentRepository.findAll().map { it.toResponse() }

    @Transactional(readOnly = true)
    fun getById(id: UUID): EquipmentResponse = findEntity(id).toResponse()

    @Transactional(readOnly = true)
    fun getQrPayload(id: UUID): EquipmentQrPayloadResponse {
        findEntity(id)
        return EquipmentQrPayloadResponse(
            equipmentId = id,
            equipmentUrl = "/eps/equipment/$id",
            createTicketUrl = "/srs/tickets/new?equipmentId=$id",
            openWorkOrdersUrl = "/mms/work-orders?equipmentId=$id"
        )
    }

    @Transactional
    fun create(request: CreateEquipmentRequest): EquipmentResponse {
        if (equipmentRepository.existsByAssetTag(request.assetTag.trim())) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "Equipment assetTag already exists")
        }
        equipmentCategoryService.ensureActiveCategoryExists(request.category)
        request.parentEquipmentId?.let { ensureParentExists(it) }

        val now = Instant.now()
        val entity = EquipmentEntity(
            id = UUID.randomUUID(),
            assetTag = request.assetTag.trim(),
            name = request.name.trim(),
            category = request.category.trim(),
            status = EquipmentStatus.ACTIVE,
            location = request.location?.trim(),
            manufacturer = request.manufacturer?.trim(),
            model = request.model?.trim(),
            serialNumber = request.serialNumber?.trim(),
            parentEquipmentId = request.parentEquipmentId,
            installDate = request.installDate,
            createdAt = now,
            updatedAt = now
        )
        val saved = equipmentRepository.save(entity)
        auditService.log("EQUIPMENT_CREATED", "EPS", "equipment", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun update(id: UUID, request: UpdateEquipmentRequest): EquipmentResponse {
        val entity = findEntity(id)
        equipmentCategoryService.ensureActiveCategoryExists(request.category)
        request.parentEquipmentId?.let {
            if (it == id) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Equipment cannot be parent of itself")
            }
            ensureParentExists(it)
        }
        entity.name = request.name.trim()
        entity.category = request.category.trim()
        entity.location = request.location?.trim()
        entity.manufacturer = request.manufacturer?.trim()
        entity.model = request.model?.trim()
        entity.serialNumber = request.serialNumber?.trim()
        entity.parentEquipmentId = request.parentEquipmentId
        entity.installDate = request.installDate
        entity.updatedAt = Instant.now()
        val saved = equipmentRepository.save(entity)
        auditService.log("EQUIPMENT_UPDATED", "EPS", "equipment", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun deactivate(id: UUID) {
        val entity = findEntity(id)
        entity.status = EquipmentStatus.INACTIVE
        entity.updatedAt = Instant.now()
        equipmentRepository.save(entity)
        auditService.log("EQUIPMENT_DEACTIVATED", "EPS", "equipment", entity.id.toString())
    }

    private fun findEntity(id: UUID): EquipmentEntity =
        equipmentRepository.findById(id)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Equipment not found") }

    override fun existsById(id: UUID): Boolean = equipmentRepository.existsById(id)

    private fun ensureParentExists(id: UUID) {
        if (!equipmentRepository.existsById(id)) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Parent equipment not found")
        }
    }

    private fun EquipmentEntity.toResponse(): EquipmentResponse = EquipmentResponse(
        id = id,
        assetTag = assetTag,
        name = name,
        category = category,
        status = status,
        location = location,
        manufacturer = manufacturer,
        model = model,
        serialNumber = serialNumber,
        parentEquipmentId = parentEquipmentId,
        installDate = installDate,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}
