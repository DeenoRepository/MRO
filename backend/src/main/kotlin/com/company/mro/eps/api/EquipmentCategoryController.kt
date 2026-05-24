package com.company.mro.eps.api

import com.company.mro.core.api.ApiSuccessResponse
import com.company.mro.core.api.successResponse
import com.company.mro.eps.application.EquipmentCategoryService
import com.company.mro.eps.dto.CreateEquipmentCategoryRequest
import com.company.mro.eps.dto.EquipmentCategoryResponse
import com.company.mro.eps.dto.UpdateEquipmentCategoryRequest
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/eps/categories")
@Tag(name = "EPS Categories")
class EquipmentCategoryController(
    private val categoryService: EquipmentCategoryService
) {
    @GetMapping
    @Operation(summary = "List equipment categories")
    @PreAuthorize("hasAuthority('EPS_READ')")
    fun getAll(): ApiSuccessResponse<List<EquipmentCategoryResponse>> = successResponse(categoryService.getAll())

    @GetMapping("/{id}")
    @Operation(summary = "Get category by id")
    @PreAuthorize("hasAuthority('EPS_READ')")
    fun getById(@PathVariable id: UUID): ApiSuccessResponse<EquipmentCategoryResponse> =
        successResponse(categoryService.getById(id))

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create equipment category")
    @PreAuthorize("hasAuthority('EPS_CATEGORY_MANAGE')")
    fun create(@Valid @RequestBody request: CreateEquipmentCategoryRequest): ApiSuccessResponse<EquipmentCategoryResponse> =
        successResponse(categoryService.create(request))

    @PutMapping("/{id}")
    @Operation(summary = "Update equipment category")
    @PreAuthorize("hasAuthority('EPS_CATEGORY_MANAGE')")
    fun update(
        @PathVariable id: UUID,
        @Valid @RequestBody request: UpdateEquipmentCategoryRequest
    ): ApiSuccessResponse<EquipmentCategoryResponse> = successResponse(categoryService.update(id, request))
}
