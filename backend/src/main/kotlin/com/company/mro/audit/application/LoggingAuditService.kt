package com.company.mro.audit.application

import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class LoggingAuditService : AuditService {
    private val logger = LoggerFactory.getLogger(LoggingAuditService::class.java)

    override fun log(action: String, module: String, entityType: String, entityId: String) {
        logger.info(
            "audit action={} module={} entityType={} entityId={}",
            action,
            module,
            entityType,
            entityId
        )
    }
}

