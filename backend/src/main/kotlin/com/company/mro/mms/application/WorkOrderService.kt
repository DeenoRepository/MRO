package com.company.mro.mms.application

import com.company.mro.audit.application.AuditService
import com.company.mro.eps.application.EquipmentLookupService
import com.company.mro.mms.domain.WorkOrderStatus
import com.company.mro.mms.dto.AssignWorkOrderRequest
import com.company.mro.mms.dto.CreateWorkOrderRequest
import com.company.mro.mms.dto.WorkOrderResponse
import com.company.mro.mms.persistence.WorkOrderEntity
import com.company.mro.mms.persistence.WorkOrderRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.Instant
import java.util.UUID

@Service
class WorkOrderService(
    private val workOrderRepository: WorkOrderRepository,
    private val equipmentLookupService: EquipmentLookupService,
    private val auditService: AuditService
) : WorkOrderCommandService {
    @Transactional(readOnly = true)
    fun getAll(): List<WorkOrderResponse> = workOrderRepository.findAll().map { it.toResponse() }

    @Transactional(readOnly = true)
    fun getById(id: UUID): WorkOrderResponse = findEntity(id).toResponse()

    @Transactional
    fun create(request: CreateWorkOrderRequest): WorkOrderResponse {
        if (workOrderRepository.existsByWoNumber(request.woNumber.trim())) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "Work order number already exists")
        }
        if (!equipmentLookupService.existsById(request.equipmentId)) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Referenced equipment not found")
        }

        val now = Instant.now()
        val entity = WorkOrderEntity(
            id = UUID.randomUUID(),
            woNumber = request.woNumber.trim(),
            equipmentId = request.equipmentId,
            type = request.type.trim().uppercase(),
            priority = request.priority?.trim()?.uppercase() ?: "MEDIUM",
            status = WorkOrderStatus.OPEN,
            scheduledDate = request.scheduledDate,
            description = request.description?.trim(),
            createdAt = now,
            updatedAt = now
        )
        val saved = workOrderRepository.save(entity)
        auditService.log("WORK_ORDER_CREATED", "MMS", "work_order", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun assign(id: UUID, request: AssignWorkOrderRequest): WorkOrderResponse {
        val entity = findEntity(id)
        if (entity.status != WorkOrderStatus.OPEN) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Only OPEN work orders can be assigned")
        }
        entity.technicianId = request.technicianId
        entity.status = WorkOrderStatus.ASSIGNED
        entity.updatedAt = Instant.now()
        val saved = workOrderRepository.save(entity)
        auditService.log("WORK_ORDER_ASSIGNED", "MMS", "work_order", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun complete(id: UUID): WorkOrderResponse {
        val entity = findEntity(id)
        if (entity.status != WorkOrderStatus.ASSIGNED) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Only ASSIGNED work orders can be completed")
        }
        entity.status = WorkOrderStatus.COMPLETED
        entity.completedDate = Instant.now()
        entity.updatedAt = Instant.now()
        val saved = workOrderRepository.save(entity)
        auditService.log("WORK_ORDER_COMPLETED", "MMS", "work_order", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun cancel(id: UUID): WorkOrderResponse {
        val entity = findEntity(id)
        if (entity.status == WorkOrderStatus.COMPLETED || entity.status == WorkOrderStatus.CANCELLED) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Completed or cancelled work orders cannot be cancelled")
        }
        entity.status = WorkOrderStatus.CANCELLED
        entity.updatedAt = Instant.now()
        val saved = workOrderRepository.save(entity)
        auditService.log("WORK_ORDER_CANCELLED", "MMS", "work_order", saved.id.toString())
        return saved.toResponse()
    }

    private fun findEntity(id: UUID): WorkOrderEntity =
        workOrderRepository.findById(id)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Work order not found") }

    @Transactional
    override fun createFromTicket(ticketId: UUID, equipmentId: UUID?, description: String, priority: String): UUID {
        val resolvedEquipmentId = equipmentId ?: throw ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "Equipment is required to create work order from ticket"
        )
        if (!equipmentLookupService.existsById(resolvedEquipmentId)) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Referenced equipment not found")
        }
        val now = Instant.now()
        val workOrder = WorkOrderEntity(
            id = UUID.randomUUID(),
            woNumber = "WO-${ticketId.toString().substring(0, 8).uppercase()}",
            equipmentId = resolvedEquipmentId,
            type = "CORRECTIVE",
            priority = priority.uppercase(),
            status = WorkOrderStatus.OPEN,
            description = description,
            createdAt = now,
            updatedAt = now
        )
        val saved = workOrderRepository.save(workOrder)
        auditService.log("WORK_ORDER_CREATED_FROM_TICKET", "MMS", "work_order", saved.id.toString())
        return saved.id
    }

    private fun WorkOrderEntity.toResponse(): WorkOrderResponse = WorkOrderResponse(
        id = id,
        woNumber = woNumber,
        equipmentId = equipmentId,
        type = type,
        priority = priority,
        status = status,
        scheduledDate = scheduledDate,
        completedDate = completedDate,
        technicianId = technicianId,
        description = description,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}
