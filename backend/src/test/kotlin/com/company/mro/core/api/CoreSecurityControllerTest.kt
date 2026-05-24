package com.company.mro.core.api

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status

@SpringBootTest
@AutoConfigureMockMvc
class CoreSecurityControllerTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Test
    fun `me endpoint requires authentication`() {
        mockMvc.perform(get("/api/v1/core/me"))
            .andExpect(status().isUnauthorized)
    }

    @Test
    fun `viewer can access me endpoint`() {
        mockMvc.perform(
            get("/api/v1/core/me")
                .header("Authorization", "Basic dmlld2VyOnZpZXdlcg==")
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.username").value("viewer"))
    }
}
