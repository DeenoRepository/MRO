export interface WorkOrder {
  id: string;
  woNumber: string;
  equipmentId: string;
  type: 'PREVENTIVE' | 'CORRECTIVE' | 'EMERGENCY' | 'INSPECTION';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'PLANNED' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING_PARTS' | 'COMPLETED' | 'CANCELLED';
  scheduledDate?: string | null;
  startedAt?: string | null;
  completedDate?: string | null;
  technicianId?: string | null;
  title: string;
  description?: string | null;
  completionAct?: string | null;
  signatureHash?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkOrderRequest {
  woNumber: string;
  equipmentId: string;
  type: string;
  priority?: string;
  scheduledDate?: string;
  title: string;
  description?: string;
}

export interface AssignWorkOrderRequest {
  technicianId: string;
}

export interface CompleteWorkOrderRequest {
  completionAct: string;
  completionNotes?: string;
}

export interface WorkOrderTask {
  id: string;
  workOrderId: string;
  title: string;
  description?: string | null;
  status: 'OPEN' | 'COMPLETED';
  sortOrder: number;
  completedAt?: string | null;
  completedBy?: string | null;
  createdAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  sortOrder?: number;
}

export interface MaintenanceHistory {
  id: string;
  workOrderId: string;
  equipmentId: string;
  eventType: string;
  eventData?: string | null;
  createdAt: string;
  createdBy?: string | null;
}

export interface PmSchedule {
  id: string;
  equipmentId: string;
  name: string;
  description?: string | null;
  frequencyType: 'DAYS' | 'WEEKS' | 'MONTHS';
  frequencyValue: number;
  nextDueDate: string;
  lastGeneratedDate?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePmScheduleRequest {
  equipmentId: string;
  name: string;
  description?: string;
  frequencyType: string;
  frequencyValue: number;
  nextDueDate: string;
}

export interface UpdatePmScheduleRequest {
  name: string;
  description?: string;
  frequencyType: string;
  frequencyValue: number;
  nextDueDate: string;
  isActive: boolean;
}
