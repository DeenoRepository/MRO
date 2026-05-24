import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiSuccessResponse } from '../../../core/api/api.models';
import { ApiClientService } from '../../../core/api/api-client.service';
import {
  AddTicketCommentRequest,
  AssignTicketRequest,
  CreateTicketRequest,
  Ticket,
  TicketComment
} from './srs.models';

@Injectable({ providedIn: 'root' })
export class SrsService {
  constructor(private readonly api: ApiClientService) {}

  getTickets(): Observable<ApiSuccessResponse<Ticket[]>> {
    return this.api.get<Ticket[]>('/srs/tickets');
  }

  getTicketById(id: string): Observable<ApiSuccessResponse<Ticket>> {
    return this.api.get<Ticket>(`/srs/tickets/${id}`);
  }

  createTicket(payload: CreateTicketRequest): Observable<ApiSuccessResponse<Ticket>> {
    return this.api.post<CreateTicketRequest, Ticket>('/srs/tickets', payload);
  }

  assignTicket(id: string, payload: AssignTicketRequest): Observable<ApiSuccessResponse<Ticket>> {
    return this.api.post<AssignTicketRequest, Ticket>(`/srs/tickets/${id}/assign`, payload);
  }

  resolveTicket(id: string): Observable<ApiSuccessResponse<Ticket>> {
    return this.api.post<Record<string, never>, Ticket>(`/srs/tickets/${id}/resolve`, {});
  }

  closeTicket(id: string): Observable<ApiSuccessResponse<Ticket>> {
    return this.api.post<Record<string, never>, Ticket>(`/srs/tickets/${id}/close`, {});
  }

  addTicketComment(id: string, payload: AddTicketCommentRequest): Observable<ApiSuccessResponse<TicketComment>> {
    return this.api.post<AddTicketCommentRequest, TicketComment>(`/srs/tickets/${id}/comments`, payload);
  }

  createWorkOrderFromTicket(id: string): Observable<ApiSuccessResponse<Ticket>> {
    return this.api.post<Record<string, never>, Ticket>(`/srs/tickets/${id}/create-work-order`, {});
  }
}

