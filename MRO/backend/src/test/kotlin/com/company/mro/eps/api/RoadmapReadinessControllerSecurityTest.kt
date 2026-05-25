package com.company.mro.eps.api

import com.company.mro.eps.application.RoadmapReadinessService
import com.company.mro.eps.dto.RoadmapPhaseCoverage
import com.company.mro.eps.dto.RoadmapReadinessResponse
import org.junit.jupiter.api.Test
import org.mockito.Mockito.`when`
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.context.annotation.Import
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@WebMvcTest(controllers = [RoadmapReadinessController::class])
@Import(com.company.mro.core.config.SecurityConfig::class)
class RoadmapReadinessControllerSecurityTest {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @MockBean
    private lateinit var roadmapReadinessService: RoadmapReadinessService

    @Test
    fun `viewer can read roadmap readiness`() {
        `when`(roadmapReadinessService.getReadiness()).thenReturn(
            RoadmapReadinessResponse(
                implementedCapabilities = mapOf("advanced_categories" to true),
                phaseCoverage = listOf(RoadmapPhaseCoverage("Phase 1", 1, 4)),
                totalImplemented = 1,
                totalPlanned = 1
            )
        )

        mockMvc.perform(
            get("/api/v1/eps/roadmap/readiness")
                .with(httpBasic("viewer", "viewer"))
        ).andExpect(status().isOk)
    }
}
