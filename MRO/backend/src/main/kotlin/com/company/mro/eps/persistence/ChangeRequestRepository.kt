package com.company.mro.eps.persistence

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ChangeRequestRepository : JpaRepository<ChangeRequestEntity, UUID>
