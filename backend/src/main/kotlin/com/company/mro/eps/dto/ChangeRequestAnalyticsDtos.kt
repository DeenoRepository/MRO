package com.company.mro.eps.dto

data class ChangeRequestAnalyticsResponse(
    val total: Int,
    val pending: Int,
    val approved: Int,
    val rejected: Int,
    val escalationRequired: Int,
    val lowRisk: Int,
    val mediumRisk: Int,
    val highRisk: Int,
    val criticalRisk: Int,
    val averageDecisionLatencyHours: Double?
)
