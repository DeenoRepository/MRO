import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiSuccessResponse } from '../../../core/api/api.models';
import { ApiClientService } from '../../../core/api/api-client.service';
import {
  CreatePartRequest,
  UpdatePartRequest,
  CreateReservationRequest,
  CreateStockMovementRequest,
  CreateWarehouseRequest,
  UpdateWarehouseRequest,
  Part,
  Reservation,
  StockLevel,
  StockMovement,
  Warehouse,
  WarehouseTransfer,
  CreateWarehouseTransferRequest
} from './wms.models';

@Injectable({ providedIn: 'root' })
export class WmsService {
  constructor(private readonly api: ApiClientService) {}

  // Warehouses
  getWarehouses(): Observable<ApiSuccessResponse<Warehouse[]>> {
    return this.api.get<Warehouse[]>('/wms/warehouses');
  }

  getWarehouseById(id: string): Observable<ApiSuccessResponse<Warehouse>> {
    return this.api.get<Warehouse>(`/wms/warehouses/${id}`);
  }

  createWarehouse(payload: CreateWarehouseRequest): Observable<ApiSuccessResponse<Warehouse>> {
    return this.api.post<CreateWarehouseRequest, Warehouse>('/wms/warehouses', payload);
  }

  updateWarehouse(id: string, payload: UpdateWarehouseRequest): Observable<ApiSuccessResponse<Warehouse>> {
    return this.api.put<UpdateWarehouseRequest, Warehouse>(`/wms/warehouses/${id}`, payload);
  }

  deactivateWarehouse(id: string): Observable<ApiSuccessResponse<Warehouse>> {
    return this.api.post<Record<string, never>, Warehouse>(`/wms/warehouses/${id}/deactivate`, {});
  }

  assignWarehouseCustodian(id: string, custodianId: string | null): Observable<ApiSuccessResponse<Warehouse>> {
    const url = custodianId ? `/wms/warehouses/${id}/assign-custodian?custodianId=${custodianId}` : `/wms/warehouses/${id}/assign-custodian`;
    return this.api.post<Record<string, never>, Warehouse>(url, {});
  }

  // Parts
  getParts(): Observable<ApiSuccessResponse<Part[]>> {
    return this.api.get<Part[]>('/wms/parts');
  }

  getPartById(id: string): Observable<ApiSuccessResponse<Part>> {
    return this.api.get<Part>(`/wms/parts/${id}`);
  }

  createPart(payload: CreatePartRequest): Observable<ApiSuccessResponse<Part>> {
    return this.api.post<CreatePartRequest, Part>('/wms/parts', payload);
  }

  updatePart(id: string, payload: UpdatePartRequest): Observable<ApiSuccessResponse<Part>> {
    return this.api.put<UpdatePartRequest, Part>(`/wms/parts/${id}`, payload);
  }

  deactivatePart(id: string): Observable<ApiSuccessResponse<Part>> {
    return this.api.post<Record<string, never>, Part>(`/wms/parts/${id}/deactivate`, {});
  }

  // Stock Levels
  getStockLevels(filters?: { warehouseId?: string; partId?: string; belowMinimum?: boolean }): Observable<ApiSuccessResponse<StockLevel[]>> {
    const queryParts: string[] = [];
    if (filters?.warehouseId) {
      queryParts.push(`warehouseId=${filters.warehouseId}`);
    }
    if (filters?.partId) {
      queryParts.push(`partId=${filters.partId}`);
    }
    if (filters?.belowMinimum !== undefined) {
      queryParts.push(`belowMinimum=${filters.belowMinimum}`);
    }
    const queryString = queryParts.length > 0 ? '?' + queryParts.join('&') : '';
    return this.api.get<StockLevel[]>(`/wms/stock-levels${queryString}`);
  }

  getBelowMinimumStockLevels(): Observable<ApiSuccessResponse<StockLevel[]>> {
    return this.api.get<StockLevel[]>('/wms/stock-levels/below-minimum');
  }

  getStockLevel(warehouseId: string, partId: string): Observable<ApiSuccessResponse<StockLevel>> {
    return this.api.get<StockLevel>(`/wms/stock-levels/warehouse/${warehouseId}/part/${partId}`);
  }

  // Stock Movements
  receiveStock(payload: CreateStockMovementRequest): Observable<ApiSuccessResponse<StockMovement>> {
    return this.api.post<CreateStockMovementRequest, StockMovement>('/wms/stock-movements/receipt', payload);
  }

  issueStock(payload: CreateStockMovementRequest): Observable<ApiSuccessResponse<StockMovement>> {
    return this.api.post<CreateStockMovementRequest, StockMovement>('/wms/stock-movements/issue', payload);
  }

  adjustStock(payload: CreateStockMovementRequest): Observable<ApiSuccessResponse<StockMovement>> {
    return this.api.post<CreateStockMovementRequest, StockMovement>('/wms/stock-movements/adjustment', payload);
  }

  getStockMovementsByWarehouse(warehouseId: string): Observable<ApiSuccessResponse<StockMovement[]>> {
    return this.api.get<StockMovement[]>(`/wms/stock-movements/warehouse/${warehouseId}`);
  }

  getStockMovementsByPart(partId: string): Observable<ApiSuccessResponse<StockMovement[]>> {
    return this.api.get<StockMovement[]>(`/wms/stock-movements/part/${partId}`);
  }

  // Reservations
  getReservations(filters?: { warehouseId?: string; partId?: string; status?: string; referenceType?: string; referenceId?: string }): Observable<ApiSuccessResponse<Reservation[]>> {
    const queryParts: string[] = [];
    if (filters?.warehouseId) {
      queryParts.push(`warehouseId=${filters.warehouseId}`);
    }
    if (filters?.partId) {
      queryParts.push(`partId=${filters.partId}`);
    }
    if (filters?.status) {
      queryParts.push(`status=${filters.status}`);
    }
    if (filters?.referenceType) {
      queryParts.push(`referenceType=${filters.referenceType}`);
    }
    if (filters?.referenceId) {
      queryParts.push(`referenceId=${filters.referenceId}`);
    }
    const queryString = queryParts.length > 0 ? '?' + queryParts.join('&') : '';
    return this.api.get<Reservation[]>(`/wms/reservations${queryString}`);
  }

  getReservationById(id: string): Observable<ApiSuccessResponse<Reservation>> {
    return this.api.get<Reservation>(`/wms/reservations/${id}`);
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

  expireReservations(): Observable<ApiSuccessResponse<number>> {
    return this.api.post<Record<string, never>, number>('/wms/reservations/expire', {});
  }

  // Warehouse Transfers
  getTransfers(filters?: { sourceWarehouseId?: string; targetWarehouseId?: string; status?: string }): Observable<ApiSuccessResponse<WarehouseTransfer[]>> {
    const queryParts: string[] = [];
    if (filters?.sourceWarehouseId) {
      queryParts.push(`sourceWarehouseId=${filters.sourceWarehouseId}`);
    }
    if (filters?.targetWarehouseId) {
      queryParts.push(`targetWarehouseId=${filters.targetWarehouseId}`);
    }
    if (filters?.status) {
      queryParts.push(`status=${filters.status}`);
    }
    const queryString = queryParts.length > 0 ? '?' + queryParts.join('&') : '';
    return this.api.get<WarehouseTransfer[]>(`/wms/transfers${queryString}`);
  }

  getTransferById(id: string): Observable<ApiSuccessResponse<WarehouseTransfer>> {
    return this.api.get<WarehouseTransfer>(`/wms/transfers/${id}`);
  }

  createTransfer(payload: CreateWarehouseTransferRequest): Observable<ApiSuccessResponse<WarehouseTransfer>> {
    return this.api.post<CreateWarehouseTransferRequest, WarehouseTransfer>('/wms/transfers', payload);
  }

  submitTransfer(id: string): Observable<ApiSuccessResponse<WarehouseTransfer>> {
    return this.api.post<Record<string, never>, WarehouseTransfer>(`/wms/transfers/${id}/submit`, {});
  }

  approveTransfer(id: string): Observable<ApiSuccessResponse<WarehouseTransfer>> {
    return this.api.post<Record<string, never>, WarehouseTransfer>(`/wms/transfers/${id}/approve`, {});
  }

  startTransfer(id: string): Observable<ApiSuccessResponse<WarehouseTransfer>> {
    return this.api.post<Record<string, never>, WarehouseTransfer>(`/wms/transfers/${id}/start`, {});
  }

  completeTransfer(id: string): Observable<ApiSuccessResponse<WarehouseTransfer>> {
    return this.api.post<Record<string, never>, WarehouseTransfer>(`/wms/transfers/${id}/complete`, {});
  }

  cancelTransfer(id: string): Observable<ApiSuccessResponse<WarehouseTransfer>> {
    return this.api.post<Record<string, never>, WarehouseTransfer>(`/wms/transfers/${id}/cancel`, {});
  }
}
