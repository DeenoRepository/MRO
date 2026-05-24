import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiSuccessResponse } from '../../../core/api/api.models';
import { ApiClientService } from '../../../core/api/api-client.service';
import { CreateEquipmentRequest, Equipment, UpdateEquipmentRequest } from './eps.models';

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
}

