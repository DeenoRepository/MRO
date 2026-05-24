import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiSuccessResponse } from '../../../core/api/api.models';
import { ApiClientService } from '../../../core/api/api-client.service';
import {
  CreatePartRequest,
  CreateReservationRequest,
  CreateStockMovementRequest,
  CreateWarehouseRequest,
  Part,
  Reservation,
  StockMovement,
  Warehouse
} from './wms.models';

@Injectable({ providedIn: 'root' })
export class WmsService {
  constructor(private readonly api: ApiClientService) {}

  getWarehouses(): Observable<ApiSuccessResponse<Warehouse[]>> {
    return this.api.get<Warehouse[]>('/wms/warehouses');
  }

  createWarehouse(payload: CreateWarehouseRequest): Observable<ApiSuccessResponse<Warehouse>> {
    return this.api.post<CreateWarehouseRequest, Warehouse>('/wms/warehouses', payload);
  }

  getParts(): Observable<ApiSuccessResponse<Part[]>> {
    return this.api.get<Part[]>('/wms/parts');
  }

  createPart(payload: CreatePartRequest): Observable<ApiSuccessResponse<Part>> {
    return this.api.post<CreatePartRequest, Part>('/wms/parts', payload);
  }

  createStockMovement(payload: CreateStockMovementRequest): Observable<ApiSuccessResponse<StockMovement>> {
    return this.api.post<CreateStockMovementRequest, StockMovement>('/wms/stock-movements', payload);
  }

  createReservation(payload: CreateReservationRequest): Observable<ApiSuccessResponse<Reservation>> {
    return this.api.post<CreateReservationRequest, Reservation>('/wms/reservations', payload);
  }

  releaseReservation(id: string): Observable<ApiSuccessResponse<Reservation>> {
    return this.api.post<Record<string, never>, Reservation>(`/wms/reservations/${id}/release`, {});
  }

  consumeReservation(id: string): Observable<ApiSuccessResponse<Reservation>> {
    return this.api.post<Record<string, never>, Reservation>(`/wms/reservations/${id}/consume`, {});
  }
}

