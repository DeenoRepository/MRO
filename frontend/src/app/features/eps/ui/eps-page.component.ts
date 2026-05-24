import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EpsService } from '../data/eps.service';
import { CreateEquipmentRequest, Equipment } from '../data/eps.models';

@Component({
  selector: 'mro-eps-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="layout">
      <header>
        <h2>EPS Equipment</h2>
        <p>Create and view equipment records.</p>
      </header>

      <form class="form" [formGroup]="form" (ngSubmit)="create()">
        <input type="text" formControlName="assetTag" placeholder="Asset Tag" />
        <input type="text" formControlName="name" placeholder="Name" />
        <input type="text" formControlName="category" placeholder="Category" />
        <button type="submit" [disabled]="form.invalid || submitting">
          {{ submitting ? 'Saving...' : 'Create' }}
        </button>
      </form>

      <p *ngIf="error" class="error">{{ error }}</p>
      <p *ngIf="loading">Loading equipment...</p>

      <table *ngIf="!loading" class="table">
        <thead>
        <tr>
          <th>Asset Tag</th>
          <th>Name</th>
          <th>Category</th>
          <th>Status</th>
        </tr>
        </thead>
        <tbody>
        <tr *ngFor="let item of equipment">
          <td>{{ item.assetTag }}</td>
          <td>{{ item.name }}</td>
          <td>{{ item.category }}</td>
          <td>{{ item.status }}</td>
        </tr>
        <tr *ngIf="equipment.length === 0">
          <td colspan="4">No equipment yet.</td>
        </tr>
        </tbody>
      </table>
    </section>
  `,
  styles: [`
    .layout { display: grid; gap: 16px; }
    .form { display: flex; gap: 8px; flex-wrap: wrap; }
    input { padding: 8px; min-width: 180px; }
    button { padding: 8px 12px; }
    .error { color: #b00020; }
    .table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
  `]
})
export class EpsPageComponent implements OnInit {
  equipment: Equipment[] = [];
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
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'Failed to load equipment.';
        this.loading = false;
      }
    });
  }

  create(): void {
    if (this.form.invalid) {
      return;
    }
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
