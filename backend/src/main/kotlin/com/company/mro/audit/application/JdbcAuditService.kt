package com.company.mro.audit.application

import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.stereotype.Service
import java.net.InetAddress
import java.util.UUID

@Service
class JdbcAuditService(
    private val jdbcTemplate: JdbcTemplate
) : AuditService {
    override fun log(action: String, module: String, entityType: String, entityId: String) {
        val parsedEntityId = runCatching { UUID.fromString(entityId) }.getOrNull()
        val requestId = CurrentRequestContext.requestId()?.let { runCatching { UUID.fromString(it) }.getOrNull() }
        val userAgent = CurrentRequestContext.userAgent()
        val ipAddress = CurrentRequestContext.remoteAddress()?.let { sanitizeIp(it) }
        val signature = UUID.randomUUID().toString().replace("-", "").take(64)

        jdbcTemplate.update(
            """
            INSERT INTO audit.log (
                user_id, action, module, entity_type, entity_id, old_values, new_values,
                ip_address, user_agent, request_id, previous_hash, signature
            ) VALUES (?, ?, ?, ?, ?, NULL, NULL, ?::inet, ?, ?, NULL, ?)
            """.trimIndent(),
            null,
            action,
            module,
            entityType,
            parsedEntityId,
            ipAddress,
            userAgent,
            requestId,
            signature
        )
    }

    private fun sanitizeIp(raw: String): String? {
        return runCatching {
            InetAddress.getByName(raw).hostAddress
        }.getOrNull()
    }
}

