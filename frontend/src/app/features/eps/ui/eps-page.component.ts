import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EpsService } from '../data/eps.service';
import { CreateEquipmentRequest, Equipment } from '../data/eps.models';
import { EpsDocumentsComponent } from './eps-documents.component';
import { EpsChangeRequestsComponent } from './eps-change-requests.component';

@Component({
  selector: 'mro-eps-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, EpsDocumentsComponent, EpsChangeRequestsComponent],
  template: `
    <div class="eps-dashboard">
      <nav class="tab-navigation">
        <button (click)="activeTab = 'registry'" [class.active]="activeTab === 'registry'">
          Equipment Registry
        </button>
        <button (click)="activeTab = 'requests'" [class.active]="activeTab === 'requests'">
          Change Requests
        </button>
      </nav>

      <main class="tab-content">
        <!-- REGISTRY TAB -->
        <div *ngIf="activeTab === 'registry'" class="registry-grid">
          <div class="registry-list-section">
            <header class="section-header">
              <h2>Equipment Registry</h2>
              <p>Add and view physical assets and their technical passports.</p>
            </header>

            <form class="form-card" [formGroup]="form" (ngSubmit)="create()">
              <h3>Register Asset</h3>
              <div class="form-grid">
                <input type="text" formControlName="assetTag" placeholder="Asset Tag (e.g. EQ-100)" />
                <input type="text" formControlName="name" placeholder="Asset Name" />
                <input type="text" formControlName="category" placeholder="Category" />
              </div>
              <button type="submit" [disabled]="form.invalid || submitting" class="btn btn-primary">
                {{ submitting ? 'Saving...' : 'Register' }}
              </button>
              <p *ngIf="error" class="error">{{ error }}</p>
            </form>

            <div class="table-container">
              <table class="table">
                <thead>
                  <tr>
                    <th>Asset Tag</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of equipment" 
                      [class.selected]="selectedEquipment?.id === item.id"
                      (click)="selectEquipment(item)"
                      class="clickable-row">
                    <td><strong>{{ item.assetTag }}</strong></td>
                    <td>{{ item.name }}</td>
                    <td>{{ item.category }}</td>
                    <td><span class="status-tag active">{{ item.status }}</span></td>
                    <td>
                      <button (click)="selectEquipment(item); $event.stopPropagation()" class="btn btn-secondary btn-sm">
                        View Documents
                      </button>
                    </td>
                  </tr>
                  <tr *ngIf="equipment.length === 0">
                    <td colspan="5" class="no-data">No equipment registered yet.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- DOCUMENT SIDE PANEL -->
          <div class="registry-detail-section" *ngIf="selectedEquipment">
            <mro-eps-documents [equipment]="selectedEquipment"></mro-eps-documents>
          </div>
          <div class="registry-detail-placeholder" *ngIf="!selectedEquipment">
            <p>Select an asset from the list to manage its documents & passports.</p>
          </div>
        </div>

        <!-- CHANGE REQUESTS TAB -->
        <div *ngIf="activeTab === 'requests'">
          <mro-eps-change-requests></mro-eps-change-requests>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .eps-dashboard {
      display: flex;
      flex-direction: column;
      gap: 20px;
      font-family: inherit;
    }
    .tab-navigation {
      display: flex;
      gap: 8px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 8px;
    }
    .tab-navigation button {
      background: none;
      border: none;
      padding: 10px 16px;
      font-size: 1rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.2s;
    }
    .tab-navigation button:hover {
      background: #f1f5f9;
      color: #334155;
    }
    .tab-navigation button.active {
      background: #0284c7;
      color: white;
    }
    .registry-grid {
      display: grid;
      grid-template-columns: 1fr 450px;
      gap: 24px;
      align-items: start;
    }
    @media (max-width: 1024px) {
      .registry-grid {
        grid-template-columns: 1fr;
      }
    }
    .registry-list-section {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .section-header h2 {
      margin: 0;
      color: #0f172a;
    }
    .section-header p {
      margin: 4px 0 0 0;
      color: #64748b;
      font-size: 0.95rem;
    }
    .form-card {
      background: #ffffff;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
      border: 1px solid #e2e8f0;
    }
    .form-card h3 {
      margin: 0 0 12px 0;
      font-size: 1rem;
      color: #475569;
    }
    .form-grid {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    .form-grid input {
      flex: 1;
      min-width: 180px;
      padding: 10px 12px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      font-size: 0.9rem;
      font-family: inherit;
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
    .btn-primary:disabled { background: #94a3b8; cursor: not-allowed; }
    .btn-secondary { background: #f1f5f9; color: #475569; }
    .btn-secondary:hover { background: #e2e8f0; }
    .btn-sm { padding: 6px 10px; font-size: 0.8rem; }
    .error { color: #dc2626; margin-top: 8px; font-size: 0.9rem; }
    .table-container {
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.9rem;
    }
    .table th, .table td {
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
    }
    .table th {
      background: #f8fafc;
      color: #64748b;
      font-weight: 600;
    }
    .clickable-row {
      cursor: pointer;
      transition: background 0.15s;
    }
    .clickable-row:hover {
      background: #f8fafc;
    }
    .clickable-row.selected {
      background: #f0f9ff;
    }
    .status-tag {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 9999px;
      text-transform: uppercase;
    }
    .status-tag.active {
      background: #d1fae5;
      color: #065f46;
    }
    .no-data {
      text-align: center;
      color: #64748b;
      font-style: italic;
      padding: 20px;
    }
    .registry-detail-placeholder {
      background: #f8fafc;
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
      padding: 40px 20px;
      text-align: center;
      color: #64748b;
    }
  `]
})
export class EpsPageComponent implements OnInit {
  activeTab: 'registry' | 'requests' = 'registry';
  equipment: Equipment[] = [];
  selectedEquipment?: Equipment;
  loading = false;
  submitting = false;
  error = '';

  readonly form = this.fb.group({
    assetTag: ['', [Validators.required, Validators.maxLength(64)]],
    name: ['', [Validators.required, Validators.maxLength(255)]],
    category: ['', [Validators.required, Validators.maxLength(128)]]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly epsService: EpsService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.epsService.getEquipment().subscribe({
      next: (res) => {
        this.equipment = res.data;
        this.loading = false;
        // Keep selection active if it still exists
        if (this.selectedEquipment) {
          const updated = this.equipment.find(e => e.id === this.selectedEquipment?.id);
          this.selectedEquipment = updated;
        }
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'Failed to load equipment.';
        this.loading = false;
      }
    });
  }

  selectEquipment(item: Equipment): void {
    this.selectedEquipment = item;
  }

  create(): void {
    if (this.form.invalid) return;
    const payload: CreateEquipmentRequest = {
      assetTag: this.form.controls.assetTag.value ?? '',
      name: this.form.controls.name.value ?? '',
      category: this.form.controls.category.value ?? ''
    };
    this.submitting = true;
    this.error = '';
    this.epsService.createEquipment(payload).subscribe({
      next: () => {
        this.form.reset();
        this.submitting = false;
        this.load();
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'Failed to create equipment.';
        this.submitting = false;
      }
    });
  }
}
