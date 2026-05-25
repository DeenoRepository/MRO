package com.company.mro.mms.application

import com.company.mro.audit.application.AuditService
import com.company.mro.eps.application.EquipmentLookupService
import com.company.mro.mms.domain.WorkOrderStatus
import com.company.mro.mms.dto.CreatePmScheduleRequest
import com.company.mro.mms.dto.PmScheduleResponse
import com.company.mro.mms.dto.UpdatePmScheduleRequest
import com.company.mro.mms.persistence.PmScheduleEntity
import com.company.mro.mms.persistence.PmScheduleRepository
import com.company.mro.mms.persistence.WorkOrderEntity
import com.company.mro.mms.persistence.WorkOrderRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.server.ResponseStatusException
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@Service
class PmScheduleService(
    private val pmScheduleRepository: PmScheduleRepository,
    private val workOrderRepository: WorkOrderRepository,
    private val equipmentLookupService: EquipmentLookupService,
    private val auditService: AuditService
) {
    @Transactional(readOnly = true)
    fun getAll(): List<PmScheduleResponse> = pmScheduleRepository.findAll().map { it.toResponse() }

    @Transactional
    fun create(request: CreatePmScheduleRequest): PmScheduleResponse {
        if (!equipmentLookupService.existsById(request.equipmentId)) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Referenced equipment not found")
        }

        // Validate frequencyType value
        val freqType = request.frequencyType.trim().uppercase()
        if (freqType !in listOf("DAYS", "WEEKS", "MONTHS")) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported frequencyType: $freqType")
        }

        val now = Instant.now()
        val entity = PmScheduleEntity(
            id = UUID.randomUUID(),
            equipmentId = request.equipmentId,
            name = request.name.trim(),
            description = request.description?.trim(),
            frequencyType = freqType,
            frequencyValue = request.frequencyValue,
            nextDueDate = request.nextDueDate,
            isActive = true,
            createdAt = now,
            updatedAt = now
        )
        val saved = pmScheduleRepository.save(entity)
        auditService.log("MMS_PM_SCHEDULE_CREATED", "MMS", "pm_schedule", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun update(id: UUID, request: UpdatePmScheduleRequest): PmScheduleResponse {
        val entity = pmScheduleRepository.findById(id)
            .orElseThrow { ResponseStatusException(HttpStatus.NOT_FOUND, "PM schedule not found") }

        val freqType = request.frequencyType.trim().uppercase()
        if (freqType !in listOf("DAYS", "WEEKS", "MONTHS")) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported frequencyType: $freqType")
        }

        entity.name = request.name.trim()
        entity.description = request.description?.trim()
        entity.frequencyType = freqType
        entity.frequencyValue = request.frequencyValue
        entity.nextDueDate = request.nextDueDate
        entity.isActive = request.isActive
        entity.updatedAt = Instant.now()

        val saved = pmScheduleRepository.save(entity)
        auditService.log("MMS_PM_SCHEDULE_UPDATED", "MMS", "pm_schedule", saved.id.toString())
        return saved.toResponse()
    }

    @Transactional
    fun generateDueWorkOrders(): Int {
        val today = LocalDate.now()
        val dueSchedules = pmScheduleRepository.findByIsActiveTrueAndNextDueDateLessThanEqual(today)
        var count = 0

        for (schedule in dueSchedules) {
            val now = Instant.now()
            val woId = UUID.randomUUID()
            val woNumber = "PM-${schedule.id.toString().substring(0, 8).uppercase()}-${today.toString().replace("-", "")}"

            if (workOrderRepository.existsByWoNumber(woNumber)) {
                // Prevent duplicate WO on the same day for this schedule
                continue
            }

            val workOrder = WorkOrderEntity(
                id = woId,
                woNumber = woNumber,
                equipmentId = schedule.equipmentId,
                type = "PREVENTIVE",
                priority = "MEDIUM",
                status = WorkOrderStatus.OPEN,
                scheduledDate = now,
                title = "PM: ${schedule.name}",
                description = schedule.description ?: "Preventive maintenance generated from schedule.",
                createdAt = now,
                updatedAt = now
            )

            workOrderRepository.save(workOrder)
            auditService.log("MMS_WORK_ORDER_CREATED", "MMS", "work_order", woId.toString())

            // Update schedule next due date
            schedule.lastGeneratedDate = today
            schedule.nextDueDate = calculateNextDueDate(today, schedule.frequencyType, schedule.frequencyValue)
            schedule.updatedAt = now
            pmScheduleRepository.save(schedule)

            count++
        }
        return count
    }

    private fun calculateNextDueDate(base: LocalDate, freqType: String, freqValue: Int): LocalDate {
        return when (freqType) {
            "DAYS" -> base.plusDays(freqValue.toLong())
            "WEEKS" -> base.plusWeeks(freqValue.toLong())
            "MONTHS" -> base.plusMonths(freqValue.toLong())
            else -> base.plusDays(30)
        }
    }

    private fun PmScheduleEntity.toResponse(): PmScheduleResponse = PmScheduleResponse(
        id = id,
        equipmentId = equipmentId,
        name = name,
        description = description,
        frequencyType = frequencyType,
        frequencyValue = frequencyValue,
        nextDueDate = nextDueDate,
        lastGeneratedDate = lastGeneratedDate,
        isActive = isActive,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}
