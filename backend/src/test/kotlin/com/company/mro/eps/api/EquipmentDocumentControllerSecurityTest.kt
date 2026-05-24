package com.company.mro.eps.api

import com.company.mro.eps.application.EquipmentDocumentService
import com.company.mro.eps.dto.EquipmentDocumentResponse
import org.junit.jupiter.api.Test
import org.mockito.Mockito.`when`
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.context.annotation.Import
import org.springframework.http.MediaType
import org.springframework.mock.web.MockMultipartFile
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.time.Instant
import java.util.UUID

@WebMvcTest(controllers = [EquipmentDocumentController::class])
@Import(com.company.mro.core.config.SecurityConfig::class)
class EquipmentDocumentControllerSecurityTest {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @MockBean
    private lateinit var documentService: EquipmentDocumentService

    @Test
    fun `viewer can list equipment documents`() {
        val eqId = UUID.randomUUID()
        `when`(documentService.getDocumentsByEquipment(eqId)).thenReturn(emptyList())

        mockMvc.perform(
            get("/api/v1/eps/equipment/$eqId/documents")
                .with(httpBasic("viewer", "viewer"))
        ).andExpect(status().isOk)
    }

    @Test
    fun `viewer cannot upload document`() {
        val eqId = UUID.randomUUID()
        val mockFile = MockMultipartFile("file", "test.txt", MediaType.TEXT_PLAIN_VALUE, "test content".toByteArray())

        mockMvc.perform(
            multipart("/api/v1/eps/equipment/$eqId/documents")
                .file(mockFile)
                .param("documentType", "MANUAL")
                .with(httpBasic("viewer", "viewer"))
        ).andExpect(status().isForbidden)
    }

    @Test
    fun `admin can upload document`() {
        val eqId = UUID.randomUUID()
        val mockFile = MockMultipartFile("file", "test.txt", MediaType.TEXT_PLAIN_VALUE, "test content".toByteArray())
        val response = EquipmentDocumentResponse(
            id = UUID.randomUUID(),
            equipmentId = eqId,
            documentType = "MANUAL",
            fileName = "test.txt",
            filePath = "/path/to/test.txt",
            version = 1,
            checksumSha256 = "dummy-checksum",
            uploadedAt = Instant.now(),
            uploadedBy = null
        )

        `when`(documentService.uploadDocument(eqId, "MANUAL", "test.txt", "test content".toByteArray())).thenReturn(response)

        mockMvc.perform(
            multipart("/api/v1/eps/equipment/$eqId/documents")
                .file(mockFile)
                .param("documentType", "MANUAL")
                .with(httpBasic("admin", "admin"))
        ).andExpect(status().isCreated)
    }
}
