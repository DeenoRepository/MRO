import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EpsService } from '../data/eps.service';
import { Equipment, EquipmentDocument } from '../data/eps.models';

@Component({
  selector: 'mro-eps-documents',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="documents-card">
      <div class="card-header">
        <h3>Documents for: <span class="eq-name">{{ equipment?.name }}</span></h3>
        <span class="badge">{{ equipment?.assetTag }}</span>
      </div>

      <div class="upload-section">
        <h4>Upload New Document</h4>
        <form [formGroup]="uploadForm" (ngSubmit)="upload()" class="upload-form">
          <div class="form-group">
            <select formControlName="documentType">
              <option value="" disabled selected>Select Type</option>
              <option value="MANUAL">Technical Manual</option>
              <option value="WARRANTY">Warranty Card</option>
              <option value="CONTRACT">Purchase Contract</option>
              <option value="OTHER">Other Documentation</option>
            </select>
          </div>
          <div class="form-group file-input-group">
            <input type="file" (change)="onFileSelected($event)" #fileInput />
          </div>
          <button type="submit" [disabled]="uploadForm.invalid || !selectedFile || uploading" class="btn btn-primary">
            {{ uploading ? 'Uploading...' : 'Upload' }}
          </button>
        </form>
        <p *ngIf="uploadError" class="error-msg">{{ uploadError }}</p>
        <p *ngIf="uploadSuccess" class="success-msg">Document uploaded successfully!</p>
      </div>

      <div class="list-section">
        <h4>Existing Documents</h4>
        <div *ngIf="loading" class="loading">Loading documents...</div>
        <div *ngIf="!loading && documents.length === 0" class="no-data">No documents uploaded for this asset.</div>

        <table *ngIf="!loading && documents.length > 0" class="docs-table">
          <thead>
            <tr>
              <th>Filename</th>
              <th>Type</th>
              <th>Version</th>
              <th>SHA-256 Checksum</th>
              <th>Uploaded At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let doc of documents">
              <td class="filename">{{ doc.fileName }}</td>
              <td><span class="type-tag">{{ doc.documentType }}</span></td>
              <td>v{{ doc.version }}</td>
              <td class="hash" [title]="doc.checksumSha256">{{ doc.checksumSha256.substring(0, 8) }}...</td>
              <td>{{ doc.uploadedAt | date:'yyyy-MM-dd HH:mm' }}</td>
              <td>
                <a [href]="'/api/v1/eps/equipment/documents/' + doc.id + '/download'" class="download-link" target="_blank">
                  Download
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .documents-card {
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      border: 1px solid #eef2f6;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 12px;
    }
    .card-header h3 {
      margin: 0;
      color: #1e293b;
      font-size: 1.25rem;
    }
    .eq-name {
      color: #0284c7;
      font-weight: 700;
    }
    .badge {
      background: #e0f2fe;
      color: #0369a1;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 600;
    }
    h4 {
      margin: 0 0 12px 0;
      color: #475569;
      font-size: 1rem;
      font-weight: 600;
    }
    .upload-section {
      background: #f8fafc;
      border-radius: 8px;
      padding: 16px;
      border: 1px dashed #cbd5e1;
    }
    .upload-form {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }
    .form-group select {
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      font-family: inherit;
    }
    .file-input-group input {
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
    .btn-primary {
      background: #0284c7;
      color: white;
    }
    .btn-primary:hover {
      background: #0369a1;
    }
    .btn-primary:disabled {
      background: #94a3b8;
      cursor: not-allowed;
    }
    .error-msg { color: #dc2626; margin: 8px 0 0 0; font-size: 0.9rem; }
    .success-msg { color: #16a34a; margin: 8px 0 0 0; font-size: 0.9rem; }
    .docs-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.9rem;
    }
    .docs-table th, .docs-table td {
      padding: 12px;
      border-bottom: 1px solid #f1f5f9;
    }
    .docs-table th {
      background: #f8fafc;
      color: #64748b;
      font-weight: 600;
    }
    .filename {
      font-weight: 600;
      color: #334155;
    }
    .type-tag {
      background: #f1f5f9;
      color: #475569;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
    }
    .hash {
      font-family: monospace;
      color: #64748b;
    }
    .download-link {
      color: #0284c7;
      text-decoration: none;
      font-weight: 600;
    }
    .download-link:hover {
      text-decoration: underline;
    }
    .loading, .no-data {
      padding: 20px;
      text-align: center;
      color: #64748b;
      font-style: italic;
    }
  `]
})
export class EpsDocumentsComponent implements OnChanges {
  @Input() equipment?: Equipment;

  documents: EquipmentDocument[] = [];
  loading = false;
  uploading = false;
  uploadError = '';
  uploadSuccess = false;
  selectedFile: File | null = null;

  readonly uploadForm = this.fb.group({
    documentType: ['', Validators.required]
  });

  constructor(
      private readonly fb: FormBuilder,
      private readonly epsService: EpsService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['equipment'] && this.equipment) {
      this.loadDocuments();
      this.uploadSuccess = false;
      this.uploadError = '';
      this.selectedFile = null;
      this.uploadForm.reset({ documentType: '' });
    }
  }

  loadDocuments(): void {
    if (!this.equipment) return;
    this.loading = true;
    this.epsService.getEquipmentDocuments(this.equipment.id).subscribe({
      next: (res) => {
        this.documents = res.data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  upload(): void {
    if (this.uploadForm.invalid || !this.selectedFile || !this.equipment) return;
    this.uploading = true;
    this.uploadError = '';
    this.uploadSuccess = false;

    const docType = this.uploadForm.controls.documentType.value ?? '';

    this.epsService.uploadEquipmentDocument(this.equipment.id, docType, this.selectedFile).subscribe({
      next: () => {
        this.uploading = false;
        this.uploadSuccess = true;
        this.selectedFile = null;
        this.uploadForm.reset({ documentType: '' });
        this.loadDocuments();
      },
      error: (err) => {
        this.uploading = false;
        this.uploadError = err?.error?.message ?? 'Failed to upload file.';
      }
    });
  }
}
