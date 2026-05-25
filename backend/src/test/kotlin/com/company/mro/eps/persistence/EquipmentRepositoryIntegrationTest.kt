package com.company.mro.eps.persistence

import com.company.mro.eps.domain.EquipmentStatus
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.testcontainers.containers.PostgreSQLContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import java.time.Instant
import java.util.UUID

@Testcontainers
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class EquipmentRepositoryIntegrationTest {
    companion object {
        @Container
        @JvmStatic
        private val postgres = PostgreSQLContainer("postgres:16-alpine")
            .withDatabaseName("mro_test")
            .withUsername("mro")
            .withPassword("mro")

        @JvmStatic
        @DynamicPropertySource
        fun registerDataSourceProperties(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl)
            registry.add("spring.datasource.username", postgres::getUsername)
            registry.add("spring.datasource.password", postgres::getPassword)
            registry.add("spring.datasource.driver-class-name") { "org.postgresql.Driver" }
            registry.add("spring.jpa.hibernate.ddl-auto") { "none" }
            registry.add("spring.flyway.enabled") { true }
        }
    }

    @Autowired
    private lateinit var equipmentRepository: EquipmentRepository

    @BeforeEach
    fun clearData() {
        equipmentRepository.deleteAll()
    }

    @Test
    fun `findRegistryPage applies status category and query filters`() {
        equipmentRepository.saveAll(
            listOf(
                equipment("EQ-100", "Main Pump", "PUMP", EquipmentStatus.ACTIVE, "A1"),
                equipment("EQ-101", "Aux Pump", "PUMP", EquipmentStatus.MAINTENANCE, "A1"),
                equipment("EQ-200", "Main Compressor", "COMPRESSOR", EquipmentStatus.ACTIVE, "B1")
            )
        )

        val page = equipmentRepository.findRegistryPage(
            status = EquipmentStatus.ACTIVE,
            category = "PUMP",
            query = "main",
            pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.ASC, "assetTag"))
        )

        assertEquals(1, page.totalElements)
        assertEquals("EQ-100", page.content.first().assetTag)
    }

    @Test
    fun `findRegistryPage respects sort and pagination`() {
        equipmentRepository.saveAll(
            listOf(
                equipment("EQ-300", "Zulu Pump", "PUMP", EquipmentStatus.ACTIVE, "A1"),
                equipment("EQ-301", "Alpha Pump", "PUMP", EquipmentStatus.ACTIVE, "A1"),
                equipment("EQ-302", "Bravo Pump", "PUMP", EquipmentStatus.ACTIVE, "A1")
            )
        )

        val page = equipmentRepository.findRegistryPage(
            status = EquipmentStatus.ACTIVE,
            category = "PUMP",
            query = "pump",
            pageable = PageRequest.of(1, 1, Sort.by(Sort.Direction.ASC, "name"))
        )

        assertEquals(3, page.totalElements)
        assertEquals(3, page.totalPages)
        assertEquals(1, page.number)
        assertEquals("Bravo Pump", page.content.first().name)
    }

    private fun equipment(
        assetTag: String,
        name: String,
        category: String,
        status: EquipmentStatus,
        location: String
    ): EquipmentEntity = EquipmentEntity(
        id = UUID.randomUUID(),
        assetTag = assetTag,
        name = name,
        category = category,
        status = status,
        location = location,
        createdAt = Instant.now(),
        updatedAt = Instant.now()
    )
}
