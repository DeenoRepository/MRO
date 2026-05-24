import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiSuccessResponse } from '../../../core/api/api.models';
import { ApiClientService } from '../../../core/api/api-client.service';
import { CreateEquipmentRequest, Equipment, UpdateEquipmentRequest, EquipmentDocument, ChangeRequest, CreateChangeRequest, DecideChangeRequest } from './eps.models';

@Injectable({ providedIn: 'root' })
export class EpsService {
  constructor(private readonly api: ApiClientService) {}

  getEquipment(): Observable<ApiSuccessResponse<Equipment[]>> {
    return this.api.get<Equipment[]>('/eps/equipment');
  }

  getEquipmentById(id: string): Observable<ApiSuccessResponse<Equipment>> {
    return this.api.get<Equipment>(`/eps/equipment/${id}`);
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

  getChangeRequests(): Observable<ApiSuccessResponse<ChangeRequest[]>> {
    return this.api.get<ChangeRequest[]>('/eps/change-requests');
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
