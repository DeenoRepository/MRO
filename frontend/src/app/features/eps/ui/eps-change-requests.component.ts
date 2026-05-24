import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EpsService } from '../data/eps.service';
import { ChangeRequest, CreateChangeRequest, DecideChangeRequest } from '../data/eps.models';

@Component({
  selector: 'mro-eps-change-requests',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="change-requests-container">
      <div class="header-row">
        <h2>EPS Change Requests</h2>
        <button (click)="showCreateForm = !showCreateForm" class="btn btn-primary">
          {{ showCreateForm ? 'View Change Requests' : 'Create Change Request' }}
        </button>
      </div>

      <div *ngIf="showCreateForm" class="create-card">
        <h3>Submit Change Request</h3>
        <form [formGroup]="createForm" (ngSubmit)="submitRequest()" class="create-form">
          <div class="form-row">
            <div class="form-group">
              <label>Change Type</label>
              <select formControlName="changeType" (change)="onChangeTypeChanged()">
                <option value="CREATE">Register New Equipment (CREATE)</option>
                <option value="UPDATE">Update Existing Equipment (UPDATE)</option>
              </select>
            </div>
            <div class="form-group" *ngIf="createForm.value.changeType === 'UPDATE'">
              <label>Target Equipment ID</label>
              <input type="text" formControlName="entityId" placeholder="UUID of equipment" />
            </div>
          </div>

          <div class="form-group">
            <label>Proposed Data (JSON Format)</label>
            <textarea formControlName="proposedData" rows="6" placeholder='e.g., {"name": "New Generator", "category": "POWER", "assetTag": "EQ-204"}'></textarea>
            <p class="hint">For CREATE, supply: assetTag, name, category. Optional: location, manufacturer, model, serialNumber, installDate.</p>
          </div>

          <div class="button-row">
            <button type="submit" [disabled]="createForm.invalid || submitting" class="btn btn-success">
              {{ submitting ? 'Submitting...' : 'Submit Request' }}
            </button>
            <button type="button" (click)="showCreateForm = false" class="btn btn-secondary">Cancel</button>
          </div>
        </form>
        <p *ngIf="error" class="error-msg">{{ error }}</p>
      </div>

      <div *ngIf="!showCreateForm" class="list-container">
        <div *ngIf="loading" class="loading">Loading change requests...</div>
        <div *ngIf="!loading && requests.length === 0" class="no-data">No change requests found.</div>

        <div *ngIf="!loading && requests.length > 0" class="requests-grid">
          <div *ngFor="let req of requests" class="req-card" [class]="req.status.toLowerCase()">
            <div class="req-header">
              <span class="type-badge" [class]="req.changeType.toLowerCase()">{{ req.changeType }}</span>
              <span class="status-badge" [class]="req.status.toLowerCase()">{{ req.status }}</span>
            </div>

            <div class="req-body">
              <p><strong>Request ID:</strong> <span class="mono">{{ req.id }}</span></p>
              <p *ngIf="req.entityId"><strong>Equipment ID:</strong> <span class="mono">{{ req.entityId }}</span></p>
              <p><strong>Submitted At:</strong> {{ req.createdAt | date:'yyyy-MM-dd HH:mm' }}</p>

              <div class="proposed-data-box">
                <strong>Proposed Properties:</strong>
                <pre class="json-preview">{{ formatJson(req.proposedData) }}</pre>
              </div>

              <div *ngIf="req.approvalNotes" class="notes-box">
                <strong>Approval Notes:</strong>
                <p class="notes-text">{{ req.approvalNotes }}</p>
              </div>
            </div>

            <div *ngIf="req.status === 'PENDING'" class="decision-section">
              <div class="form-group">
                <input type="text" #notesInput placeholder="Add notes (optional)..." class="notes-input" />
              </div>
              <div class="decision-buttons">
                <button (click)="decide(req.id, true, notesInput.value)" class="btn btn-success btn-sm">Approve</button>
                <button (click)="decide(req.id, false, notesInput.value)" class="btn btn-danger btn-sm">Reject</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .change-requests-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-row h2 {
      margin: 0;
      color: #0f172a;
    }
    .create-card {
      background: #ffffff;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    .create-card h3 {
      margin: 0 0 20px 0;
      color: #1e293b;
    }
    .create-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .form-row {
      display: flex;
      gap: 16px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
    }
    .form-group label {
      font-weight: 600;
      color: #475569;
      font-size: 0.9rem;
    }
    .form-group select, .form-group input, .form-group textarea {
      padding: 10px 12px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      font-family: inherit;
      font-size: 0.95rem;
    }
    .form-group textarea {
      resize: vertical;
      font-family: monospace;
    }
    .hint {
      margin: 4px 0 0 0;
      font-size: 0.8rem;
      color: #64748b;
    }
    .button-row {
      display: flex;
      gap: 12px;
      margin-top: 10px;
    }
    .btn {
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s ease;
    }
    .btn-primary { background: #0284c7; color: white; }
    .btn-primary:hover { background: #0369a1; }
    .btn-success { background: #16a34a; color: white; }
    .btn-success:hover { background: #15803d; }
    .btn-danger { background: #dc2626; color: white; }
    .btn-danger:hover { background: #b91c1c; }
    .btn-secondary { background: #e2e8f0; color: #475569; }
    .btn-secondary:hover { background: #cbd5e1; }
    .btn-sm { padding: 6px 12px; font-size: 0.85rem; }
    .error-msg { color: #dc2626; font-size: 0.9rem; margin: 10px 0 0 0; }
    .requests-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }
    .req-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 16px;
      transition: border-color 0.2s;
    }
    .req-card.pending { border-left: 5px solid #f59e0b; }
    .req-card.approved { border-left: 5px solid #10b981; }
    .req-card.rejected { border-left: 5px solid #ef4444; }

    .req-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .type-badge {
      font-weight: 700;
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: 4px;
      letter-spacing: 0.05em;
    }
    .type-badge.create { background: #ecfdf5; color: #047857; }
    .type-badge.update { background: #eff6ff; color: #1d4ed8; }

    .status-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 9999px;
    }
    .status-badge.pending { background: #fef3c7; color: #d97706; }
    .status-badge.approved { background: #d1fae5; color: #065f46; }
    .status-badge.rejected { background: #fee2e2; color: #991b1b; }

    .req-body {
      font-size: 0.85rem;
      color: #475569;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .req-body p { margin: 0; }
    .mono { font-family: monospace; color: #0f172a; }
    .proposed-data-box {
      margin-top: 10px;
      background: #f8fafc;
      padding: 10px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
    .json-preview {
      margin: 4px 0 0 0;
      font-family: monospace;
      font-size: 0.75rem;
      white-space: pre-wrap;
      word-break: break-all;
      color: #0f172a;
    }
    .notes-box {
      margin-top: 8px;
      background: #f1f5f9;
      padding: 8px;
      border-radius: 6px;
      font-size: 0.8rem;
    }
    .notes-text {
      margin: 2px 0 0 0;
      color: #334155;
      font-style: italic;
    }
    .decision-section {
      background: #f8fafc;
      border-radius: 8px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      border-top: 1px solid #e2e8f0;
    }
    .notes-input {
      padding: 6px 10px;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
      font-size: 0.8rem;
      width: 100%;
      box-sizing: border-box;
    }
    .decision-buttons {
      display: flex;
      gap: 8px;
    }
    .decision-buttons button {
      flex: 1;
    }
    .loading, .no-data {
      padding: 40px;
      text-align: center;
      color: #64748b;
      font-style: italic;
    }
  `]
})
export class EpsChangeRequestsComponent implements OnInit {
  requests: ChangeRequest[] = [];
  loading = false;
  submitting = false;
  showCreateForm = false;
  error = '';

  readonly createForm = this.fb.group({
    changeType: ['CREATE', Validators.required],
    entityId: [''],
    proposedData: ['', Validators.required]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly epsService: EpsService
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading = true;
    this.epsService.getChangeRequests().subscribe({
      next: (res) => {
        this.requests = res.data.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onChangeTypeChanged(): void {
    const changeType = this.createForm.controls.changeType.value;
    if (changeType === 'CREATE') {
      this.createForm.controls.entityId.setValue('');
      this.createForm.controls.entityId.clearValidators();
    } else {
      this.createForm.controls.entityId.setValidators([Validators.required]);
    }
    this.createForm.controls.entityId.updateValueAndValidity();
  }

  submitRequest(): void {
    if (this.createForm.invalid) return;
    this.submitting = true;
    this.error = '';

    const payload: CreateChangeRequest = {
      entityType: 'EQUIPMENT',
      changeType: this.createForm.controls.changeType.value as 'CREATE' | 'UPDATE',
      proposedData: this.createForm.controls.proposedData.value ?? '{}'
    };

    const entityId = this.createForm.controls.entityId.value;
    if (entityId) {
      payload.entityId = entityId;
    }

    this.epsService.createChangeRequest(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.showCreateForm = false;
        this.createForm.reset({ changeType: 'CREATE', entityId: '', proposedData: '' });
        this.loadRequests();
      },
      error: (err) => {
        this.submitting = false;
        this.error = err?.error?.message ?? 'Failed to submit change request.';
      }
    });
  }

  decide(id: string, approve: boolean, notes: string): void {
    const decision: DecideChangeRequest = {
      approvalNotes: notes || undefined
    };

    const action = approve
      ? this.epsService.approveChangeRequest(id, decision)
      : this.epsService.rejectChangeRequest(id, decision);

    action.subscribe({
      next: () => {
        this.loadRequests();
      },
      error: (err) => {
        alert(err?.error?.message ?? 'Failed to process decision.');
      }
    });
  }

  formatJson(jsonStr: string): string {
    try {
      return JSON.stringify(JSON.parse(jsonStr), null, 2);
    } catch {
      return jsonStr;
    }
  }
}
