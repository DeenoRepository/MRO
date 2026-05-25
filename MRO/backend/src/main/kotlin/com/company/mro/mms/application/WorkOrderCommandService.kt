package com.company.mro.mms.application

import java.util.UUID

interface WorkOrderCommandService {
    fun createFromTicket(ticketId: UUID, equipmentId: UUID?, description: String, priority: String): UUID
}

