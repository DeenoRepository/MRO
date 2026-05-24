package com.company.mro.core.api

import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

data class CurrentUserResponse(
    val username: String,
    val authorities: List<String>
)

@RestController
@RequestMapping("/api/v1/core")
class CoreSecurityController {
    @GetMapping("/me")
    @PreAuthorize("hasAuthority('EPS_READ')")
    fun me(authentication: Authentication): CurrentUserResponse {
        return CurrentUserResponse(
            username = authentication.name,
            authorities = authentication.authorities.map { it.authority }.sorted()
        )
    }
}

