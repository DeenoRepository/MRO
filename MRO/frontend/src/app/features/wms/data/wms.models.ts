export interface Warehouse {
  id: string;
  code: string;
  name: string;
  type: string;
  custodianId?: string | null;
  location?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateWarehouseRequest {
  code: string;
  name: string;
  type: string;
  custodianId?: string;
  location?: string;
  description?: string;
}

export interface UpdateWarehouseRequest {
  name: string;
  type: string;
  custodianId?: string;
  location?: string;
  description?: string;
  isActive: boolean;
}

export interface Part {
  id: string;
  partNumber: string;
  name: string;
  description?: string | null;
  unit: string;
  manufacturer?: string | null;
  model?: string | null;
  minStockLevel: number;
  isActive: boolean;
  metadata?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePartRequest {
  partNumber: string;
  name: string;
  description?: string;
  unit?: string;
  manufacturer?: string;
  model?: string;
  minStockLevel?: number;
  metadata?: string;
}

export interface UpdatePartRequest {
  name: string;
  description?: string;
  unit?: string;
  manufacturer?: string;
  model?: string;
  minStockLevel?: number;
  metadata?: string;
  isActive: boolean;
}

export interface StockLevel {
  id: string;
  warehouseId: string;
  warehouseCode: string;
  partId: string;
  partNumber: string;
  partName: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  minStockLevel: number;
  belowMinimum: boolean;
}

export interface StockMovement {
  id: string;
  warehouseId: string;
  partId: string;
  movementType: string; // RECEIPT, ISSUE, ADJUSTMENT_IN, ADJUSTMENT_OUT, CONSUMPTION, TRANSFER_IN, TRANSFER_OUT
  quantity: number;
  referenceType?: string | null;
  referenceId?: string | null;
  reason?: string | null;
  createdAt: string;
}

export interface CreateStockMovementRequest {
  warehouseId: string;
  partId: string;
  movementType: string;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  reason?: string;
}

export interface Reservation {
  id: string;
  warehouseId: string;
  partId: string;
  quantity: number;
  status: 'RESERVED' | 'RELEASED' | 'CONSUMED';
  referenceType?: string | null;
  referenceId?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservationRequest {
  warehouseId: string;
  partId: string;
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  expiresAt?: string;
}

export interface WarehouseTransfer {
  id: string;
  sourceWarehouseId: string;
  targetWarehouseId: string;
  partId: string;
  quantity: number;
  status: 'DRAFT' | 'REQUESTED' | 'APPROVED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  requestedBy?: string | null;
  approvedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehouseTransferRequest {
  sourceWarehouseId: string;
  targetWarehouseId: string;
  partId: string;
  quantity: number;
}
