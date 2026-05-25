import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SrsService } from '../data/srs.service';
import { EpsService } from '../../eps/data/eps.service';
import { Ticket, TicketComment, TicketAttachment, RequestType } from '../data/srs.models';
import { Equipment } from '../../eps/data/eps.models';

@Component({
  selector: 'mro-srs-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="srs-dashboard">
      <!-- HEADER -->
      <header class="dashboard-header">
        <div class="header-left">
          <h1>Service Request System (SRS)</h1>
          <p>Manage support tickets, incidents, SLAs, and integration with maintenance operations.</p>
        </div>
        <div class="header-actions">
          <button (click)="activeTab = 'tickets'" [class.active]="activeTab === 'tickets'" class="tab-btn">
            Tickets Registry
          </button>
          <button (click)="activeTab = 'categories'" [class.active]="activeTab === 'categories'" class="tab-btn">
            Request Categories & SLA
          </button>
        </div>
      </header>

      <!-- MAIN CONTENT -->
      <main class="dashboard-content">
        <!-- TICKETS REGISTRY TAB -->
        <div *ngIf="activeTab === 'tickets'" class="tickets-layout">
          
          <!-- LEFT SIDE: TICKET SEARCH AND LIST -->
          <div class="tickets-list-column">
            <!-- Search & Filters -->
            <div class="card filters-card">
              <h3>Search & Filters</h3>
              <form [formGroup]="filterForm" (ngSubmit)="loadTickets()" class="filters-grid">
                <div class="form-group">
                  <label>Ticket Number</label>
                  <input type="text" formControlName="ticketNumber" placeholder="e.g. TK-12345" />
                </div>
                <div class="form-group">
                  <label>Status</label>
                  <select formControlName="status">
                    <option value="">All Statuses</option>
                    <option value="OPEN">Open</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="WAITING_EXTERNAL">Waiting External</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Priority</label>
                  <select formControlName="priority">
                    <option value="">All Priorities</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Category</label>
                  <select formControlName="requestTypeId">
                    <option value="">All Categories</option>
                    <option *ngFor="let rt of requestTypes" [value]="rt.id">{{ rt.name }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Equipment</label>
                  <select formControlName="equipmentId">
                    <option value="">All Assets</option>
                    <option *ngFor="let eq of equipment" [value]="eq.id">{{ eq.assetTag }} - {{ eq.name }}</option>
                  </select>
                </div>
                <div class="filter-actions">
                  <button type="submit" class="btn btn-primary">Filter</button>
                  <button type="button" (click)="resetFilters()" class="btn btn-secondary">Reset</button>
                </div>
              </form>
            </div>

            <!-- Create Ticket -->
            <div class="card create-card">
              <div class="card-header-toggle" (click)="showCreateForm = !showCreateForm">
                <h3>Create Support Ticket</h3>
                <span class="toggle-icon">{{ showCreateForm ? '−' : '+' }}</span>
              </div>
              
              <form *ngIf="showCreateForm" [formGroup]="ticketForm" (ngSubmit)="createTicket()" class="ticket-form">
                <div class="form-grid">
                  <div class="form-group full-width">
                    <label>Title <span class="required">*</span></label>
                    <input type="text" formControlName="title" placeholder="Summary of the issue" />
                    <span *ngIf="ticketForm.get('title')?.touched && ticketForm.get('title')?.invalid" class="form-error">
                      Title is required (max 255 chars).
                    </span>
                  </div>
                  
                  <div class="form-group">
                    <label>Category (Request Type)</label>
                    <select formControlName="requestTypeId">
                      <option [value]="null">Select Category</option>
                      <option *ngFor="let rt of requestTypes" [value]="rt.id">{{ rt.name }}</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label>Equipment Asset</label>
                    <select formControlName="equipmentId">
                      <option [value]="null">Select Asset</option>
                      <option *ngFor="let eq of equipment" [value]="eq.id">{{ eq.assetTag }} - {{ eq.name }}</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label>Priority</label>
                    <select formControlName="priority">
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label>Initial Assignee ID (Optional)</label>
                    <input type="text" formControlName="assigneeId" placeholder="UUID format" />
                  </div>

                  <div class="form-group full-width">
                    <label>Detailed Description</label>
                    <textarea formControlName="description" rows="3" placeholder="Provide details about the issue..."></textarea>
                  </div>
                </div>

                <div class="form-actions">
                  <button type="submit" [disabled]="ticketForm.invalid || savingTicket" class="btn btn-primary">
                    {{ savingTicket ? 'Creating...' : 'Create Ticket' }}
                  </button>
                </div>
                <p *ngIf="ticketError" class="alert alert-danger">{{ ticketError }}</p>
              </form>
            </div>

            <!-- Tickets List -->
            <div class="card list-card">
              <h3>Tickets List ({{ tickets.length }})</h3>
              <div class="table-container">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Ticket #</th>
                      <th>Title</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let tk of tickets" 
                        [class.selected]="selectedTicket?.id === tk.id"
                        (click)="selectTicket(tk)"
                        class="clickable-row">
                      <td><strong>{{ tk.ticketNumber }}</strong></td>
                      <td>
                        <div class="title-cell">
                          <span class="ticket-title">{{ tk.title }}</span>
                          <span *ngIf="isOverdue(tk)" class="overdue-tag">OVERDUE</span>
                        </div>
                      </td>
                      <td>
                        <span class="priority-badge" [class]="tk.priority.toLowerCase()">
                          {{ tk.priority }}
                        </span>
                      </td>
                      <td>
                        <span class="status-badge" [class]="tk.status.toLowerCase()">
                          {{ tk.status }}
                        </span>
                      </td>
                      <td>
                        <span [class.text-danger]="isOverdue(tk)">
                          {{ tk.dueAt ? (tk.dueAt | date:'short') : 'N/A' }}
                        </span>
                      </td>
                    </tr>
                    <tr *ngIf="tickets.length === 0">
                      <td colspan="5" class="no-data">No tickets match criteria.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- RIGHT SIDE: SELECTED TICKET DETAIL & WORKFLOW -->
          <div class="tickets-detail-column">
            <div *ngIf="selectedTicket" class="card detail-card">
              <div class="detail-header">
                <div class="detail-title-section">
                  <span class="ticket-num">{{ selectedTicket.ticketNumber }}</span>
                  <h2>{{ selectedTicket.title }}</h2>
                </div>
                <div class="detail-quick-badges">
                  <span class="priority-badge" [class]="selectedTicket.priority.toLowerCase()">
                    {{ selectedTicket.priority }}
                  </span>
                  <span class="status-badge" [class]="selectedTicket.status.toLowerCase()">
                    {{ selectedTicket.status }}
                  </span>
                </div>
              </div>

              <div class="detail-body">
                <div class="info-section">
                  <h4>Description</h4>
                  <p class="description-text">{{ selectedTicket.description || 'No description provided.' }}</p>
                </div>

                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">Opened At</span>
                    <span class="info-value">{{ selectedTicket.openedAt | date:'medium' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Due Deadline (SLA)</span>
                    <span class="info-value" [class.text-danger]="isOverdue(selectedTicket)">
                      {{ selectedTicket.dueAt ? (selectedTicket.dueAt | date:'medium') : 'No deadline' }}
                    </span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Associated Asset</span>
                    <span class="info-value">
                      {{ getEquipmentTag(selectedTicket.equipmentId) || 'None' }}
                    </span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Assignee ID</span>
                    <span class="info-value">{{ selectedTicket.assigneeId || 'Unassigned' }}</span>
                  </div>
                </div>

                <hr class="section-divider" />

                <!-- WORKFLOW ACTIONS -->
                <div class="actions-section">
                  <h3>Workflow & Actions</h3>
                  
                  <div class="action-buttons-row">
                    <!-- Status transitions -->
                    <button *ngIf="selectedTicket.status === 'OPEN'" (click)="updateStatus('CANCELLED')" class="btn btn-danger btn-sm">
                      Cancel Ticket
                    </button>
                    <button *ngIf="selectedTicket.status === 'ASSIGNED'" (click)="updateStatus('IN_PROGRESS')" class="btn btn-primary btn-sm">
                      Start Working
                    </button>
                    <button *ngIf="selectedTicket.status === 'ASSIGNED'" (click)="updateStatus('CANCELLED')" class="btn btn-danger btn-sm">
                      Cancel Ticket
                    </button>
                    <button *ngIf="selectedTicket.status === 'IN_PROGRESS'" (click)="updateStatus('WAITING_EXTERNAL')" class="btn btn-warning btn-sm">
                      Hold (External)
                    </button>
                    <button *ngIf="selectedTicket.status === 'IN_PROGRESS'" (click)="updateStatus('RESOLVED')" class="btn btn-success btn-sm">
                      Mark Resolved
                    </button>
                    <button *ngIf="selectedTicket.status === 'WAITING_EXTERNAL'" (click)="updateStatus('IN_PROGRESS')" class="btn btn-primary btn-sm">
                      Resume Working
                    </button>
                    <button *ngIf="selectedTicket.status === 'RESOLVED'" (click)="updateStatus('CLOSED')" class="btn btn-success btn-sm font-bold">
                      Close Ticket
                    </button>
                  </div>

                  <!-- Assign ticket -->
                  <form [formGroup]="assignForm" (ngSubmit)="assignTicket()" class="assign-form">
                    <div class="inline-form-group">
                      <input type="text" formControlName="assigneeId" placeholder="Assignee User UUID" />
                      <button type="submit" [disabled]="assignForm.invalid" class="btn btn-secondary btn-sm">
                        Assign Agent
                      </button>
                    </div>
                  </form>

                  <!-- MMS Integration Work Order -->
                  <div class="mms-integration-box">
                    <div *ngIf="!selectedTicket.linkedWorkOrderId">
                      <p class="integration-notice">This ticket has no linked maintenance work order.</p>
                      <button 
                        (click)="createWorkOrder()" 
                        [disabled]="!selectedTicket.equipmentId || selectedTicket.status === 'CLOSED'" 
                        class="btn btn-mms">
                        ⚡ Generate Maintenance Work Order
                      </button>
                      <p *ngIf="!selectedTicket.equipmentId" class="text-warning text-xs">
                        * Associated asset is required to generate a work order.
                      </p>
                    </div>
                    <div *ngIf="selectedTicket.linkedWorkOrderId" class="linked-wo-banner">
                      <span class="wo-icon">🔧</span>
                      <div>
                        <strong>Linked Work Order Active</strong>
                        <p class="wo-uuid">ID: {{ selectedTicket.linkedWorkOrderId }}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <hr class="section-divider" />

                <!-- COMMENTS FEED -->
                <div class="comments-section">
                  <h3>Conversation & History</h3>
                  <div class="comments-feed">
                    <div *ngFor="let comment of comments" class="comment-bubble" [class.internal]="comment.isInternal">
                      <header class="comment-meta">
                        <span class="comment-author">{{ comment.createdBy || 'Unknown User' }}</span>
                        <span *ngIf="comment.isInternal" class="internal-badge">INTERNAL NOTE</span>
                        <span class="comment-date">{{ comment.createdAt | date:'short' }}</span>
                      </header>
                      <p class="comment-text">{{ comment.commentText }}</p>
                    </div>
                    <div *ngIf="comments.length === 0" class="no-comments">
                      No comments or notes posted yet.
                    </div>
                  </div>

                  <!-- Add Comment -->
                  <form [formGroup]="commentForm" (ngSubmit)="addComment()" class="comment-input-form">
                    <textarea formControlName="commentText" rows="2" placeholder="Write a response or note..."></textarea>
                    <div class="comment-options">
                      <label class="checkbox-label">
                        <input type="checkbox" formControlName="isInternal" />
                        Internal Note (Agents Only)
                      </label>
                      <button type="submit" [disabled]="commentForm.invalid || postingComment" class="btn btn-secondary btn-sm">
                        {{ postingComment ? 'Posting...' : 'Post Comment' }}
                      </button>
                    </div>
                  </form>
                </div>

                <hr class="section-divider" />

                <!-- ATTACHMENTS -->
                <div class="attachments-section">
                  <h3>Attachments</h3>
                  <div class="attachments-list">
                    <div *ngFor="let att of attachments" class="attachment-item">
                      <span class="file-icon">📄</span>
                      <div class="file-details">
                        <span class="file-name">{{ att.fileName }}</span>
                        <span class="file-size" *ngIf="att.fileSize">{{ (att.fileSize / 1024) | number:'1.0-1' }} KB</span>
                      </div>
                      <a [href]="getDownloadUrl(att.id)" target="_blank" class="download-link">Download</a>
                    </div>
                    <div *ngIf="attachments.length === 0" class="no-attachments">
                      No files attached.
                    </div>
                  </div>

                  <!-- Upload attachment -->
                  <div class="upload-zone">
                    <label class="file-upload-btn">
                      📎 Upload File Attachment
                      <input type="file" (change)="onFileSelected($event)" style="display: none;" />
                    </label>
                    <span *ngIf="selectedUploadFile" class="selected-file-label">
                      Selected: {{ selectedUploadFile.name }} ({{ (selectedUploadFile.size / 1024) | number:'1.0-1' }} KB)
                      <button (click)="uploadFile()" class="btn btn-primary btn-sm ml-2">Upload</button>
                    </span>
                  </div>
                </div>

              </div>
            </div>
            <div *ngIf="!selectedTicket" class="card detail-placeholder-card">
              <p>Select a ticket from the registry to view its details, post comments, manage attachments, or trigger maintenance work orders.</p>
            </div>
          </div>

        </div>

        <!-- REQUEST CATEGORIES TAB -->
        <div *ngIf="activeTab === 'categories'" class="categories-layout">
          <div class="card category-form-card">
            <h3>Create Request Category (Request Type)</h3>
            <form [formGroup]="categoryForm" (ngSubmit)="createCategory()" class="category-form">
              <div class="form-grid">
                <div class="form-group">
                  <label>Code <span class="required">*</span></label>
                  <input type="text" formControlName="code" placeholder="e.g. ELEC_FAULT" />
                </div>
                <div class="form-group">
                  <label>Category Name <span class="required">*</span></label>
                  <input type="text" formControlName="name" placeholder="e.g. Electrical Fault" />
                </div>
                <div class="form-group">
                  <label>Default Priority <span class="required">*</span></label>
                  <select formControlName="defaultPriority">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>SLA Deadline (Hours)</label>
                  <input type="number" formControlName="slaHours" placeholder="e.g. 24" />
                </div>
                <div class="form-group full-width">
                  <label>Description</label>
                  <textarea formControlName="description" rows="2" placeholder="Describe the category..."></textarea>
                </div>
              </div>
              <div class="form-actions">
                <button type="submit" [disabled]="categoryForm.invalid || savingCategory" class="btn btn-primary">
                  {{ savingCategory ? 'Saving...' : 'Register Category' }}
                </button>
              </div>
            </form>
          </div>

          <div class="card category-list-card">
            <h3>Registered Categories</h3>
            <div class="table-container">
              <table class="table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Default Priority</th>
                    <th>SLA Deadline</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let rt of requestTypes">
                    <td><code>{{ rt.code }}</code></td>
                    <td>{{ rt.name }}</td>
                    <td>
                      <span class="priority-badge" [class]="rt.defaultPriority.toLowerCase()">
                        {{ rt.defaultPriority }}
                      </span>
                    </td>
                    <td>{{ rt.slaHours ? rt.slaHours + ' Hours' : 'No SLA' }}</td>
                    <td>
                      <span class="status-tag" [class.active]="rt.isActive" [class.inactive]="!rt.isActive">
                        {{ rt.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td>
                      <button *ngIf="rt.isActive" (click)="deactivateCategory(rt.id)" class="btn btn-danger btn-sm">
                        Deactivate
                      </button>
                    </td>
                  </tr>
                  <tr *ngIf="requestTypes.length === 0">
                    <td colspan="6" class="no-data">No categories configured yet.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .srs-dashboard {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 24px;
      background: #f8fafc;
      min-height: 100vh;
      color: #1e293b;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 16px;
    }

    .dashboard-header h1 {
      margin: 0;
      font-size: 1.8rem;
      font-weight: 700;
      color: #0f172a;
    }

    .dashboard-header p {
      margin: 4px 0 0;
      color: #64748b;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .tab-btn {
      background: white;
      border: 1px solid #cbd5e1;
      padding: 10px 16px;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s ease;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .tab-btn:hover {
      background: #f1f5f9;
      color: #0f172a;
    }

    .tab-btn.active {
      background: #0284c7;
      color: white;
      border-color: #0284c7;
    }

    .card {
      background: white;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      padding: 20px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .card h3 {
      margin: 0;
      font-size: 1.1rem;
      color: #0f172a;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 8px;
    }

    .card-header-toggle {
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
    }

    .card-header-toggle h3 {
      border: none;
      padding: 0;
    }

    .toggle-icon {
      font-size: 1.4rem;
      font-weight: bold;
      color: #64748b;
    }

    /* TICKETS LAYOUT */
    .tickets-layout {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 24px;
      align-items: start;
    }

    @media (max-width: 1280px) {
      .tickets-layout {
        grid-template-columns: 1fr;
      }
    }

    .tickets-list-column {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .tickets-detail-column {
      position: sticky;
      top: 24px;
    }

    /* FILTERS */
    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      align-items: flex-end;
    }

    .filter-actions {
      display: flex;
      gap: 8px;
      grid-column: 1 / -1;
      justify-content: flex-end;
      margin-top: 8px;
    }

    /* FORMS */
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .form-group label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
    }

    .required {
      color: #ef4444;
    }

    input[type="text"], input[type="number"], select, textarea {
      padding: 10px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.9rem;
      font-family: inherit;
      color: #1e293b;
      background: #ffffff;
      transition: border-color 0.15s ease-in-out;
    }

    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: #0284c7;
      box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1);
    }

    .form-error {
      color: #ef4444;
      font-size: 0.75rem;
      margin-top: 2px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 8px;
    }

    /* BUTTONS */
    .btn {
      padding: 10px 16px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.2s ease;
      font-size: 0.9rem;
    }

    .btn-primary {
      background: #0284c7;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0369a1;
    }

    .btn-secondary {
      background: #e2e8f0;
      color: #334155;
      border-color: #cbd5e1;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #cbd5e1;
    }

    .btn-danger {
      background: #ef4444;
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background: #dc2626;
    }

    .btn-warning {
      background: #f59e0b;
      color: white;
    }

    .btn-warning:hover:not(:disabled) {
      background: #d97706;
    }

    .btn-success {
      background: #10b981;
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      background: #059669;
    }

    .btn-mms {
      background: #6366f1;
      color: white;
      width: 100%;
      padding: 12px;
      font-weight: 700;
    }

    .btn-mms:hover:not(:disabled) {
      background: #4f46e5;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 0.8rem;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* TABLES */
    .table-container {
      overflow-x: auto;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.9rem;
    }

    .table th {
      background: #f8fafc;
      padding: 12px;
      font-weight: 600;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
    }

    .table td {
      padding: 12px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }

    .clickable-row {
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .clickable-row:hover {
      background: #f8fafc;
    }

    .clickable-row.selected {
      background: #f0f9ff;
      border-left: 4px solid #0284c7;
    }

    .title-cell {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .ticket-title {
      font-weight: 500;
    }

    .overdue-tag {
      background: #fee2e2;
      color: #ef4444;
      font-size: 0.7rem;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #fca5a5;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    .no-data {
      text-align: center;
      color: #64748b;
      padding: 20px;
      font-style: italic;
    }

    /* BADGES */
    .priority-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
    }

    .priority-badge.high {
      background: #fee2e2;
      color: #dc2626;
    }

    .priority-badge.medium {
      background: #fef3c7;
      color: #d97706;
    }

    .priority-badge.low {
      background: #f1f5f9;
      color: #475569;
    }

    .status-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
    }

    .status-badge.open { background: #e0f2fe; color: #0369a1; }
    .status-badge.assigned { background: #e0e7ff; color: #4338ca; }
    .status-badge.in_progress { background: #fef3c7; color: #b45309; }
    .status-badge.waiting_external { background: #ffedd5; color: #c2410c; }
    .status-badge.resolved { background: #d1fae5; color: #047857; }
    .status-badge.closed { background: #dcfce7; color: #15803d; }
    .status-badge.cancelled { background: #f1f5f9; color: #64748b; }

    .status-tag {
      font-size: 0.8rem;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .status-tag.active {
      background: #d1fae5;
      color: #065f46;
    }

    .status-tag.inactive {
      background: #fee2e2;
      color: #991b1b;
    }

    /* DETAILS SECTION */
    .detail-placeholder-card {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 300px;
      text-align: center;
      color: #64748b;
      font-style: italic;
      border: 2px dashed #cbd5e1;
      background: transparent;
    }

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 16px;
    }

    .detail-title-section {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .ticket-num {
      font-size: 0.9rem;
      font-weight: 700;
      color: #64748b;
    }

    .detail-header h2 {
      margin: 0;
      font-size: 1.4rem;
      color: #0f172a;
    }

    .detail-quick-badges {
      display: flex;
      gap: 8px;
    }

    .detail-body {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .info-section h4 {
      margin: 0 0 8px 0;
      font-size: 0.95rem;
      color: #475569;
    }

    .description-text {
      background: #f8fafc;
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid #f1f5f9;
      font-size: 0.95rem;
      line-height: 1.5;
      margin: 0;
      white-space: pre-wrap;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-label {
      font-size: 0.8rem;
      color: #64748b;
      font-weight: 600;
    }

    .info-value {
      font-size: 0.9rem;
      font-weight: 500;
      color: #1e293b;
    }

    .section-divider {
      border: 0;
      border-top: 1px solid #e2e8f0;
      margin: 8px 0;
    }

    .actions-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .actions-section h3, .comments-section h3, .attachments-section h3 {
      margin: 0;
      font-size: 1rem;
      color: #334155;
    }

    .action-buttons-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .assign-form {
      margin-top: 8px;
    }

    .inline-form-group {
      display: flex;
      gap: 8px;
    }

    .inline-form-group input {
      flex: 1;
      padding: 6px 12px;
      font-size: 0.85rem;
    }

    .mms-integration-box {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      background: #fcfcff;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .integration-notice {
      margin: 0 0 8px 0;
      font-size: 0.85rem;
      color: #64748b;
    }

    .linked-wo-banner {
      display: flex;
      gap: 12px;
      align-items: center;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 12px;
      border-radius: 8px;
      color: #1e40af;
    }

    .wo-icon {
      font-size: 1.8rem;
    }

    .wo-uuid {
      margin: 2px 0 0 0;
      font-family: monospace;
      font-size: 0.8rem;
      color: #2563eb;
    }

    /* COMMENTS */
    .comments-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .comments-feed {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 250px;
      overflow-y: auto;
      border: 1px solid #f1f5f9;
      border-radius: 8px;
      padding: 10px;
      background: #fafafa;
    }

    .comment-bubble {
      background: white;
      border-radius: 8px;
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 2px rgba(0,0,0,0.02);
    }

    .comment-bubble.internal {
      background: #fffbeb;
      border-color: #fef3c7;
    }

    .comment-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      font-size: 0.75rem;
      color: #64748b;
    }

    .comment-author {
      font-weight: 700;
      color: #334155;
    }

    .internal-badge {
      background: #f59e0b;
      color: white;
      padding: 1px 4px;
      font-size: 0.65rem;
      font-weight: 800;
      border-radius: 3px;
    }

    .comment-date {
      color: #94a3b8;
    }

    .no-comments {
      text-align: center;
      padding: 20px;
      color: #94a3b8;
      font-style: italic;
      font-size: 0.85rem;
    }

    .comment-input-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .comment-input-form textarea {
      width: 100%;
      resize: vertical;
      box-sizing: border-box;
    }

    .comment-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .checkbox-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
    }

    /* ATTACHMENTS */
    .attachments-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .attachments-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .attachment-item {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 0.85rem;
    }

    .file-icon {
      font-size: 1.2rem;
    }

    .file-details {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .file-name {
      font-weight: 600;
      color: #334155;
    }

    .file-size {
      font-size: 0.75rem;
      color: #64748b;
    }

    .download-link {
      color: #0284c7;
      font-weight: 600;
      text-decoration: none;
    }

    .download-link:hover {
      text-decoration: underline;
    }

    .no-attachments {
      text-align: center;
      padding: 12px;
      color: #94a3b8;
      font-style: italic;
      font-size: 0.85rem;
    }

    .upload-zone {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 4px;
    }

    .file-upload-btn {
      background: #f1f5f9;
      border: 1px dashed #cbd5e1;
      color: #475569;
      padding: 8px 16px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      display: inline-block;
      font-size: 0.85rem;
    }

    .file-upload-btn:hover {
      background: #e2e8f0;
    }

    .selected-file-label {
      font-size: 0.85rem;
      color: #334155;
    }

    /* CATEGORIES LAYOUT */
    .categories-layout {
      display: grid;
      grid-template-columns: 380px 1fr;
      gap: 24px;
      align-items: start;
    }

    @media (max-width: 1024px) {
      .categories-layout {
        grid-template-columns: 1fr;
      }
    }

    /* UTILS */
    .text-danger { color: #ef4444; }
    .text-warning { color: #f59e0b; }
    .text-xs { font-size: 0.75rem; }
    .ml-2 { margin-left: 8px; }
    .font-bold { font-weight: 700; }
  `]
})
export class SrsPageComponent implements OnInit {
  activeTab: 'tickets' | 'categories' = 'tickets';
  tickets: Ticket[] = [];
  requestTypes: RequestType[] = [];
  equipment: Equipment[] = [];
  selectedTicket: Ticket | null = null;
  comments: TicketComment[] = [];
  attachments: TicketAttachment[] = [];

  // Forms
  filterForm!: FormGroup;
  ticketForm!: FormGroup;
  commentForm!: FormGroup;
  assignForm!: FormGroup;
  categoryForm!: FormGroup;

  // UI state
  showCreateForm = false;
  savingTicket = false;
  ticketError = '';
  postingComment = false;
  savingCategory = false;
  selectedUploadFile: File | null = null;

  constructor(
    private readonly srsService: SrsService,
    private readonly epsService: EpsService,
    private readonly fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadInitialData();
  }

  private initForms(): void {
    this.filterForm = this.fb.group({
      ticketNumber: [''],
      status: [''],
      priority: [''],
      requestTypeId: [''],
      equipmentId: ['']
    });

    this.ticketForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      requestTypeId: [null],
      equipmentId: [null],
      priority: ['MEDIUM', Validators.required],
      assigneeId: [''],
      description: ['']
    });

    this.commentForm = this.fb.group({
      commentText: ['', [Validators.required, Validators.maxLength(4000)]],
      isInternal: [false]
    });

    this.assignForm = this.fb.group({
      assigneeId: ['', Validators.required]
    });

    this.categoryForm = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(64)]],
      name: ['', [Validators.required, Validators.maxLength(255)]],
      defaultPriority: ['MEDIUM', Validators.required],
      slaHours: [null],
      description: ['']
    });
  }

  private loadInitialData(): void {
    // Load categories (request types)
    this.srsService.getRequestTypes().subscribe({
      next: (res) => this.requestTypes = res.data
    });

    // Load physical assets
    this.epsService.getEquipment().subscribe({
      next: (res) => this.equipment = res.data
    });

    // Load tickets registry
    this.loadTickets();
  }

  loadTickets(): void {
    const filters = this.filterForm.value;
    this.srsService.getTickets(filters).subscribe({
      next: (res) => {
        this.tickets = res.data;
        // Keep selected ticket in sync if active
        if (this.selectedTicket) {
          const updated = this.tickets.find(t => t.id === this.selectedTicket?.id);
          if (updated) {
            this.selectedTicket = updated;
          }
        }
      }
    });
  }

  resetFilters(): void {
    this.filterForm.reset({
      ticketNumber: '',
      status: '',
      priority: '',
      requestTypeId: '',
      equipmentId: ''
    });
    this.loadTickets();
  }

  createTicket(): void {
    if (this.ticketForm.invalid) return;
    this.savingTicket = true;
    this.ticketError = '';

    const val = this.ticketForm.value;
    const payload = {
      ...val,
      requestTypeId: val.requestTypeId || null,
      equipmentId: val.equipmentId || null,
      assigneeId: val.assigneeId ? val.assigneeId.trim() : null
    };

    this.srsService.createTicket(payload).subscribe({
      next: (res) => {
        this.savingTicket = false;
        this.ticketForm.reset({ priority: 'MEDIUM' });
        this.showCreateForm = false;
        this.loadTickets();
        this.selectTicket(res.data);
      },
      error: (err) => {
        this.savingTicket = false;
        this.ticketError = err.error?.message || 'Error occurred while creating ticket.';
      }
    });
  }

  selectTicket(tk: Ticket): void {
    this.selectedTicket = tk;
    this.comments = [];
    this.attachments = [];
    this.commentForm.reset({ isInternal: false });
    this.assignForm.reset({ assigneeId: tk.assigneeId || '' });
    this.selectedUploadFile = null;

    this.loadTicketComments(tk.id);
    this.loadTicketAttachments(tk.id);
  }

  private loadTicketComments(id: string): void {
    this.srsService.getTicketComments(id).subscribe({
      next: (res) => this.comments = res.data
    });
  }

  private loadTicketAttachments(id: string): void {
    this.srsService.getTicketAttachments(id).subscribe({
      next: (res) => this.attachments = res.data
    });
  }

  updateStatus(newStatus: string): void {
    if (!this.selectedTicket) return;
    this.srsService.changeTicketStatus(this.selectedTicket.id, newStatus).subscribe({
      next: (res) => {
        this.selectedTicket = res.data;
        this.loadTickets();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to update ticket status.');
      }
    });
  }

  assignTicket(): void {
    if (this.assignForm.invalid || !this.selectedTicket) return;
    const assigneeId = this.assignForm.value.assigneeId.trim();
    this.srsService.assignTicket(this.selectedTicket.id, { assigneeId }).subscribe({
      next: (res) => {
        this.selectedTicket = res.data;
        this.loadTickets();
        alert('Ticket successfully assigned.');
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to assign ticket.');
      }
    });
  }

  createWorkOrder(): void {
    if (!this.selectedTicket) return;
    this.srsService.createWorkOrderFromTicket(this.selectedTicket.id).subscribe({
      next: (res) => {
        this.selectedTicket = res.data;
        this.loadTickets();
        alert('Successfully generated maintenance work order.');
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to create work order.');
      }
    });
  }

  addComment(): void {
    if (this.commentForm.invalid || !this.selectedTicket) return;
    this.postingComment = true;
    this.srsService.addTicketComment(this.selectedTicket.id, this.commentForm.value).subscribe({
      next: (res) => {
        this.postingComment = false;
        this.commentForm.reset({ isInternal: false });
        this.loadTicketComments(this.selectedTicket!.id);
      },
      error: (err) => {
        this.postingComment = false;
        alert(err.error?.message || 'Failed to post comment.');
      }
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedUploadFile = file;
    }
  }

  uploadFile(): void {
    if (!this.selectedUploadFile || !this.selectedTicket) return;
    this.srsService.uploadAttachment(this.selectedTicket.id, this.selectedUploadFile).subscribe({
      next: () => {
        this.selectedUploadFile = null;
        this.loadTicketAttachments(this.selectedTicket!.id);
        alert('File uploaded successfully.');
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to upload attachment file.');
      }
    });
  }

  getDownloadUrl(attachmentId: string): string {
    return this.srsService.getAttachmentDownloadUrl(attachmentId);
  }

  createCategory(): void {
    if (this.categoryForm.invalid) return;
    this.savingCategory = true;
    this.srsService.createRequestType(this.categoryForm.value).subscribe({
      next: (res) => {
        this.savingCategory = false;
        this.categoryForm.reset({ defaultPriority: 'MEDIUM' });
        this.srsService.getRequestTypes().subscribe({
          next: (res) => this.requestTypes = res.data
        });
        alert('Category added successfully.');
      },
      error: (err) => {
        this.savingCategory = false;
        alert(err.error?.message || 'Failed to create category.');
      }
    });
  }

  deactivateCategory(id: string): void {
    if (!confirm('Are you sure you want to deactivate this category?')) return;
    this.srsService.deactivateRequestType(id).subscribe({
      next: () => {
        this.srsService.getRequestTypes().subscribe({
          next: (res) => this.requestTypes = res.data
        });
        alert('Category deactivated.');
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to deactivate category.');
      }
    });
  }

  isOverdue(ticket: Ticket): boolean {
    if (!ticket.dueAt || ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
      return false;
    }
    return new Date(ticket.dueAt) < new Date();
  }

  getEquipmentTag(id: string | null | undefined): string | null {
    if (!id) return null;
    const found = this.equipment.find(e => e.id === id);
    return found ? `${found.assetTag} (${found.name})` : id;
  }
}
