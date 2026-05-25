package com.company.mro.core.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.security.config.Customizer
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.core.userdetails.User
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.security.provisioning.InMemoryUserDetailsManager
import org.springframework.security.web.SecurityFilterChain

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
class SecurityConfig {
    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .csrf { it.disable() }
            .authorizeHttpRequests {
                it.requestMatchers(
                    "/actuator/health",
                    "/v3/api-docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html"
                ).permitAll()
                    .anyRequest().authenticated()
            }
            .httpBasic(Customizer.withDefaults())

        return http.build()
    }

    @Bean
    fun userDetailsService(): UserDetailsService {
        val admin = User.withUsername("admin")
            .password("{noop}admin")
            .authorities(
                "EPS_READ",
                "EPS_WRITE",
                "EPS_APPROVE",
                "EPS_CATEGORY_MANAGE",
                "EPS_COMPLIANCE_MANAGE",
                "EPS_TELEMETRY_WRITE",
                "EPS_MEDIA_UPLOAD",
                "EPS_INTEGRATION_LOG_WRITE",
                "EPS_INTEGRATION_LOG_READ",
                "MMS_READ",
                "MMS_WRITE",
                "MMS_ASSIGN",
                "MMS_START",
                "MMS_COMPLETE",
                "MMS_CANCEL",
                "WMS_READ",
                "WMS_PART_MANAGE",
                "WMS_RESERVE",
                "WMS_CONSUME",
                "WMS_STOCK_RECEIVE",
                "WMS_STOCK_ISSUE",
                "WMS_STOCK_ADJUST",
                "WMS_WAREHOUSE_MANAGE",
                "WMS_TRANSFER_MANAGE",
                "SRS_READ",
                "SRS_WRITE",
                "SRS_ASSIGN",
                "SRS_RESOLVE",
                "AUDIT_READ",
                "ADMIN_MANAGE_USERS",
                "ADMIN_MANAGE_ROLES"
            )
            .build()

        val viewer = User.withUsername("viewer")
            .password("{noop}viewer")
            .authorities("EPS_READ", "MMS_READ", "WMS_READ", "SRS_READ")
            .build()

        return InMemoryUserDetailsManager(admin, viewer)
    }
}
