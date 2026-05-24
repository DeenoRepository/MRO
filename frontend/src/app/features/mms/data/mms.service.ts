import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiSuccessResponse } from '../../../core/api/api.models';
import { ApiClientService } from '../../../core/api/api-client.service';
import {
  AssignWorkOrderRequest,
  CreatePmScheduleRequest,
  CreateWorkOrderRequest,
  PmSchedule,
  UpdatePmScheduleRequest,
  WorkOrder
} from './mms.models';

@Injectable({ providedIn: 'root' })
export class MmsService {
  constructor(private readonly api: ApiClientService) {}

  getWorkOrders(): Observable<ApiSuccessResponse<WorkOrder[]>> {
    return this.api.get<WorkOrder[]>('/mms/work-orders');
  }

  getWorkOrderById(id: string): Observable<ApiSuccessResponse<WorkOrder>> {
    return this.api.get<WorkOrder>(`/mms/work-orders/${id}`);
  }

  createWorkOrder(payload: CreateWorkOrderRequest): Observable<ApiSuccessResponse<WorkOrder>> {
    return this.api.post<CreateWorkOrderRequest, WorkOrder>('/mms/work-orders', payload);
  }

  assignWorkOrder(id: string, payload: AssignWorkOrderRequest): Observable<ApiSuccessResponse<WorkOrder>> {
    return this.api.post<AssignWorkOrderRequest, WorkOrder>(`/mms/work-orders/${id}/assign`, payload);
  }

  completeWorkOrder(id: string): Observable<ApiSuccessResponse<WorkOrder>> {
    return this.api.post<Record<string, never>, WorkOrder>(`/mms/work-orders/${id}/complete`, {});
  }

  cancelWorkOrder(id: string): Observable<ApiSuccessResponse<WorkOrder>> {
    return this.api.post<Record<string, never>, WorkOrder>(`/mms/work-orders/${id}/cancel`, {});
  }

  getPmSchedules(): Observable<ApiSuccessResponse<PmSchedule[]>> {
    return this.api.get<PmSchedule[]>('/mms/pm-schedules');
  }

  createPmSchedule(payload: CreatePmScheduleRequest): Observable<ApiSuccessResponse<PmSchedule>> {
    return this.api.post<CreatePmScheduleRequest, PmSchedule>('/mms/pm-schedules', payload);
  }

  updatePmSchedule(id: string, payload: UpdatePmScheduleRequest): Observable<ApiSuccessResponse<PmSchedule>> {
    return this.api.put<UpdatePmScheduleRequest, PmSchedule>(`/mms/pm-schedules/${id}`, payload);
  }
}

