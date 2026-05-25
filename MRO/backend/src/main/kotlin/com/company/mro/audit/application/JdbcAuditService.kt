package com.company.mro.audit.application

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Service
import java.net.InetAddress
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.sql.Timestamp
import java.time.Instant
import java.util.UUID
import org.slf4j.LoggerFactory

@Service
class JdbcAuditService(
    private val jdbcTemplate: JdbcTemplate
) : AuditService {
    private val logger = LoggerFactory.getLogger(JdbcAuditService::class.java)

    override fun log(action: String, module: String, entityType: String, entityId: String) {
        val parsedEntityId = runCatching { UUID.fromString(entityId) }.getOrNull()
        val requestId = CurrentRequestContext.requestId()?.let { runCatching { UUID.fromString(it) }.getOrNull() }
        val userAgent = CurrentRequestContext.userAgent()
        val ipAddress = CurrentRequestContext.remoteAddress()?.let { sanitizeIp(it) }
        val timestamp = Instant.now()
        val previousHash = jdbcTemplate.query(
            "SELECT signature FROM audit.log ORDER BY id DESC LIMIT 1"
        ) { rs, _ -> rs.getString("signature") }.firstOrNull()
        val signature = sha256(
            listOf(
                previousHash ?: "",
                timestamp.toString(),
                action,
                module,
                entityType,
                entityId,
                requestId?.toString() ?: "",
                ipAddress ?: "",
                userAgent ?: ""
            ).joinToString("|")
        )

        jdbcTemplate.update(
            """
            INSERT INTO audit.log (
                timestamp, user_id, action, module, entity_type, entity_id, old_values, new_values,
                ip_address, user_agent, request_id, previous_hash, signature
            ) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?::inet, ?, ?, ?, ?)
            """.trimIndent(),
            Timestamp.from(timestamp),
            null,
            action,
            module,
            entityType,
            parsedEntityId,
            ipAddress,
            userAgent,
            requestId,
            previousHash,
            signature
        )
        logger.info(
            "audit_write module={} action={} entity_type={} entity_id={} request_id={}",
            module,
            action,
            entityType,
            entityId,
            requestId
        )
    }

    private fun sanitizeIp(raw: String): String? {
        return runCatching {
            InetAddress.getByName(raw).hostAddress
        }.getOrNull()
    }

    private fun sha256(value: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val hash = digest.digest(value.toByteArray(StandardCharsets.UTF_8))
        return hash.joinToString("") { "%02x".format(it) }
    }
}
