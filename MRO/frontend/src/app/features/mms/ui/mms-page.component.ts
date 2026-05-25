import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MmsService } from '../data/mms.service';
import { WorkOrder, WorkOrderTask, MaintenanceHistory } from '../data/mms.models';

@Component({
  selector: 'mro-mms-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="mms-dashboard">
      <nav class="tab-navigation">
        <button (click)="activeTab = 'work_orders'" [class.active]="activeTab === 'work_orders'">
          Work Orders
        </button>
        <button (click)="activeTab = 'pm_schedules'" [class.active]="activeTab === 'pm_schedules'">
          PM Schedules
        </button>
      </nav>

      <main class="tab-content">
        <!-- WORK ORDERS TAB -->
        <div *ngIf="activeTab === 'work_orders'" class="layout-grid">
          
          <div class="list-section">
            <header class="section-header">
              <h2>Maintenance Work Orders</h2>
              <p>Track, assign, and complete maintenance activities.</p>
            </header>

            <form [formGroup]="createForm" (ngSubmit)="createWo()" class="create-card">
              <h3>Create Work Order</h3>
              <div class="form-row">
                <input type="text" formControlName="woNumber" placeholder="WO Number (e.g. WO-203)" />
                <input type="text" formControlName="equipmentId" placeholder="Equipment UUID" />
                <input type="text" formControlName="title" placeholder="Job Title" />
              </div>
              <div class="form-row select-row">
                <select formControlName="type">
                  <option value="CORRECTIVE">Corrective</option>
                  <option value="PREVENTIVE">Preventive</option>
                  <option value="EMERGENCY">Emergency</option>
                  <option value="INSPECTION">Inspection</option>
                </select>
                <select formControlName="priority">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
                <button type="submit" [disabled]="createForm.invalid || submitting" class="btn btn-primary">
                  {{ submitting ? 'Creating...' : 'Create WO' }}
                </button>
              </div>
              <p *ngIf="error" class="error-msg">{{ error }}</p>
            </form>

            <div class="table-container">
              <div *ngIf="loading" class="loading">Loading work orders...</div>
              <div *ngIf="!loading && workOrders.length === 0" class="no-data">No work orders registered.</div>

              <table *ngIf="!loading && workOrders.length > 0" class="table">
                <thead>
                  <tr>
                    <th>WO Number</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let wo of workOrders" 
                      [class.selected]="selectedWo?.id === wo.id"
                      (click)="selectWo(wo)"
                      class="clickable-row">
                    <td><strong>{{ wo.woNumber }}</strong></td>
                    <td>{{ wo.title }}</td>
                    <td><span class="type-tag">{{ wo.type }}</span></td>
                    <td><span class="priority-tag" [class]="wo.priority.toLowerCase()">{{ wo.priority }}</span></td>
                    <td><span class="status-tag" [class]="wo.status.toLowerCase()">{{ wo.status }}</span></td>
                    <td>
                      <button (click)="selectWo(wo); $event.stopPropagation()" class="btn btn-secondary btn-sm">
                        Details
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- DETAIL / ACTION DRAWER -->
          <div class="drawer-section" *ngIf="selectedWo">
            <div class="drawer-card">
              <div class="drawer-header">
                <h3>Work Order Details</h3>
                <span class="status-tag" [class]="selectedWo.status.toLowerCase()">{{ selectedWo.status }}</span>
              </div>
              
              <div class="details-body">
                <p><strong>WO Number:</strong> {{ selectedWo.woNumber }}</p>
                <p><strong>Title:</strong> {{ selectedWo.title }}</p>
                <p><strong>Asset Reference:</strong> <span class="mono">{{ selectedWo.equipmentId }}</span></p>
                <p *ngIf="selectedWo.description"><strong>Description:</strong> {{ selectedWo.description }}</p>
                <p *ngIf="selectedWo.technicianId"><strong>Technician ID:</strong> <span class="mono">{{ selectedWo.technicianId }}</span></p>
                <p *ngIf="selectedWo.signatureHash"><strong>Signature Hash:</strong> <span class="mono hash" [title]="selectedWo.signatureHash">{{ selectedWo.signatureHash.substring(0, 16) }}...</span></p>
              </div>

              <!-- ASSIGN TECHNICIAN -->
              <div *ngIf="selectedWo.status === 'OPEN'" class="action-box">
                <h4>Assign Technician</h4>
                <div class="assign-form">
                  <input type="text" #techIdInput placeholder="Technician User UUID" class="notes-input" />
                  <button (click)="assign(selectedWo.id, techIdInput.value)" class="btn btn-success btn-sm">Assign</button>
                </div>
              </div>

              <!-- START WORK -->
              <div *ngIf="selectedWo.status === 'ASSIGNED'" class="action-box text-center">
                <button (click)="startWork(selectedWo.id)" class="btn btn-primary">Start Execution</button>
              </div>

              <!-- TASKS CHECKLIST -->
              <div *ngIf="selectedWo.status !== 'COMPLETED' && selectedWo.status !== 'CANCELLED'" class="action-box">
                <h4>Tasks Checklist</h4>
                <div class="task-add">
                  <input type="text" #taskTitleInput placeholder="New Task Title" class="notes-input" />
                  <button (click)="addTask(selectedWo.id, taskTitleInput.value); taskTitleInput.value=''" class="btn btn-secondary btn-sm">Add</button>
                </div>
                <ul class="task-list">
                  <li *ngFor="let task of tasks" [class.completed]="task.status === 'COMPLETED'">
                    <span>{{ task.title }}</span>
                    <button *ngIf="task.status === 'OPEN'" (click)="completeTask(task.id)" class="btn btn-success btn-xs">Done</button>
                  </li>
                  <li *ngIf="tasks.length === 0" class="no-tasks">No tasks added to checklist.</li>
                </ul>
              </div>

              <!-- COMPLETE JOB -->
              <div *ngIf="selectedWo.status === 'IN_PROGRESS'" class="action-box">
                <h4>Completion Registry</h4>
                <form [formGroup]="completionForm" (ngSubmit)="completeJob(selectedWo.id)">
                  <div class="form-group">
                    <label>Completion Act Notes</label>
                    <textarea formControlName="notes" rows="3" placeholder="Enter findings & repair descriptions..."></textarea>
                  </div>
                  <button type="submit" [disabled]="completionForm.invalid" class="btn btn-success w-full">Complete WO</button>
                </form>
              </div>

              <!-- HISTORY LOG -->
              <div class="action-box history-box">
                <h4>History Logs</h4>
                <ul class="history-list">
                  <li *ngFor="let h of history">
                    <span class="hist-time">{{ h.createdAt | date:'HH:mm' }}</span> - 
                    <strong>{{ h.eventType }}</strong>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div class="drawer-placeholder" *ngIf="!selectedWo">
            <p>Select a Work Order from the registry to manage technicians, checklist tasks, and submit completion acts.</p>
          </div>
        </div>

        <!-- PM SCHEDULES TAB -->
        <div *ngIf="activeTab === 'pm_schedules'">
          <div class="pm-container">
            <header class="section-header flex justify-between align-center">
              <div>
                <h2>Preventive Maintenance Schedules</h2>
                <p>Register schedules and trigger automated Work Order runs.</p>
              </div>
              <button (click)="generateDue()" class="btn btn-primary">Run PM Scheduler</button>
            </header>

            <form [formGroup]="pmForm" (ngSubmit)="createPm()" class="create-card">
              <h3>Register PM Schedule</h3>
              <div class="form-row">
                <input type="text" formControlName="equipmentId" placeholder="Equipment UUID" />
                <input type="text" formControlName="name" placeholder="Schedule Name" />
                <input type="date" formControlName="nextDueDate" />
              </div>
              <div class="form-row select-row">
                <select formControlName="frequencyType">
                  <option value="DAYS">Days</option>
                  <option value="WEEKS">Weeks</option>
                  <option value="MONTHS">Months</option>
                </select>
                <input type="number" formControlName="frequencyValue" placeholder="Frequency Value (e.g. 30)" />
                <button type="submit" [disabled]="pmForm.invalid" class="btn btn-success">Save PM</button>
              </div>
            </form>

            <div class="table-container">
              <table class="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Asset ID</th>
                    <th>Frequency</th>
                    <th>Next Due Date</th>
                    <th>Last Gen Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let pm of pmSchedules">
                    <td><strong>{{ pm.name }}</strong></td>
                    <td class="mono font-xs">{{ pm.equipmentId }}</td>
                    <td>Every {{ pm.frequencyValue }} {{ pm.frequencyType.toLowerCase() }}</td>
                    <td>{{ pm.nextDueDate }}</td>
                    <td>{{ pm.lastGeneratedDate ?? 'Never' }}</td>
                    <td>
                      <span class="status-tag" [class.active]="pm.isActive" [class.inactive]="!pm.isActive">
                        {{ pm.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                  </tr>
                  <tr *ngIf="pmSchedules.length === 0">
                    <td colspan="6" class="no-data">No preventive maintenance schedules registered yet.</td>
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
    .mms-dashboard { display: flex; flex-direction: column; gap: 20px; }
    .tab-navigation { display: flex; gap: 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    .tab-navigation button {
      background: none; border: none; padding: 10px 16px; font-size: 1rem;
      font-weight: 600; color: #64748b; cursor: pointer; border-radius: 6px; transition: all 0.2s;
    }
    .tab-navigation button:hover { background: #f1f5f9; color: #334155; }
    .tab-navigation button.active { background: #0284c7; color: white; }
    
    .layout-grid { display: grid; grid-template-columns: 1fr 450px; gap: 24px; align-items: start; }
    @media (max-width: 1024px) { .layout-grid { grid-template-columns: 1fr; } }
    
    .list-section { display: flex; flex-direction: column; gap: 20px; }
    .section-header h2 { margin: 0; color: #0f172a; }
    .section-header p { margin: 4px 0 0 0; color: #64748b; font-size: 0.95rem; }
    
    .create-card { background: white; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; }
    .create-card h3 { margin: 0 0 12px 0; font-size: 1rem; color: #475569; }
    .form-row { display: flex; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
    .form-row input, .form-row select { flex: 1; min-width: 180px; padding: 10px 12px; border-radius: 6px; border: 1px solid #cbd5e1; font-family: inherit; font-size: 0.9rem; }
    .select-row { align-items: center; }
    .w-full { width: 100%; }
    
    .btn { padding: 8px 16px; border-radius: 6px; font-weight: 600; border: none; cursor: pointer; font-family: inherit; transition: all 0.2s ease; }
    .btn-primary { background: #0284c7; color: white; }
    .btn-primary:hover { background: #0369a1; }
    .btn-success { background: #16a34a; color: white; }
    .btn-success:hover { background: #15803d; }
    .btn-secondary { background: #f1f5f9; color: #475569; }
    .btn-secondary:hover { background: #e2e8f0; }
    .btn-danger { background: #dc2626; color: white; }
    .btn-danger:hover { background: #b91c1c; }
    .btn-sm { padding: 6px 10px; font-size: 0.8rem; }
    .btn-xs { padding: 4px 8px; font-size: 0.75rem; border-radius: 4px; }
    
    .error-msg { color: #dc2626; margin-top: 8px; font-size: 0.9rem; }
    .table-container { background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    .table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
    .table th, .table td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; }
    .table th { background: #f8fafc; color: #64748b; font-weight: 600; }
    
    .clickable-row { cursor: pointer; transition: background 0.15s; }
    .clickable-row:hover { background: #f8fafc; }
    .clickable-row.selected { background: #f0f9ff; }
    
    .status-tag { font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 9999px; text-transform: uppercase; }
    .status-tag.open { background: #fee2e2; color: #991b1b; }
    .status-tag.assigned { background: #fef3c7; color: #d97706; }
    .status-tag.in_progress { background: #e0f2fe; color: #0369a1; }
    .status-tag.completed { background: #d1fae5; color: #065f46; }
    .status-tag.cancelled { background: #f1f5f9; color: #475569; }
    .status-tag.active { background: #d1fae5; color: #065f46; }
    .status-tag.inactive { background: #fee2e2; color: #991b1b; }
    
    .type-tag { font-size: 0.8rem; background: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px; }
    .priority-tag { font-size: 0.8rem; font-weight: 600; }
    .priority-tag.low { color: #64748b; }
    .priority-tag.medium { color: #f59e0b; }
    .priority-tag.high { color: #ea580c; }
    .priority-tag.critical { color: #dc2626; }
    
    .drawer-card { background: white; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 16px; }
    .drawer-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; }
    .details-body { font-size: 0.85rem; color: #475569; display: flex; flex-direction: column; gap: 6px; }
    .details-body p { margin: 0; }
    .mono { font-family: monospace; color: #0f172a; }
    .font-xs { font-size: 0.75rem; }
    
    .action-box { background: #f8fafc; border-radius: 8px; padding: 12px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 8px; }
    .action-box h4 { margin: 0 0 4px 0; font-size: 0.9rem; color: #475569; }
    .assign-form { display: flex; gap: 8px; }
    .notes-input { padding: 6px 10px; border-radius: 4px; border: 1px solid #cbd5e1; font-size: 0.8rem; width: 100%; box-sizing: border-box; font-family: inherit; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-group label { font-size: 0.8rem; font-weight: 600; color: #475569; }
    .form-group textarea { padding: 8px; border-radius: 4px; border: 1px solid #cbd5e1; font-family: inherit; font-size: 0.85rem; }
    
    .task-add { display: flex; gap: 8px; }
    .task-list { list-style: none; padding: 0; margin: 8px 0 0 0; display: flex; flex-direction: column; gap: 6px; }
    .task-list li { display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; background: white; padding: 6px 10px; border-radius: 4px; border: 1px solid #e2e8f0; }
    .task-list li.completed { background: #f0fdf4; border-color: #bbf7d0; text-decoration: line-through; color: #16a34a; }
    .no-tasks { font-style: italic; color: #64748b; font-size: 0.8rem; text-align: center; }
    
    .history-list { list-style: none; padding: 0; margin: 4px 0 0 0; display: flex; flex-direction: column; gap: 4px; font-size: 0.75rem; color: #64748b; }
    .hist-time { font-family: monospace; color: #94a3b8; }
    
    .drawer-placeholder { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 40px 20px; text-align: center; color: #64748b; }
    .pm-container { display: flex; flex-direction: column; gap: 20px; }
    .flex { display: flex; }
    .justify-between { justify-content: space-between; }
    .align-center { align-items: center; }
    .text-center { text-align: center; }
    .no-data { text-align: center; color: #64748b; font-style: italic; padding: 20px; }
  `]
})
export class MmsPageComponent implements OnInit {
  activeTab: 'work_orders' | 'pm_schedules' = 'work_orders';
  workOrders: WorkOrder[] = [];
  selectedWo?: WorkOrder;
  tasks: WorkOrderTask[] = [];
  history: MaintenanceHistory[] = [];

  pmSchedules: any[] = [];

  loading = false;
  submitting = false;
  error = '';

  readonly createForm = this.fb.group({
    woNumber: ['', [Validators.required, Validators.maxLength(64)]],
    equipmentId: ['', [Validators.required]],
    title: ['', [Validators.required, Validators.maxLength(255)]],
    type: ['CORRECTIVE', Validators.required],
    priority: ['MEDIUM', Validators.required]
  });

  readonly completionForm = this.fb.group({
    notes: ['', Validators.required]
  });

  readonly pmForm = this.fb.group({
    equipmentId: ['', Validators.required],
    name: ['', [Validators.required, Validators.maxLength(255)]],
    frequencyType: ['DAYS', Validators.required],
    frequencyValue: [30, [Validators.required, Validators.min(1)]],
    nextDueDate: ['', Validators.required]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly mmsService: MmsService
  ) {}

  ngOnInit(): void {
    this.loadWorkOrders();
    this.loadPmSchedules();
  }

  loadWorkOrders(): void {
    this.loading = true;
    this.mmsService.getWorkOrders().subscribe({
      next: (res) => {
        this.workOrders = res.data.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        this.loading = false;
        if (this.selectedWo) {
          const updated = this.workOrders.find(w => w.id === this.selectedWo?.id);
          this.selectedWo = updated;
        }
      },
      error: () => this.loading = false
    });
  }

  loadPmSchedules(): void {
    this.mmsService.getPmSchedules().subscribe({
      next: (res) => {
        this.pmSchedules = res.data;
      }
    });
  }

  selectWo(wo: WorkOrder): void {
    this.selectedWo = wo;
    this.loadWoSubDetails(wo.id);
  }

  loadWoSubDetails(workOrderId: string): void {
    this.mmsService.getTasks(workOrderId).subscribe({
      next: (res) => this.tasks = res.data
    });
    this.mmsService.getHistory(workOrderId).subscribe({
      next: (res) => this.history = res.data
    });
  }

  createWo(): void {
    if (this.createForm.invalid) return;
    this.submitting = true;
    this.error = '';
    const payload = {
      woNumber: this.createForm.controls.woNumber.value ?? '',
      equipmentId: this.createForm.controls.equipmentId.value ?? '',
      title: this.createForm.controls.title.value ?? '',
      type: this.createForm.controls.type.value ?? '',
      priority: this.createForm.controls.priority.value ?? ''
    };

    this.mmsService.createWorkOrder(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.createForm.reset({ type: 'CORRECTIVE', priority: 'MEDIUM' });
        this.loadWorkOrders();
      },
      error: (err) => {
        this.submitting = false;
        this.error = err?.error?.message ?? 'Failed to create work order.';
      }
    });
  }

  assign(id: string, technicianId: string): void {
    if (!technicianId) return;
    this.mmsService.assignWorkOrder(id, { technicianId }).subscribe({
      next: () => {
        this.loadWorkOrders();
        this.selectWo(this.selectedWo!);
      },
      error: (err) => alert(err?.error?.message ?? 'Failed to assign work order.')
    });
  }

  startWork(id: string): void {
    this.mmsService.startWorkOrder(id).subscribe({
      next: () => {
        this.loadWorkOrders();
        this.selectWo(this.selectedWo!);
      },
      error: (err) => alert(err?.error?.message ?? 'Failed to start work order.')
    });
  }

  addTask(workOrderId: string, title: string): void {
    if (!title) return;
    this.mmsService.addTask(workOrderId, { title }).subscribe({
      next: () => this.loadWoSubDetails(workOrderId)
    });
  }

  completeTask(taskId: string): void {
    this.mmsService.completeTask(taskId).subscribe({
      next: () => this.loadWoSubDetails(this.selectedWo!.id)
    });
  }

  completeJob(id: string): void {
    if (this.completionForm.invalid) return;
    const notes = this.completionForm.controls.notes.value ?? '';
    const act = JSON.stringify({
      workOrderId: id,
      completedAt: new Date().toISOString(),
      notes: notes,
      taskResults: this.tasks.map(t => ({ taskId: t.id, status: t.status }))
    });

    this.mmsService.completeWorkOrder(id, { completionAct: act, completionNotes: notes }).subscribe({
      next: () => {
        this.completionForm.reset();
        this.loadWorkOrders();
        this.selectedWo = undefined;
      },
      error: (err) => alert(err?.error?.message ?? 'Failed to complete work order.')
    });
  }

  createPm(): void {
    if (this.pmForm.invalid) return;
    const payload = {
      equipmentId: this.pmForm.controls.equipmentId.value ?? '',
      name: this.pmForm.controls.name.value ?? '',
      frequencyType: this.pmForm.controls.frequencyType.value ?? '',
      frequencyValue: this.pmForm.controls.frequencyValue.value ?? 30,
      nextDueDate: this.pmForm.controls.nextDueDate.value ?? ''
    };

    this.mmsService.createPmSchedule(payload).subscribe({
      next: () => {
        this.pmForm.reset({ frequencyType: 'DAYS', frequencyValue: 30 });
        this.loadPmSchedules();
      },
      error: (err) => alert(err?.error?.message ?? 'Failed to create PM schedule.')
    });
  }

  generateDue(): void {
    this.mmsService.generateDuePmWorkOrders().subscribe({
      next: (res) => {
        alert(`Successfully generated ${res.data} due preventive work orders.`);
        this.loadWorkOrders();
        this.loadPmSchedules();
      },
      error: (err) => alert(err?.error?.message ?? 'Failed to trigger schedule generation.')
    });
  }
}
