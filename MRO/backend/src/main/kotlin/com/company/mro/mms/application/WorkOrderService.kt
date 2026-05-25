package com.company.mro.mms.application

import com.company.mro.audit.application.AuditService
import com.company.mro.eps.application.EquipmentLookupService
import com.company.mro.mms.domain.WorkOrderStatus
import com.company.mro.mms.dto.AssignWorkOrderRequest
import com.company.mro.mms.dto.CompleteWorkOrderRequest
import com.company.mro.mms.dto.CreateTaskRequest
import com.company.mro.mms.dto.CreateWorkOrderRequest
import com.company.mro.mms.dto.HistoryResponse
import com.company.mro.mms.dto.TaskResponse
import com.company.mro.mms.dto.WorkOrderResponse
import com.company.mro.mms.persistence.MaintenanceHistoryEntity
import com.company.mro.mms.persistence.MaintenanceHistoryRepository
import com.company.mro.mms.persistence.WorkOrderEntity
import com.company.mro.mms.persistence.WorkOrderRepository
import com.company.mro.mms.persistence.WorkOrderTaskEntity
import com.company.mro.mms.persistence.WorkOrderTaskRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.time.Instant
import java.util.UUID

@Service
class WorkOrderService(
    private val workOrderRepository: WorkOrderRepository,
    private val taskRepository: WorkOrderTaskRepository,
    private val historyRepository: MaintenanceHistoryRepository,
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
            title = request.title.trim(),
            description = request.description?.trim(),
            createdAt = now,
            updatedAt = now
        )
        val saved = workOrderRepository.save(entity)
        writeHistory(saved.id, saved.equipmentId, "WORK_ORDER_CREATED")
        auditService.log("MMS_WORK_ORDER_CREATED", "MMS", "work_order", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun assign(id: UUID, request: AssignWorkOrderRequest): WorkOrderResponse {
        val entity = findEntity(id)
        validateTransition(entity.status, WorkOrderStatus.ASSIGNED)
        entity.technicianId = request.technicianId
        entity.status = WorkOrderStatus.ASSIGNED
        entity.updatedAt = Instant.now()
        val saved = workOrderRepository.save(entity)
        writeHistory(saved.id, saved.equipmentId, "WORK_ORDER_ASSIGNED")
        auditService.log("MMS_WORK_ORDER_ASSIGNED", "MMS", "work_order", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun start(id: UUID): WorkOrderResponse {
        val entity = findEntity(id)
        validateTransition(entity.status, WorkOrderStatus.IN_PROGRESS)
        entity.status = WorkOrderStatus.IN_PROGRESS
        entity.startedAt = Instant.now()
        entity.updatedAt = Instant.now()
        val saved = workOrderRepository.save(entity)
        writeHistory(saved.id, saved.equipmentId, "WORK_ORDER_STARTED")
        auditService.log("MMS_WORK_ORDER_STARTED", "MMS", "work_order", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun complete(id: UUID, request: CompleteWorkOrderRequest): WorkOrderResponse {
        val entity = findEntity(id)
        validateTransition(entity.status, WorkOrderStatus.COMPLETED)

        // Complete any remaining open tasks
        val tasks = taskRepository.findByWorkOrderIdOrderBySortOrderAsc(id)
        tasks.forEach {
            if (it.status == "OPEN") {
                it.status = "COMPLETED"
                it.completedAt = Instant.now()
                taskRepository.save(it)
            }
        }

        val now = Instant.now()
        entity.status = WorkOrderStatus.COMPLETED
        entity.completedDate = now
        entity.completionAct = request.completionAct
        entity.signatureHash = sha256(request.completionAct)
        entity.description = entity.description?.let { "$it\nNotes: ${request.completionNotes ?: ""}" } ?: request.completionNotes
        entity.updatedAt = now

        val saved = workOrderRepository.save(entity)
        writeHistory(saved.id, saved.equipmentId, "WORK_ORDER_COMPLETED")
        auditService.log("MMS_WORK_ORDER_COMPLETED", "MMS", "work_order", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun cancel(id: UUID): WorkOrderResponse {
        val entity = findEntity(id)
        validateTransition(entity.status, WorkOrderStatus.CANCELLED)
        entity.status = WorkOrderStatus.CANCELLED
        entity.updatedAt = Instant.now()
        val saved = workOrderRepository.save(entity)
        writeHistory(saved.id, saved.equipmentId, "WORK_ORDER_CANCELLED")
        auditService.log("MMS_WORK_ORDER_CANCELLED", "MMS", "work_order", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun addTask(workOrderId: UUID, request: CreateTaskRequest): TaskResponse {
        findEntity(workOrderId) // Ensure work order exists
        val task = WorkOrderTaskEntity(
            id = UUID.randomUUID(),
            workOrderId = workOrderId,
            title = request.title.trim(),
            description = request.description?.trim(),
            status = "OPEN",
            sortOrder = request.sortOrder,
            createdAt = Instant.now()
        )
        val saved = taskRepository.save(task)
        auditService.log("MMS_TASK_CREATED", "MMS", "work_order_task", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun completeTask(taskId: UUID): TaskResponse {
        val task = taskRepository.findById(taskId)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found") }
        if (task.status == "COMPLETED") {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Task is already completed")
        }
        task.status = "COMPLETED"
        task.completedAt = Instant.now()
        val saved = taskRepository.save(task)
        auditService.log("MMS_TASK_COMPLETED", "MMS", "work_order_task", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional(readOnly = true)
    fun getTasks(workOrderId: UUID): List<TaskResponse> {
        findEntity(workOrderId)
        return taskRepository.findByWorkOrderIdOrderBySortOrderAsc(workOrderId).map { it.toResponse() }
    }

    @Transactional(readOnly = true)
    fun getHistory(workOrderId: UUID): List<HistoryResponse> {
        findEntity(workOrderId)
        return historyRepository.findByWorkOrderId(workOrderId).map { it.toResponse() }
    }

    private fun findEntity(id: UUID): WorkOrderEntity =
        workOrderRepository.findById(id)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "Work order not found") }

    private fun validateTransition(from: WorkOrderStatus, to: WorkOrderStatus) {
        val allowed = when (from) {
            WorkOrderStatus.OPEN -> to == WorkOrderStatus.PLANNED || to == WorkOrderStatus.ASSIGNED || to == WorkOrderStatus.CANCELLED
            WorkOrderStatus.PLANNED -> to == WorkOrderStatus.ASSIGNED || to == WorkOrderStatus.CANCELLED
            WorkOrderStatus.ASSIGNED -> to == WorkOrderStatus.IN_PROGRESS || to == WorkOrderStatus.CANCELLED
            WorkOrderStatus.IN_PROGRESS -> to == WorkOrderStatus.WAITING_PARTS || to == WorkOrderStatus.COMPLETED
            WorkOrderStatus.WAITING_PARTS -> to == WorkOrderStatus.IN_PROGRESS
            WorkOrderStatus.COMPLETED -> false
            WorkOrderStatus.CANCELLED -> false
        }
        if (!allowed) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Transition from $from to $to is not allowed")
        }
    }

    private fun writeHistory(workOrderId: UUID, equipmentId: UUID, eventType: String, eventData: String? = null) {
        historyRepository.save(
            MaintenanceHistoryEntity(
                id = UUID.randomUUID(),
                workOrderId = workOrderId,
                equipmentId = equipmentId,
                eventType = eventType,
                eventData = eventData,
                createdAt = Instant.now()
            )
        )
    }

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
            woNumber = "WO-\${ticketId.toString().substring(0, 8).uppercase()}",
            equipmentId = resolvedEquipmentId,
            type = "CORRECTIVE",
            priority = priority.uppercase(),
            status = WorkOrderStatus.OPEN,
            title = "Maintenance work from Ticket",
            description = description,
            createdAt = now,
            updatedAt = now
        )
        val saved = workOrderRepository.save(workOrder)
        writeHistory(saved.id, saved.equipmentId, "WORK_ORDER_CREATED_FROM_TICKET")
        auditService.log("MMS_WORK_ORDER_CREATED", "MMS", "work_order", saved.id.toString())
        return saved.id
    }

    private fun sha256(value: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val hash = digest.digest(value.toByteArray(StandardCharsets.UTF_8))
        return hash.joinToString("") { "%02x".format(it) }
    }

    private fun WorkOrderEntity.toResponse(): WorkOrderResponse = WorkOrderResponse(
        id = id,
        woNumber = woNumber,
        equipmentId = equipmentId,
        type = type,
        priority = priority,
        status = status,
        scheduledDate = scheduledDate,
        startedAt = startedAt,
        completedDate = completedDate,
        technicianId = technicianId,
        title = title,
        description = description,
        completionAct = completionAct,
        signatureHash = signatureHash,
        createdAt = createdAt,
        updatedAt = updatedAt
    )

    private fun WorkOrderTaskEntity.toResponse(): TaskResponse = TaskResponse(
        id = id,
        workOrderId = workOrderId,
        title = title,
        description = description,
        status = status,
        sortOrder = sortOrder,
        completedAt = completedAt,
        completedBy = completedBy,
        createdAt = createdAt
    )

    private fun MaintenanceHistoryEntity.toResponse(): HistoryResponse = HistoryResponse(
        id = id,
        workOrderId = workOrderId,
        equipmentId = equipmentId,
        eventType = eventType,
        eventData = eventData,
        createdAt = createdAt,
        createdBy = createdBy
    )
}
