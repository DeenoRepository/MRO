package com.company.mro.core.api

import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

data class CurrentUserResponse(
    val username: String,
    val authorities: List<String>
)

@RestController
@RequestMapping("/api/v1/core")
@Tag(name = "Core")
class CoreSecurityController {
    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user")
    @PreAuthorize("hasAuthority('EPS_READ')")
    fun me(authentication: Authentication): ApiSuccessResponse<CurrentUserResponse> {
        return successResponse(CurrentUserResponse(
            username = authentication.name,
            authorities = authentication.authorities.map { it.authority }.sorted()
        ))
    }
}
