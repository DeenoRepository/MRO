package com.company.mro.reporting.application

import com.company.mro.reporting.persistence.CorrectiveCompletionProjection
import com.company.mro.reporting.persistence.ReportingReliabilityRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import java.time.Instant
import java.util.UUID

@ExtendWith(MockitoExtension::class)
class ReliabilityReportingServiceTest {
    @Mock
    private lateinit var reliabilityRepository: ReportingReliabilityRepository

    @InjectMocks
    private lateinit var service: ReliabilityReportingService

    @Test
    fun `calculates mttr and mtbf from corrective completions`() {
        val equipmentId = UUID.randomUUID()
        val t0 = Instant.parse("2026-01-01T00:00:00Z")
        val t2h = Instant.parse("2026-01-01T02:00:00Z")
        val t10h = Instant.parse("2026-01-01T10:00:00Z")
        val t13h = Instant.parse("2026-01-01T13:00:00Z")
        val t25h = Instant.parse("2026-01-02T01:00:00Z")
        val t29h = Instant.parse("2026-01-02T05:00:00Z")
        val items = listOf(
            CorrectiveCompletionProjection(equipmentId, t0, t2h),
            CorrectiveCompletionProjection(equipmentId, t10h, t13h),
            CorrectiveCompletionProjection(equipmentId, t25h, t29h)
        )

        val mttr = service.calculateMttrHours(items)
        val mtbf = service.calculateMtbfHours(items)

        assertEquals(3.0, mttr)
        assertEquals(13.5, mtbf)
    }

    @Test
    fun `returns null mtbf for single completion`() {
        val equipmentId = UUID.randomUUID()
        val item = CorrectiveCompletionProjection(
            equipmentId = equipmentId,
            startedAt = Instant.parse("2026-01-01T00:00:00Z"),
            completedAt = Instant.parse("2026-01-01T01:00:00Z")
        )

        assertNull(service.calculateMtbfHours(listOf(item)))
    }
}
