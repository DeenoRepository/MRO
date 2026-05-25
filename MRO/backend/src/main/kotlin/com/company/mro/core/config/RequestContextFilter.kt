package com.company.mro.core.config

import com.company.mro.audit.application.CurrentRequestContext
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.MDC
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.util.UUID

@Component("mroRequestContextFilter")
class RequestContextFilter : OncePerRequestFilter() {
    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val requestId = request.getHeader("X-Request-Id") ?: UUID.randomUUID().toString()
        val userAgent = request.getHeader("User-Agent")
        val remoteAddress = request.remoteAddr

        response.setHeader("X-Request-Id", requestId)
        request.setAttribute("requestId", requestId)
        MDC.put("request_id", requestId)
        CurrentRequestContext.set(requestId, userAgent, remoteAddress)

        try {
            filterChain.doFilter(request, response)
        } finally {
            CurrentRequestContext.clear()
            MDC.remove("request_id")
        }
    }
}
