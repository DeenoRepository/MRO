package com.company.mro.eps.application

import com.company.mro.audit.application.AuditService
import com.company.mro.eps.domain.EquipmentMediaType
import com.company.mro.eps.persistence.EquipmentMediaRepository
import com.company.mro.eps.persistence.EquipmentRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.ArgumentMatchers.any
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.http.HttpStatus
import org.springframework.web.server.ResponseStatusException
import java.nio.file.Files
import java.util.UUID
import org.mockito.Mockito.`when` as whenever

@ExtendWith(MockitoExtension::class)
class EquipmentMediaServiceTest {
    @Mock
    private lateinit var equipmentRepository: EquipmentRepository

    @Mock
    private lateinit var mediaRepository: EquipmentMediaRepository

    @Mock
    private lateinit var auditService: AuditService

    private lateinit var service: EquipmentMediaService

    @BeforeEach
    fun setUp() {
        val tempDir = Files.createTempDirectory("eps-media-test").toAbsolutePath().toString()
        service = EquipmentMediaService(equipmentRepository, mediaRepository, auditService, tempDir)
    }

    @Test
    fun `upload fails when equipment does not exist`() {
        val equipmentId = UUID.randomUUID()
        whenever(equipmentRepository.existsById(equipmentId)).thenReturn(false)

        val ex = assertThrows(ResponseStatusException::class.java) {
            service.uploadMedia(
                equipmentId = equipmentId,
                mediaType = EquipmentMediaType.PHOTO,
                fileName = "photo.jpg",
                mimeType = "image/jpeg",
                fileBytes = "x".toByteArray(),
                annotation = null
            )
        }

        assertEquals(HttpStatus.NOT_FOUND, ex.statusCode)
    }

    @Test
    fun `upload stores photo media metadata`() {
        val equipmentId = UUID.randomUUID()
        whenever(equipmentRepository.existsById(equipmentId)).thenReturn(true)
        whenever(mediaRepository.save(any())).thenAnswer { it.arguments[0] }

        val response = service.uploadMedia(
            equipmentId = equipmentId,
            mediaType = EquipmentMediaType.PHOTO,
            fileName = "photo.jpg",
            mimeType = "image/jpeg",
            fileBytes = "binary".toByteArray(),
            annotation = "front view"
        )

        assertEquals(EquipmentMediaType.PHOTO, response.mediaType)
        assertEquals("front view", response.annotation)
    }
}
