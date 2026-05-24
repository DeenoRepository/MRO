package com.company.mro

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@SpringBootTest
@AutoConfigureMockMvc
class ModuleSmokeIntegrationTest {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @Test
    fun `eps endpoint responds with envelope`() {
        mockMvc.perform(get("/api/v1/eps/equipment").with(httpBasic("viewer", "viewer")))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data").exists())
            .andExpect(jsonPath("$.meta").exists())
            .andExpect(jsonPath("$.errors").isArray)
    }

    @Test
    fun `mms endpoint responds with envelope`() {
        mockMvc.perform(get("/api/v1/mms/work-orders").with(httpBasic("viewer", "viewer")))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data").exists())
    }

    @Test
    fun `wms endpoint responds with envelope`() {
        mockMvc.perform(get("/api/v1/wms/parts").with(httpBasic("viewer", "viewer")))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data").exists())
    }

    @Test
    fun `srs endpoint responds with envelope`() {
        mockMvc.perform(get("/api/v1/srs/tickets").with(httpBasic("viewer", "viewer")))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data").exists())
    }
}

