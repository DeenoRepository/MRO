package com.company.mro.eps.application

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class RoadmapReadinessServiceTest {
    private val service = RoadmapReadinessService()

    @Test
    fun `readiness returns phase coverage and totals`() {
        val response = service.getReadiness()

        assertEquals(19, response.totalPlanned)
        assertTrue(response.totalImplemented >= 1)
        assertEquals(4, response.phaseCoverage.size)
        assertTrue(response.implementedCapabilities.containsKey("advanced_categories"))
    }
}
