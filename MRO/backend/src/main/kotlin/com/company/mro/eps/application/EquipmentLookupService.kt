package com.company.mro.eps.application

import java.util.UUID

interface EquipmentLookupService {
    fun existsById(id: UUID): Boolean
}

