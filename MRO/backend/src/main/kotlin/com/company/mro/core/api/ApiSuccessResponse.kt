package com.company.mro.core.api

import com.company.mro.audit.application.CurrentRequestContext

data class ApiSuccessResponse<T>(
    val data: T,
    val meta: ApiMeta = ApiMeta(requestId = CurrentRequestContext.requestId()),
    val errors: List<Any> = emptyList()
)

data class ApiMeta(
    val requestId: String?
)

fun <T> successResponse(data: T): ApiSuccessResponse<T> = ApiSuccessResponse(data = data)

