export interface Ticket {
  id: string;
  ticketNumber: string;
  requesterId?: string | null;
  assigneeId?: string | null;
  equipmentId?: string | null;
  workOrderId?: string | null;
  title: string;
  description?: string | null;
  priority: string;
  status: 'OPEN' | 'ASSIGNED' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
}

export interface CreateTicketRequest {
  ticketNumber: string;
  equipmentId?: string;
  title: string;
  description?: string;
  priority?: string;
}

export interface AssignTicketRequest {
  assigneeId: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  authorId?: string | null;
  body: string;
  createdAt: string;
}

export interface AddTicketCommentRequest {
  body: string;
}

