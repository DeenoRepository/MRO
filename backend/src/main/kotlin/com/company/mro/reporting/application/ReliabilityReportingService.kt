package com.company.mro.reporting.application

import com.company.mro.reporting.dto.EquipmentReliabilityResponse
import com.company.mro.reporting.persistence.CorrectiveCompletionProjection
import com.company.mro.reporting.persistence.ReportingReliabilityRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Duration
import java.time.Instant
import java.util.UUID

@Service
class ReliabilityReportingService(
    private val reliabilityRepository: ReportingReliabilityRepository
) {
    @Transactional(readOnly = true)
    fun getEquipmentReliability(
        equipmentId: UUID,
        from: Instant?,
        to: Instant?
    ): EquipmentReliabilityResponse {
        val completions = reliabilityRepository.findCorrectiveCompletions(equipmentId, from, to)
        return EquipmentReliabilityResponse(
            equipmentId = equipmentId,
            periodStart = from,
            periodEnd = to,
            failuresCount = completions.size,
            mttrHours = calculateMttrHours(completions),
            mtbfHours = calculateMtbfHours(completions)
        )
    }

    internal fun calculateMttrHours(completions: List<CorrectiveCompletionProjection>): Double? {
        val durations = completions.mapNotNull { c ->
            val started = c.startedAt ?: return@mapNotNull null
            val duration = Duration.between(started, c.completedAt)
            if (duration.isNegative) null else duration.toMinutes().toDouble() / 60.0
        }
        if (durations.isEmpty()) return null
        return durations.average()
    }

    internal fun calculateMtbfHours(completions: List<CorrectiveCompletionProjection>): Double? {
        if (completions.size < 2) return null
        val sorted = completions.sortedBy { it.completedAt }
        val gaps = mutableListOf<Double>()
        for (i in 1 until sorted.size) {
            val gap = Duration.between(sorted[i - 1].completedAt, sorted[i].completedAt)
            if (!gap.isNegative) {
                gaps.add(gap.toMinutes().toDouble() / 60.0)
            }
        }
        if (gaps.isEmpty()) return null
        return gaps.average()
    }
}
