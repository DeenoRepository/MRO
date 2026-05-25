import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiSuccessResponse } from '../../../core/api/api.models';
import { ApiClientService } from '../../../core/api/api-client.service';
import {
  WorkOrder, CreateWorkOrderRequest, AssignWorkOrderRequest, CompleteWorkOrderRequest,
  WorkOrderTask, CreateTaskRequest, MaintenanceHistory,
  PmSchedule, CreatePmScheduleRequest, UpdatePmScheduleRequest
} from './mms.models';

@Injectable({ providedIn: 'root' })
export class MmsService {
  constructor(private readonly api: ApiClientService) {}

  // Work Orders
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

  startWorkOrder(id: string): Observable<ApiSuccessResponse<WorkOrder>> {
    return this.api.post<null, WorkOrder>(`/mms/work-orders/${id}/start`, null);
  }

  completeWorkOrder(id: string, payload: CompleteWorkOrderRequest): Observable<ApiSuccessResponse<WorkOrder>> {
    return this.api.post<CompleteWorkOrderRequest, WorkOrder>(`/mms/work-orders/${id}/complete`, payload);
  }

  cancelWorkOrder(id: string): Observable<ApiSuccessResponse<WorkOrder>> {
    return this.api.post<null, WorkOrder>(`/mms/work-orders/${id}/cancel`, null);
  }

  // Work Order Tasks
  getTasks(workOrderId: string): Observable<ApiSuccessResponse<WorkOrderTask[]>> {
    return this.api.get<WorkOrderTask[]>(`/mms/work-orders/${workOrderId}/tasks`);
  }

  addTask(workOrderId: string, payload: CreateTaskRequest): Observable<ApiSuccessResponse<WorkOrderTask>> {
    return this.api.post<CreateTaskRequest, WorkOrderTask>(`/mms/work-orders/${workOrderId}/tasks`, payload);
  }

  completeTask(taskId: string): Observable<ApiSuccessResponse<WorkOrderTask>> {
    return this.api.post<null, WorkOrderTask>(`/mms/work-orders/tasks/${taskId}/complete`, null);
  }

  // Maintenance History
  getHistory(workOrderId: string): Observable<ApiSuccessResponse<MaintenanceHistory[]>> {
    return this.api.get<MaintenanceHistory[]>(`/mms/work-orders/${workOrderId}/history`);
  }

  // PM Schedules
  getPmSchedules(): Observable<ApiSuccessResponse<PmSchedule[]>> {
    return this.api.get<PmSchedule[]>('/mms/pm-schedules');
  }

  createPmSchedule(payload: CreatePmScheduleRequest): Observable<ApiSuccessResponse<PmSchedule>> {
    return this.api.post<CreatePmScheduleRequest, PmSchedule>('/mms/pm-schedules', payload);
  }

  updatePmSchedule(id: string, payload: UpdatePmScheduleRequest): Observable<ApiSuccessResponse<PmSchedule>> {
    return this.api.put<UpdatePmScheduleRequest, PmSchedule>(`/mms/pm-schedules/${id}`, payload);
  }

  generateDuePmWorkOrders(): Observable<ApiSuccessResponse<number>> {
    return this.api.post<null, number>('/mms/pm-schedules/generate-due', null);
  }
}
