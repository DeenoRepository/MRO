package com.company.mro.core.api

import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.validation.FieldError
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.server.ResponseStatusException
import java.time.Instant

@RestControllerAdvice
class GlobalExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationError(
        ex: MethodArgumentNotValidException,
        request: HttpServletRequest
    ): ResponseEntity<ApiErrorResponse> {
        val firstError = ex.bindingResult.allErrors.firstOrNull()
        val message = when (firstError) {
            is FieldError -> "${firstError.field}: ${firstError.defaultMessage}"
            null -> "Validation failed"
            else -> firstError.defaultMessage ?: "Validation failed"
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            errorResponse(
                status = HttpStatus.BAD_REQUEST,
                message = message,
                request = request
            )
        )
    }

    @ExceptionHandler(ResponseStatusException::class)
    fun handleResponseStatus(
        ex: ResponseStatusException,
        request: HttpServletRequest
    ): ResponseEntity<ApiErrorResponse> {
        val status = HttpStatus.valueOf(ex.statusCode.value())
        return ResponseEntity.status(status).body(
            errorResponse(
                status = status,
                message = ex.reason ?: status.reasonPhrase,
                request = request
            )
        )
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException::class, org.springframework.security.authorization.AuthorizationDeniedException::class)
    fun handleAccessDenied(
        request: HttpServletRequest
    ): ResponseEntity<ApiErrorResponse> {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
            errorResponse(
                status = HttpStatus.FORBIDDEN,
                message = "Access denied",
                request = request
            )
        )
    }

    @ExceptionHandler(Exception::class)
    fun handleGenericError(
        request: HttpServletRequest
    ): ResponseEntity<ApiErrorResponse> {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
            errorResponse(
                status = HttpStatus.INTERNAL_SERVER_ERROR,
                message = "Unexpected internal error",
                request = request
            )
        )
    }

    private fun errorResponse(
        status: HttpStatus,
        message: String,
        request: HttpServletRequest
    ): ApiErrorResponse = ApiErrorResponse(
        timestamp = Instant.now(),
        status = status.value(),
        error = status.reasonPhrase,
        message = message,
        path = request.requestURI,
        requestId = request.getAttribute("requestId") as? String ?: request.getHeader("X-Request-Id")
    )
}
