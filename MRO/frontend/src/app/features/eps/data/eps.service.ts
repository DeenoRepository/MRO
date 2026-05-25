import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { ApiSuccessResponse } from '../../../core/api/api.models';
import { ApiClientService } from '../../../core/api/api-client.service';
import { CreateEquipmentCategoryRequest, CreateEquipmentRequest, Equipment, EquipmentCategory, UpdateEquipmentCategoryRequest, UpdateEquipmentRequest, EquipmentDocument, ChangeRequest, CreateChangeRequest, DecideChangeRequest, TelemetryPoint, TelemetryMetricType, EquipmentMediaItem, EquipmentMediaType, EquipmentRegistryPageResponse } from './eps.models';

@Injectable({ providedIn: 'root' })
export class EpsService {
  private changeRequests$?: Observable<ApiSuccessResponse<ChangeRequest[]>>;

  constructor(
    private readonly api: ApiClientService,
    private readonly http: HttpClient
  ) {}

  getEquipment(): Observable<ApiSuccessResponse<Equipment[]>> {
    return this.api.get<Equipment[]>('/eps/equipment');
  }

  getEquipmentRegistryPage(params: {
    status?: string;
    category?: string;
    query?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }): Observable<ApiSuccessResponse<EquipmentRegistryPageResponse>> {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'ALL') query.set('status', params.status);
    if (params.category && params.category !== 'ALL') query.set('category', params.category);
    if (params.query && params.query.trim().length > 0) query.set('query', params.query.trim());
    query.set('page', String(params.page ?? 0));
    query.set('size', String(params.size ?? 20));
    query.set('sortBy', params.sortBy ?? 'assetTag');
    query.set('sortDirection', params.sortDirection ?? 'asc');
    return this.api.get<EquipmentRegistryPageResponse>(`/eps/equipment/registry?${query.toString()}`);
  }

  getEquipmentById(id: string): Observable<ApiSuccessResponse<Equipment>> {
    return this.api.get<Equipment>(`/eps/equipment/${id}`);
  }

  getCategories(): Observable<ApiSuccessResponse<EquipmentCategory[]>> {
    return this.api.get<EquipmentCategory[]>('/eps/categories');
  }

  createCategory(payload: CreateEquipmentCategoryRequest): Observable<ApiSuccessResponse<EquipmentCategory>> {
    return this.api.post<CreateEquipmentCategoryRequest, EquipmentCategory>('/eps/categories', payload);
  }

  updateCategory(id: string, payload: UpdateEquipmentCategoryRequest): Observable<ApiSuccessResponse<EquipmentCategory>> {
    return this.api.put<UpdateEquipmentCategoryRequest, EquipmentCategory>(`/eps/categories/${id}`, payload);
  }

  createEquipment(payload: CreateEquipmentRequest): Observable<ApiSuccessResponse<Equipment>> {
    return this.api.post<CreateEquipmentRequest, Equipment>('/eps/equipment', payload);
  }

  updateEquipment(id: string, payload: UpdateEquipmentRequest): Observable<ApiSuccessResponse<Equipment>> {
    return this.api.put<UpdateEquipmentRequest, Equipment>(`/eps/equipment/${id}`, payload);
  }

  deactivateEquipment(id: string): Observable<void> {
    return this.api.delete(`/eps/equipment/${id}`);
  }

  getEquipmentDocuments(equipmentId: string): Observable<ApiSuccessResponse<EquipmentDocument[]>> {
    return this.api.get<EquipmentDocument[]>(`/eps/equipment/${equipmentId}/documents`);
  }

  getEquipmentTelemetry(
    equipmentId: string,
    metricType?: TelemetryMetricType
  ): Observable<ApiSuccessResponse<TelemetryPoint[]>> {
    const query = metricType ? `?metricType=${metricType}` : '';
    return this.api.get<TelemetryPoint[]>(`/eps/equipment/${equipmentId}/telemetry${query}`);
  }

  getEquipmentMedia(equipmentId: string): Observable<ApiSuccessResponse<EquipmentMediaItem[]>> {
    return this.api.get<EquipmentMediaItem[]>(`/eps/equipment/${equipmentId}/media`);
  }

  uploadEquipmentMedia(
    equipmentId: string,
    mediaType: EquipmentMediaType,
    file: File,
    annotation?: string
  ): Observable<ApiSuccessResponse<EquipmentMediaItem>> {
    const formData = new FormData();
    formData.append('mediaType', mediaType);
    formData.append('file', file);
    if (annotation && annotation.trim().length > 0) {
      formData.append('annotation', annotation.trim());
    }
    return this.api.post<FormData, EquipmentMediaItem>(`/eps/equipment/${equipmentId}/media`, formData);
  }

  uploadEquipmentDocument(
    equipmentId: string,
    documentType: string,
    file: File,
    extractedText?: string
  ): Observable<ApiSuccessResponse<EquipmentDocument>> {
    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('file', file);
    if (extractedText && extractedText.trim().length > 0) {
      formData.append('extractedText', extractedText.trim());
    }
    return this.api.post<FormData, EquipmentDocument>(`/eps/equipment/${equipmentId}/documents`, formData);
  }

  uploadEquipmentDocumentWithProgress(
    equipmentId: string,
    documentType: string,
    file: File,
    extractedText?: string
  ): Observable<HttpEvent<ApiSuccessResponse<EquipmentDocument>>> {
    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('file', file);
    if (extractedText && extractedText.trim().length > 0) {
      formData.append('extractedText', extractedText.trim());
    }
    return this.http.post<ApiSuccessResponse<EquipmentDocument>>(`/api/v1/eps/equipment/${equipmentId}/documents`, formData, {
      observe: 'events',
      reportProgress: true
    });
  }

  getChangeRequests(): Observable<ApiSuccessResponse<ChangeRequest[]>> {
    return this.api.get<ChangeRequest[]>('/eps/change-requests');
  }

  getChangeRequestsCached(forceRefresh = false): Observable<ApiSuccessResponse<ChangeRequest[]>> {
    if (forceRefresh || !this.changeRequests$) {
      this.changeRequests$ = this.getChangeRequests().pipe(shareReplay(1));
    }
    return this.changeRequests$;
  }

  invalidateChangeRequestsCache(): void {
    this.changeRequests$ = undefined;
  }

  createChangeRequest(payload: CreateChangeRequest): Observable<ApiSuccessResponse<ChangeRequest>> {
    return this.api.post<CreateChangeRequest, ChangeRequest>('/eps/change-requests', payload);
  }

  approveChangeRequest(id: string, payload: DecideChangeRequest): Observable<ApiSuccessResponse<ChangeRequest>> {
    return this.api.post<DecideChangeRequest, ChangeRequest>(`/eps/change-requests/${id}/approve`, payload);
  }

  rejectChangeRequest(id: string, payload: DecideChangeRequest): Observable<ApiSuccessResponse<ChangeRequest>> {
    return this.api.post<DecideChangeRequest, ChangeRequest>(`/eps/change-requests/${id}/reject`, payload);
  }
}
