package com.company.mro.reporting.persistence

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate
import org.springframework.stereotype.Repository
import java.time.Instant
import java.util.UUID

@Repository
class ReportingReliabilityRepository(
    private val jdbcTemplate: NamedParameterJdbcTemplate
) {
    fun findCorrectiveCompletions(
        equipmentId: UUID,
        from: Instant?,
        to: Instant?
    ): List<CorrectiveCompletionProjection> {
        val sql = """
            SELECT
                wo.equipment_id AS equipment_id,
                wo.started_at AS started_at,
                wo.completed_date AS completed_at
            FROM mms.work_orders wo
            WHERE wo.equipment_id = :equipmentId
              AND wo.type = 'CORRECTIVE'
              AND wo.completed_date IS NOT NULL
              AND (:fromTs IS NULL OR wo.completed_date >= :fromTs)
              AND (:toTs IS NULL OR wo.completed_date <= :toTs)
            ORDER BY wo.completed_date ASC
        """.trimIndent()

        val params = MapSqlParameterSource()
            .addValue("equipmentId", equipmentId)
            .addValue("fromTs", from)
            .addValue("toTs", to)

        return jdbcTemplate.query(sql, params) { rs, _ ->
            val completedAt = rs.getTimestamp("completed_at")?.toInstant()
                ?: throw IllegalStateException("completed_at is null for completed work order projection")
            CorrectiveCompletionProjection(
                equipmentId = rs.getObject("equipment_id", UUID::class.java),
                startedAt = rs.getTimestamp("started_at")?.toInstant(),
                completedAt = completedAt
            )
        }
    }
}

data class CorrectiveCompletionProjection(
    val equipmentId: UUID,
    val startedAt: Instant?,
    val completedAt: Instant
)
