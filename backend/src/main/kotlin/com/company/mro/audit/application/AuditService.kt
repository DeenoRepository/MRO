package com.company.mro.audit.application

interface AuditService {
    fun log(action: String, module: String, entityType: String, entityId: String)
}

