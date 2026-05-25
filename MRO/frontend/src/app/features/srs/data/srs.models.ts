export interface Ticket {
  id: string;
  ticketNumber: string;
  requestTypeId?: string | null;
  requesterId?: string | null;
  assigneeId?: string | null;
  equipmentId?: string | null;
  workOrderId?: string | null; // DB compatibility
  linkedWorkOrderId?: string | null; // Clean boundary reference
  title: string;
  description?: string | null;
  priority: string;
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING_EXTERNAL' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';
  openedAt: string;
  assignedAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  dueAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketRequest {
  requestTypeId?: string | null;
  equipmentId?: string | null;
  title: string;
  description?: string | null;
  priority?: string;
  assigneeId?: string | null;
}

export interface UpdateTicketRequest {
  title: string;
  description?: string | null;
  priority?: string;
  assigneeId?: string | null;
  dueAt?: string | null;
}

export interface AssignTicketRequest {
  assigneeId: string;
}

export interface ChangeTicketStatusRequest {
  status: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  commentText: string;
  isInternal: boolean;
  createdBy?: string | null;
  createdAt: string;
}

export interface AddTicketCommentRequest {
  commentText: string;
  isInternal: boolean;
}

export interface TicketAttachment {
  id: string;
  ticketId: string;
  fileName: string;
  mimeType?: string | null;
  fileSize?: number | null;
  uploadedBy?: string | null;
  uploadedAt: string;
}

export interface RequestType {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  defaultPriority: string;
  slaHours?: number | null;
  isActive: boolean;
}

export interface CreateRequestTypeRequest {
  code: string;
  name: string;
  description?: string | null;
  defaultPriority: string;
  slaHours?: number | null;
}

export interface UpdateRequestTypeRequest {
  name: string;
  description?: string | null;
  defaultPriority: string;
  slaHours?: number | null;
  isActive: boolean;
}

