package com.company.mro.eps.application

import com.company.mro.audit.application.AuditService
import com.company.mro.eps.domain.EquipmentStatus
import com.company.mro.eps.dto.CreateEquipmentRequest
import com.company.mro.eps.dto.ChangeEquipmentStatusRequest
import com.company.mro.eps.dto.DetectEquipmentDuplicateRequest
import com.company.mro.eps.dto.EquipmentDuplicateCandidateResponse
import com.company.mro.eps.dto.EquipmentMobileItemResponse
import com.company.mro.eps.dto.EquipmentMobileListResponse
import com.company.mro.eps.dto.EquipmentOverviewItemResponse
import com.company.mro.eps.dto.EquipmentQrPayloadResponse
import com.company.mro.eps.dto.EquipmentRegistryPageResponse
import com.company.mro.eps.dto.EquipmentResponse
import com.company.mro.eps.dto.EquipmentSearchItemResponse
import com.company.mro.eps.dto.UpdateEquipmentRequest
import com.company.mro.eps.persistence.EquipmentEntity
import com.company.mro.eps.persistence.EquipmentOverviewProjection
import com.company.mro.eps.persistence.EquipmentRepository
import org.springframework.beans.factory.annotation.Value
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.data.jpa.domain.JpaSort
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.Instant
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import kotlin.math.min

@Service
class EquipmentService(
    private val equipmentRepository: EquipmentRepository,
    private val equipmentCategoryService: EquipmentCategoryService,
    private val auditService: AuditService,
    @Value("\${mro.cache.equipment-read-ttl-seconds:30}")
    private val readCacheTtlSeconds: Long = 30
) : EquipmentLookupService {
    companion object {
        private const val DEFAULT_MOBILE_LIMIT = 20
        private const val MAX_MOBILE_LIMIT = 100
        private const val OVERVIEW_CACHE_PREFIX = "equipment_overview"
        private const val SEARCH_CACHE_PREFIX = "equipment_search"
        private const val REGISTRY_CACHE_PREFIX = "equipment_registry"
    }

    private data class CacheEntry(val expiresAt: Instant, val value: Any)
    private val readCache = ConcurrentHashMap<String, CacheEntry>()

    @Transactional(readOnly = true)
    fun getAll(): List<EquipmentResponse> = equipmentRepository.findAll().map { it.toResponse() }

    @Transactional(readOnly = true)
    fun getOverview(status: EquipmentStatus?, category: String?, limit: Int?): List<EquipmentOverviewItemResponse> {
        val resolvedLimit = min(limit ?: DEFAULT_MOBILE_LIMIT, MAX_MOBILE_LIMIT)
        if (resolvedLimit <= 0) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "limit must be greater than 0")
        }
        val normalizedCategory = category?.trim()?.takeIf { it.isNotEmpty() }
        val statusKey = status?.name ?: "ANY"
        val categoryKey = normalizedCategory?.lowercase() ?: "ANY"
        val cacheKey = "$OVERVIEW_CACHE_PREFIX|status=$statusKey|category=$categoryKey|limit=$resolvedLimit"
        return getCached(cacheKey) {
            equipmentRepository.findOverview(status, normalizedCategory)
                .take(resolvedLimit)
                .map { it.toOverviewItemResponse() }
        }
    }

    @Transactional(readOnly = true)
    fun getRegistryPage(
        status: EquipmentStatus?,
        category: String?,
        query: String?,
        page: Int?,
        size: Int?,
        sortBy: String?,
        sortDirection: String?
    ): EquipmentRegistryPageResponse {
        val resolvedPage = page ?: 0
        if (resolvedPage < 0) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "page must be greater than or equal to 0")
        }
        val resolvedSize = min(size ?: DEFAULT_MOBILE_LIMIT, MAX_MOBILE_LIMIT)
        if (resolvedSize <= 0) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "size must be greater than 0")
        }
        val normalizedCategory = category?.trim()?.takeIf { it.isNotEmpty() }
        val normalizedQuery = query?.trim()?.lowercase()?.takeIf { it.isNotEmpty() }
        val resolvedSortBy = when (sortBy?.trim()?.lowercase()) {
            "name" -> "name"
            "category" -> "category"
            "status" -> "status"
            "location" -> "location"
            "updatedat" -> "updated_at"
            else -> "asset_tag"
        }
        val resolvedSortDirection = if (sortDirection?.trim()?.equals("desc", ignoreCase = true) == true) {
            Sort.Direction.DESC
        } else {
            Sort.Direction.ASC
        }

        val cacheKey = "$REGISTRY_CACHE_PREFIX|status=${status?.name ?: "ANY"}|category=${normalizedCategory ?: "ANY"}|query=${normalizedQuery ?: "ANY"}|page=$resolvedPage|size=$resolvedSize|sort=$resolvedSortBy|dir=${resolvedSortDirection.name}"
        return getCached(cacheKey) {
            val pageable = PageRequest.of(resolvedPage, resolvedSize, JpaSort.unsafe(resolvedSortDirection, resolvedSortBy))
            val result = equipmentRepository.findRegistryPage(status?.name, normalizedCategory, normalizedQuery, pageable)
            EquipmentRegistryPageResponse(
                items = result.content.map { it.toResponse() },
                page = result.number,
                size = result.size,
                totalItems = result.totalElements,
                totalPages = result.totalPages
            )
        }
    }

    @Transactional(readOnly = true)
    fun search(query: String, limit: Int?): List<EquipmentSearchItemResponse> {
        val normalized = query.trim().lowercase()
        if (normalized.length < 2) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "query must be at least 2 characters")
        }
        val resolvedLimit = min(limit ?: DEFAULT_MOBILE_LIMIT, MAX_MOBILE_LIMIT)
        if (resolvedLimit <= 0) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "limit must be greater than 0")
        }
        val cacheKey = "$SEARCH_CACHE_PREFIX|query=$normalized|limit=$resolvedLimit"
        return getCached(cacheKey) {
            equipmentRepository.findAll()
                .mapNotNull { entity ->
                    val score = calculateSearchScore(entity, normalized)
                    if (score == 0) null else entity to score
                }
                .sortedWith(compareByDescending<Pair<EquipmentEntity, Int>> { it.second }.thenBy { it.first.name })
                .take(resolvedLimit)
                .map { (entity, score) -> entity.toSearchItemResponse(score) }
            }
        }

    @Transactional(readOnly = true)
    fun detectDuplicates(request: DetectEquipmentDuplicateRequest, limit: Int?): List<EquipmentDuplicateCandidateResponse> {
        val resolvedLimit = min(limit ?: 10, MAX_MOBILE_LIMIT)
        if (resolvedLimit <= 0) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "limit must be greater than 0")
        }
        val normalizedAssetTag = request.assetTag.trim().lowercase()
        val normalizedName = request.name.trim().lowercase()
        val normalizedSerial = request.serialNumber?.trim()?.lowercase()
        val normalizedManufacturer = request.manufacturer?.trim()?.lowercase()
        val normalizedModel = request.model?.trim()?.lowercase()

        return equipmentRepository.findAll()
            .mapNotNull { entity ->
                val score = calculateDuplicateScore(
                    entity = entity,
                    assetTag = normalizedAssetTag,
                    name = normalizedName,
                    serialNumber = normalizedSerial,
                    manufacturer = normalizedManufacturer,
                    model = normalizedModel
                )
                if (score >= 40) entity to score else null
            }
            .sortedWith(compareByDescending<Pair<EquipmentEntity, Int>> { it.second }.thenBy { it.first.name })
            .take(resolvedLimit)
            .map { (entity, score) -> entity.toDuplicateCandidateResponse(score) }
    }

    @Transactional(readOnly = true)
    fun getMobileList(limit: Int?, offset: Int?): EquipmentMobileListResponse {
        val resolvedLimit = min(limit ?: DEFAULT_MOBILE_LIMIT, MAX_MOBILE_LIMIT)
        if (resolvedLimit <= 0) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "limit must be greater than 0")
        }
        val resolvedOffset = offset ?: 0
        if (resolvedOffset < 0) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "offset must be greater than or equal to 0")
        }
        val all = equipmentRepository.findAll()
            .sortedByDescending { it.updatedAt }
            .drop(resolvedOffset)
            .take(resolvedLimit + 1)
            .map { it.toMobileItemResponse() }
        val hasMore = all.size > resolvedLimit
        val items = if (hasMore) all.take(resolvedLimit) else all
        return EquipmentMobileListResponse(
            items = items,
            limit = resolvedLimit,
            offset = resolvedOffset,
            nextOffset = if (hasMore) resolvedOffset + resolvedLimit else null
        )
    }

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
        invalidateReadCaches()
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
        invalidateReadCaches()
        return saved.toResponse()
    }

    @Transactional
    fun deactivate(id: UUID) {
        transitionStatus(id, ChangeEquipmentStatusRequest(EquipmentStatus.DECOMMISSIONED))
    }

    @Transactional
    fun transitionStatus(id: UUID, request: ChangeEquipmentStatusRequest): EquipmentResponse {
        val entity = findEntity(id)
        validateStatusTransition(entity.status, request.status)
        entity.status = request.status
        entity.updatedAt = Instant.now()
        val saved = equipmentRepository.save(entity)
        auditService.log("EQUIPMENT_STATUS_CHANGED", "EPS", "equipment", saved.id.toString())
        invalidateReadCaches()
        return saved.toResponse()
    }

    @Suppress("UNCHECKED_CAST")
    private fun <T : Any> getCached(key: String, loader: () -> T): T {
        val now = Instant.now()
        val cached = readCache[key]
        if (cached != null && cached.expiresAt.isAfter(now)) {
            return cached.value as T
        }
        val loaded = loader()
        val ttl = readCacheTtlSeconds.coerceAtLeast(1)
        readCache[key] = CacheEntry(now.plusSeconds(ttl), loaded as Any)
        return loaded
    }

    private fun invalidateReadCaches() {
        readCache.keys.removeIf {
            it.startsWith(OVERVIEW_CACHE_PREFIX) ||
                it.startsWith(SEARCH_CACHE_PREFIX) ||
                it.startsWith(REGISTRY_CACHE_PREFIX)
        }
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

    private fun validateStatusTransition(from: EquipmentStatus, to: EquipmentStatus) {
        if (from == to) return
        val allowed = when (from) {
            EquipmentStatus.PLANNED -> to == EquipmentStatus.ORDERED || to == EquipmentStatus.SCRAPPED
            EquipmentStatus.ORDERED -> to == EquipmentStatus.IN_TRANSIT || to == EquipmentStatus.SCRAPPED
            EquipmentStatus.IN_TRANSIT -> to == EquipmentStatus.INSTALLED || to == EquipmentStatus.SCRAPPED
            EquipmentStatus.INSTALLED -> to == EquipmentStatus.ACTIVE || to == EquipmentStatus.MAINTENANCE || to == EquipmentStatus.SCRAPPED
            EquipmentStatus.ACTIVE -> to == EquipmentStatus.MAINTENANCE || to == EquipmentStatus.DECOMMISSIONED
            EquipmentStatus.MAINTENANCE -> to == EquipmentStatus.ACTIVE || to == EquipmentStatus.DECOMMISSIONED
            EquipmentStatus.DECOMMISSIONED -> to == EquipmentStatus.SCRAPPED
            EquipmentStatus.SCRAPPED -> false
            EquipmentStatus.INACTIVE -> to == EquipmentStatus.DECOMMISSIONED || to == EquipmentStatus.ACTIVE
        }
        if (!allowed) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Transition from $from to $to is not allowed")
        }
    }

    private fun calculateSearchScore(entity: EquipmentEntity, query: String): Int {
        var score = 0
        val assetTag = entity.assetTag.lowercase()
        val name = entity.name.lowercase()
        val category = entity.category.lowercase()
        val serial = entity.serialNumber?.lowercase()
        val location = entity.location?.lowercase()
        val manufacturer = entity.manufacturer?.lowercase()
        val model = entity.model?.lowercase()

        if (assetTag == query) score += 120 else if (assetTag.contains(query)) score += 80
        if (name == query) score += 100 else if (name.contains(query)) score += 70
        if (serial == query) score += 90 else if (serial?.contains(query) == true) score += 50
        if (model == query) score += 60 else if (model?.contains(query) == true) score += 35
        if (manufacturer == query) score += 50 else if (manufacturer?.contains(query) == true) score += 25
        if (category.contains(query)) score += 20
        if (location?.contains(query) == true) score += 15
        return score
    }

    private fun calculateDuplicateScore(
        entity: EquipmentEntity,
        assetTag: String,
        name: String,
        serialNumber: String?,
        manufacturer: String?,
        model: String?
    ): Int {
        var score = 0
        val entityAssetTag = entity.assetTag.lowercase()
        val entityName = entity.name.lowercase()
        val entitySerial = entity.serialNumber?.lowercase()
        val entityManufacturer = entity.manufacturer?.lowercase()
        val entityModel = entity.model?.lowercase()

        if (entityAssetTag == assetTag) score += 100
        else if (entityAssetTag.contains(assetTag) || assetTag.contains(entityAssetTag)) score += 40

        if (entityName == name) score += 70
        else if (entityName.contains(name) || name.contains(entityName)) score += 30

        if (!serialNumber.isNullOrBlank() && !entitySerial.isNullOrBlank()) {
            if (entitySerial == serialNumber) score += 90
            else if (entitySerial.contains(serialNumber) || serialNumber.contains(entitySerial)) score += 35
        }

        if (!manufacturer.isNullOrBlank() && !entityManufacturer.isNullOrBlank()) {
            if (entityManufacturer == manufacturer) score += 25
            else if (entityManufacturer.contains(manufacturer) || manufacturer.contains(entityManufacturer)) score += 10
        }

        if (!model.isNullOrBlank() && !entityModel.isNullOrBlank()) {
            if (entityModel == model) score += 30
            else if (entityModel.contains(model) || model.contains(entityModel)) score += 12
        }
        return score
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

    private fun EquipmentEntity.toMobileItemResponse(): EquipmentMobileItemResponse = EquipmentMobileItemResponse(
        id = id,
        assetTag = assetTag,
        name = name,
        status = status,
        location = location
    )

    private fun EquipmentEntity.toSearchItemResponse(score: Int): EquipmentSearchItemResponse = EquipmentSearchItemResponse(
        id = id,
        assetTag = assetTag,
        name = name,
        category = category,
        status = status,
        location = location,
        relevanceScore = score
    )

    private fun EquipmentEntity.toDuplicateCandidateResponse(score: Int): EquipmentDuplicateCandidateResponse =
        EquipmentDuplicateCandidateResponse(
            id = id,
            assetTag = assetTag,
            name = name,
            serialNumber = serialNumber,
            manufacturer = manufacturer,
            model = model,
            duplicateScore = score
        )

    private fun EquipmentOverviewProjection.toOverviewItemResponse(): EquipmentOverviewItemResponse =
        EquipmentOverviewItemResponse(
            id = getId(),
            assetTag = getAssetTag(),
            name = getName(),
            category = getCategory(),
            status = getStatus(),
            location = getLocation(),
            updatedAt = getUpdatedAt()
        )
}
