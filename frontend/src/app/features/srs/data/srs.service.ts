import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiSuccessResponse } from '../../../core/api/api.models';
import { ApiClientService } from '../../../core/api/api-client.service';
import {
  AddTicketCommentRequest,
  AssignTicketRequest,
  CreateTicketRequest,
  UpdateTicketRequest,
  Ticket,
  TicketComment,
  TicketAttachment,
  RequestType,
  CreateRequestTypeRequest,
  UpdateRequestTypeRequest
} from './srs.models';

@Injectable({ providedIn: 'root' })
export class SrsService {
  constructor(private readonly api: ApiClientService) {}

  getTickets(filters?: {
    ticketNumber?: string;
    status?: string;
    priority?: string;
    requestTypeId?: string;
    requesterId?: string;
    assigneeId?: string;
    equipmentId?: string;
  }): Observable<ApiSuccessResponse<Ticket[]>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val) params.append(key, val);
      });
    }
    const query = params.toString();
    const path = query ? `/srs/tickets?${query}` : '/srs/tickets';
    return this.api.get<Ticket[]>(path);
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

  changeTicketStatus(id: string, status: string): Observable<ApiSuccessResponse<Ticket>> {
    return this.api.post<{ status: string }, Ticket>(`/srs/tickets/${id}/status`, { status });
  }

  addTicketComment(id: string, payload: AddTicketCommentRequest): Observable<ApiSuccessResponse<TicketComment>> {
    return this.api.post<AddTicketCommentRequest, TicketComment>(`/srs/tickets/${id}/comments`, payload);
  }

  getTicketComments(id: string): Observable<ApiSuccessResponse<TicketComment[]>> {
    return this.api.get<TicketComment[]>(`/srs/tickets/${id}/comments`);
  }

  uploadAttachment(id: string, file: File): Observable<ApiSuccessResponse<TicketAttachment>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post<FormData, TicketAttachment>(`/srs/tickets/${id}/attachments`, formData);
  }

  getTicketAttachments(id: string): Observable<ApiSuccessResponse<TicketAttachment[]>> {
    return this.api.get<TicketAttachment[]>(`/srs/tickets/${id}/attachments`);
  }

  getAttachmentDownloadUrl(attachmentId: string): string {
    return `/api/v1/srs/tickets/attachments/${attachmentId}/download`;
  }

  createWorkOrderFromTicket(id: string): Observable<ApiSuccessResponse<Ticket>> {
    return this.api.post<Record<string, never>, Ticket>(`/srs/tickets/${id}/create-work-order`, {});
  }

  getRequestTypes(): Observable<ApiSuccessResponse<RequestType[]>> {
    return this.api.get<RequestType[]>('/srs/request-types');
  }

  createRequestType(payload: CreateRequestTypeRequest): Observable<ApiSuccessResponse<RequestType>> {
    return this.api.post<CreateRequestTypeRequest, RequestType>('/srs/request-types', payload);
  }

  updateRequestType(id: string, payload: UpdateRequestTypeRequest): Observable<ApiSuccessResponse<RequestType>> {
    return this.api.put<UpdateRequestTypeRequest, RequestType>(`/srs/request-types/${id}`, payload);
  }

  deactivateRequestType(id: string): Observable<ApiSuccessResponse<RequestType>> {
    return this.api.delete(`/srs/request-types/${id}`) as unknown as Observable<ApiSuccessResponse<RequestType>>;
  }
}

