export interface WorkOrder {
  id: string;
  woNumber: string;
  equipmentId: string;
  type: string;
  priority: string;
  status: 'OPEN' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';
  scheduledDate?: string | null;
  completedDate?: string | null;
  technicianId?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkOrderRequest {
  woNumber: string;
  equipmentId: string;
  type: string;
  priority?: string;
  scheduledDate?: string;
  description?: string;
}

export interface AssignWorkOrderRequest {
  technicianId: string;
}

export interface PmSchedule {
  id: string;
  equipmentId: string;
  name: string;
  frequency: string;
  nextDueDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePmScheduleRequest {
  equipmentId: string;
  name: string;
  frequency: string;
  nextDueDate: string;
}

export interface UpdatePmScheduleRequest {
  name: string;
  frequency: string;
  nextDueDate: string;
  isActive: boolean;
}

