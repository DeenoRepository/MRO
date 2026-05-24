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
          <div
            class="form-group dropzone"
            [class.drag-active]="dragActive"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event)"
          >
            <input type="file" (change)="onFileSelected($event)" #fileInput />
            <p *ngIf="!selectedFile">Drag file here or click input</p>
            <p *ngIf="selectedFile">Selected: {{ selectedFile.name }}</p>
          </div>
          <div class="form-group extracted-text-group">
            <textarea
              rows="3"
              formControlName="extractedText"
              placeholder="Optional extracted OCR text for in-document search"
            ></textarea>
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
                <button class="btn btn-secondary btn-sm" (click)="previewDocument(doc)">Preview</button>
                <a [href]="downloadUrl(doc)" class="download-link" target="_blank">Download</a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="preview-section" *ngIf="previewDoc">
        <div class="preview-header">
          <h4>Preview: {{ previewDoc.fileName }}</h4>
          <button class="btn btn-secondary btn-sm" (click)="closePreview()">Close</button>
        </div>
        <img
          *ngIf="isImage(previewDoc.fileName)"
          [src]="downloadUrl(previewDoc)"
          alt="Document preview"
          class="preview-image"
        />
        <iframe
          *ngIf="isPdf(previewDoc.fileName)"
          [src]="downloadUrl(previewDoc)"
          class="preview-frame"
          title="PDF preview"
        ></iframe>
        <div *ngIf="!isImage(previewDoc.fileName) && !isPdf(previewDoc.fileName)" class="preview-fallback">
          Preview is not available for this file type. Use Download.
        </div>
        <div class="ocr-snippet" *ngIf="previewDoc.extractedTextSnippet">
          <h5>Extracted Text Snippet</h5>
          <p>{{ previewDoc.extractedTextSnippet }}</p>
        </div>
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
    .dropzone {
      min-width: 240px;
      border: 1px dashed #94a3b8;
      background: #ffffff;
      border-radius: 8px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .dropzone.drag-active {
      border-color: #0284c7;
      background: #f0f9ff;
    }
    .dropzone p {
      margin: 0;
      color: #64748b;
      font-size: 0.8rem;
    }
    .extracted-text-group {
      width: 100%;
    }
    .extracted-text-group textarea {
      width: 100%;
      resize: vertical;
      min-height: 64px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
      font-family: inherit;
      font-size: 0.85rem;
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
      margin-left: 8px;
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
    .preview-section {
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .preview-image {
      width: 100%;
      max-height: 340px;
      object-fit: contain;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #f8fafc;
    }
    .preview-frame {
      width: 100%;
      min-height: 360px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #ffffff;
    }
    .preview-fallback {
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      padding: 16px;
      color: #64748b;
      font-size: 0.9rem;
      background: #f8fafc;
    }
    .ocr-snippet {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
    }
    .ocr-snippet h5 {
      margin: 0 0 8px 0;
      color: #334155;
      font-size: 0.85rem;
    }
    .ocr-snippet p {
      margin: 0;
      color: #475569;
      font-size: 0.85rem;
      line-height: 1.4;
      white-space: pre-wrap;
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
  dragActive = false;
  previewDoc?: EquipmentDocument;

  readonly uploadForm = this.fb.group({
    documentType: ['', Validators.required],
    extractedText: ['']
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
      this.previewDoc = undefined;
      this.uploadForm.reset({ documentType: '', extractedText: '' });
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

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragActive = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragActive = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragActive = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  previewDocument(doc: EquipmentDocument): void {
    this.previewDoc = doc;
  }

  closePreview(): void {
    this.previewDoc = undefined;
  }

  downloadUrl(doc: EquipmentDocument): string {
    return `/api/v1/eps/equipment/documents/${doc.id}/download`;
  }

  isImage(fileName: string): boolean {
    return /\.(png|jpg|jpeg|gif|webp|bmp)$/i.test(fileName);
  }

  isPdf(fileName: string): boolean {
    return /\.pdf$/i.test(fileName);
  }

  upload(): void {
    if (this.uploadForm.invalid || !this.selectedFile || !this.equipment) return;
    this.uploading = true;
    this.uploadError = '';
    this.uploadSuccess = false;

    const docType = this.uploadForm.controls.documentType.value ?? '';
    const extractedText = this.uploadForm.controls.extractedText.value ?? '';

    this.epsService.uploadEquipmentDocument(this.equipment.id, docType, this.selectedFile, extractedText).subscribe({
      next: () => {
        this.uploading = false;
        this.uploadSuccess = true;
        this.selectedFile = null;
        this.uploadForm.reset({ documentType: '', extractedText: '' });
        this.loadDocuments();
      },
      error: (err) => {
        this.uploading = false;
        this.uploadError = err?.error?.message ?? 'Failed to upload file.';
      }
    });
  }
}
