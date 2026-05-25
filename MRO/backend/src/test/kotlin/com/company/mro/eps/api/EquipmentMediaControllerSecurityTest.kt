package com.company.mro.eps.api

import com.company.mro.eps.application.EquipmentMediaService
import com.company.mro.eps.domain.EquipmentMediaType
import com.company.mro.eps.dto.EquipmentMediaResponse
import org.junit.jupiter.api.Test
import org.mockito.ArgumentMatchers.any
import org.mockito.Mockito.`when`
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.context.annotation.Import
import org.springframework.http.MediaType
import org.springframework.mock.web.MockMultipartFile
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.time.Instant
import java.util.UUID

@WebMvcTest(controllers = [EquipmentMediaController::class])
@Import(com.company.mro.core.config.SecurityConfig::class)
class EquipmentMediaControllerSecurityTest {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @MockBean
    private lateinit var mediaService: EquipmentMediaService

    @Test
    fun `viewer cannot upload media`() {
        val id = UUID.randomUUID()
        val file = MockMultipartFile("file", "photo.jpg", MediaType.IMAGE_JPEG_VALUE, "img".toByteArray())

        mockMvc.perform(
            multipart("/api/v1/eps/equipment/$id/media")
                .file(file)
                .param("mediaType", "PHOTO")
                .with(httpBasic("viewer", "viewer"))
        ).andExpect(status().isForbidden)
    }

    @Test
    fun `admin can upload media`() {
        val id = UUID.randomUUID()
        val file = MockMultipartFile("file", "photo.jpg", MediaType.IMAGE_JPEG_VALUE, "img".toByteArray())
        `when`(mediaService.uploadMedia(any(), any(), any(), any(), any(), any())).thenReturn(
            EquipmentMediaResponse(
                id = UUID.randomUUID(),
                equipmentId = id,
                mediaType = EquipmentMediaType.PHOTO,
                fileName = "photo.jpg",
                filePath = "/tmp/photo.jpg",
                mimeType = MediaType.IMAGE_JPEG_VALUE,
                fileSize = 3,
                checksumSha256 = "a".repeat(64),
                annotation = "front",
                uploadedAt = Instant.now(),
                uploadedBy = null
            )
        )

        mockMvc.perform(
            multipart("/api/v1/eps/equipment/$id/media")
                .file(file)
                .param("mediaType", "PHOTO")
                .param("annotation", "front")
                .with(httpBasic("admin", "admin"))
        ).andExpect(status().isCreated)
    }
}
