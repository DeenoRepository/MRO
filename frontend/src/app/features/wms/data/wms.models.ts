export interface Warehouse {
  id: string;
  code: string;
  name: string;
  type: string;
  custodianId?: string | null;
  location?: string | null;
  isActive: boolean;
}

export interface CreateWarehouseRequest {
  code: string;
  name: string;
  type: string;
  custodianId?: string;
  location?: string;
}

export interface Part {
  id: string;
  partNumber: string;
  name: string;
  description?: string | null;
  unit: string;
  minStockLevel: number;
}

export interface CreatePartRequest {
  partNumber: string;
  name: string;
  description?: string;
  unit?: string;
  minStockLevel?: number;
}

export interface StockMovement {
  id: string;
  warehouseId: string;
  partId: string;
  movementType: string;
  quantity: number;
  referenceType?: string | null;
  referenceId?: string | null;
  createdAt: string;
}

export interface CreateStockMovementRequest {
  warehouseId: string;
  partId: string;
  movementType: string;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
}

export interface Reservation {
  id: string;
  warehouseId: string;
  partId: string;
  quantity: number;
  status: 'RESERVED' | 'RELEASED' | 'CONSUMED';
  referenceType?: string | null;
  referenceId?: string | null;
  createdAt: string;
}

export interface CreateReservationRequest {
  warehouseId: string;
  partId: string;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
}

