package com.company.mro.eps.application

import com.company.mro.audit.application.AuditService
import com.company.mro.eps.dto.CreateEquipmentCategoryRequest
import com.company.mro.eps.dto.EquipmentCategoryResponse
import com.company.mro.eps.dto.UpdateEquipmentCategoryRequest
import com.company.mro.eps.persistence.EquipmentCategoryEntity
import com.company.mro.eps.persistence.EquipmentCategoryRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.Instant
import java.util.UUID

@Service
class EquipmentCategoryService(
    private val categoryRepository: EquipmentCategoryRepository,
    private val auditService: AuditService
) {
    @Transactional(readOnly = true)
    fun getAll(): List<EquipmentCategoryResponse> = categoryRepository.findAll().map { it.toResponse() }

    @Transactional(readOnly = true)
    fun getById(id: UUID): EquipmentCategoryResponse = findEntity(id).toResponse()

    @Transactional
    fun create(request: CreateEquipmentCategoryRequest): EquipmentCategoryResponse {
        val normalizedCode = request.code.trim().uppercase()
        if (categoryRepository.existsByCode(normalizedCode)) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "Equipment category code already exists")
        }
        val now = Instant.now()
        val parentId = request.parentId?.also { validateParent(it, null) }
        val saved = categoryRepository.save(
            EquipmentCategoryEntity(
                id = UUID.randomUUID(),
                code = normalizedCode,
                name = request.name.trim(),
                parentId = parentId,
                isActive = true,
                createdAt = now,
                updatedAt = now
            )
        )
        auditService.log("EPS_CATEGORY_CREATED", "EPS", "equipment_category", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun update(id: UUID, request: UpdateEquipmentCategoryRequest): EquipmentCategoryResponse {
        val entity = findEntity(id)
        val parentId = request.parentId?.also { validateParent(it, id) }
        entity.name = request.name.trim()
        entity.parentId = parentId
        entity.isActive = request.isActive
        entity.updatedAt = Instant.now()
        val saved = categoryRepository.save(entity)
        auditService.log("EPS_CATEGORY_UPDATED", "EPS", "equipment_category", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional(readOnly = true)
    fun ensureActiveCategoryExists(categoryCode: String) {
        if (!categoryRepository.existsByCodeAndIsActiveTrue(categoryCode.trim().uppercase())) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Referenced equipment category not found or inactive")
        }
    }

    private fun validateParent(parentId: UUID, selfId: UUID?) {
        if (selfId != null && parentId == selfId) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Category cannot be parent of itself")
        }
        val parent = categoryRepository.findById(parentId)
            .orElseThrow { ResponseStatusException(HttpStatus.BAD_REQUEST, "Parent category not found") }
        if (!parent.isActive) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Parent category is inactive")
        }
    }

    private fun findEntity(id: UUID): EquipmentCategoryEntity =
        categoryRepository.findById(id)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Equipment category not found") }

    private fun EquipmentCategoryEntity.toResponse(): EquipmentCategoryResponse = EquipmentCategoryResponse(
        id = id,
        code = code,
        name = name,
        parentId = parentId,
        isActive = isActive,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}
