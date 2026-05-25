package com.company.mro.mms.persistence

import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

import java.time.LocalDate

interface PmScheduleRepository : JpaRepository<PmScheduleEntity, UUID> {
    fun findByIsActiveTrueAndNextDueDateLessThanEqual(date: LocalDate): List<PmScheduleEntity>
}

