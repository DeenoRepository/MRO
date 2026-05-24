package com.company.mro.eps.application

import com.company.mro.audit.application.AuditService
import com.company.mro.eps.persistence.EquipmentDocumentEntity
import com.company.mro.eps.persistence.EquipmentDocumentRepository
import com.company.mro.eps.persistence.EquipmentRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.ArgumentMatchers.any
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import java.nio.file.Files
import java.time.Instant
import java.util.UUID
import org.springframework.http.HttpStatus
import org.springframework.web.server.ResponseStatusException
import org.mockito.Mockito.`when` as whenever

@ExtendWith(MockitoExtension::class)
class EquipmentDocumentServiceTest {
    @Mock
    private lateinit var equipmentRepository: EquipmentRepository

    @Mock
    private lateinit var documentRepository: EquipmentDocumentRepository

    @Mock
    private lateinit var auditService: AuditService

    private lateinit var service: EquipmentDocumentService

    @BeforeEach
    fun setUp() {
        val tempDir = Files.createTempDirectory("eps-doc-test").toAbsolutePath().toString()
        service = EquipmentDocumentService(
            equipmentRepository = equipmentRepository,
            documentRepository = documentRepository,
            auditService = auditService,
            storageDir = tempDir
        )
    }

    @Test
    fun `upload increments version within same type and file name`() {
        val equipmentId = UUID.randomUUID()
        whenever(equipmentRepository.existsById(equipmentId)).thenReturn(true)
        whenever(
            documentRepository.findByEquipmentIdAndDocumentTypeIgnoreCaseAndFileNameOrderByVersionDesc(
                equipmentId,
                "MANUAL",
                "pump.pdf"
            )
        ).thenReturn(
            listOf(
                EquipmentDocumentEntity(
                    id = UUID.randomUUID(),
                    equipmentId = equipmentId,
                    documentType = "MANUAL",
                    fileName = "pump.pdf",
                    filePath = "x",
                    version = 2,
                    checksumSha256 = "a".repeat(64),
                    uploadedAt = Instant.now()
                )
            )
        )
        whenever(documentRepository.save(any(EquipmentDocumentEntity::class.java)))
            .thenAnswer { it.arguments[0] as EquipmentDocumentEntity }

        val response = service.uploadDocument(
            equipmentId = equipmentId,
            documentType = "MANUAL",
            fileName = "pump.pdf",
            fileBytes = "v3".toByteArray(),
            extractedText = "pump manual content"
        )

        assertEquals(3, response.version)
    }

    @Test
    fun `search rejects too short query`() {
        val ex = assertThrows(ResponseStatusException::class.java) {
            service.searchDocuments("a", null)
        }
        assertEquals(HttpStatus.BAD_REQUEST, ex.statusCode)
    }
}
