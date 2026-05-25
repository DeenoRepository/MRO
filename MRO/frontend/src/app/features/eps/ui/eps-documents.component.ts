import { HttpEventType } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
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
            <input id="document-upload-input" class="file-input-hidden" type="file" (change)="onFileSelected($event)" />
            <label for="document-upload-input" class="file-select-btn">Choose File</label>
            <p *ngIf="!selectedFile">Drag and drop a file here or choose a file.</p>
            <p *ngIf="selectedFile">Selected file: {{ selectedFile.name }}</p>
            <p class="file-hint">Allowed types: PDF, PNG, JPG, DOCX. Max size: per server policy.</p>
            <p *ngIf="selectedFileChecksum" class="checksum-line">SHA-256: {{ selectedFileChecksum.substring(0, 16) }}...</p>
            <p *ngIf="duplicateChecksumDetected" class="warning-msg">Duplicate checksum detected in existing versions.</p>
          </div>
          <div class="form-group extracted-text-group">
            <textarea
              rows="3"
              formControlName="extractedText"
              placeholder="Optional extracted OCR text for in-document search"
            ></textarea>
          </div>
          <button type="submit" [disabled]="uploadForm.invalid || !selectedFile || uploading || duplicateChecksumDetected" class="btn btn-primary">
            {{ uploading ? 'Uploading...' : 'Upload' }}
          </button>
        </form>

        <div class="progress-wrap" *ngIf="uploading">
          <div class="progress-label">Upload progress: {{ uploadProgress }}%</div>
          <div class="progress-track">
            <div class="progress-bar" [style.width.%]="uploadProgress"></div>
          </div>
        </div>

        <p *ngIf="uploadError" class="error-msg">{{ uploadError }}</p>
        <p *ngIf="uploadSuccess" class="success-msg">Document uploaded successfully!</p>
      </div>

      <div class="list-section">
        <h4>Existing Documents</h4>
        <div *ngIf="loading" class="loading">Loading documents...</div>
        <div *ngIf="!loading && loadError" class="error-msg">{{ loadError }}</div>
        <div *ngIf="!loading && documents.length === 0" class="no-data">No documents uploaded for this asset.</div>

        <div class="docs-table-wrap" *ngIf="!loading && documents.length > 0">
          <table class="docs-table">
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
                <td class="filename" [title]="doc.fileName">{{ doc.fileName }}</td>
                <td><span class="type-tag">{{ doc.documentType }}</span></td>
                <td>v{{ doc.version }}</td>
                <td class="hash" [title]="doc.checksumSha256">{{ doc.checksumSha256.substring(0, 12) }}...</td>
                <td class="uploaded-at">{{ doc.uploadedAt | date: 'yyyy-MM-dd HH:mm' }}</td>
                <td class="doc-actions">
                  <button class="btn btn-secondary btn-sm" (click)="previewDocument(doc)">Preview</button>
                  <button class="btn btn-secondary btn-sm" (click)="setCompareBase(doc)">Compare</button>
                  <a [href]="downloadUrl(doc)" class="download-link" target="_blank">Download</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="compare-section" *ngIf="compareBaseDoc">
        <div class="preview-header">
          <h4>Version Compare: base v{{ compareBaseDoc.version }}</h4>
          <button class="btn btn-secondary btn-sm" (click)="clearCompare()">Clear</button>
        </div>
        <div class="compare-picker">
          <label>Compare with:</label>
          <select [value]="compareTargetId" (change)="setCompareTarget($any($event.target).value)">
            <option value="">Select version</option>
            <option *ngFor="let doc of compareCandidates" [value]="doc.id">v{{ doc.version }} - {{ doc.fileName }}</option>
          </select>
        </div>
        <div class="compare-grid" *ngIf="compareTargetDoc">
          <div class="compare-col">
            <h5>Base</h5>
            <p><strong>Filename:</strong> {{ compareBaseDoc.fileName }}</p>
            <p><strong>Type:</strong> {{ compareBaseDoc.documentType }}</p>
            <p><strong>Checksum:</strong> <span class="hash">{{ compareBaseDoc.checksumSha256.substring(0, 16) }}...</span></p>
            <p><strong>Uploaded:</strong> {{ compareBaseDoc.uploadedAt | date: 'medium' }}</p>
          </div>
          <div class="compare-col">
            <h5>Target</h5>
            <p [class.changed]="compareBaseDoc.fileName !== compareTargetDoc.fileName"><strong>Filename:</strong> {{ compareTargetDoc.fileName }}</p>
            <p [class.changed]="compareBaseDoc.documentType !== compareTargetDoc.documentType"><strong>Type:</strong> {{ compareTargetDoc.documentType }}</p>
            <p [class.changed]="compareBaseDoc.checksumSha256 !== compareTargetDoc.checksumSha256">
              <strong>Checksum:</strong> <span class="hash">{{ compareTargetDoc.checksumSha256.substring(0, 16) }}...</span>
            </p>
            <p><strong>Uploaded:</strong> {{ compareTargetDoc.uploadedAt | date: 'medium' }}</p>
          </div>
        </div>
      </div>

      <div class="preview-section" *ngIf="previewDoc">
        <div class="preview-header">
          <h4>Preview: {{ previewDoc.fileName }}</h4>
          <button class="btn btn-secondary btn-sm" (click)="closePreview()">Close</button>
        </div>
        <img *ngIf="isImage(previewDoc.fileName)" [src]="downloadUrl(previewDoc)" alt="Document preview" class="preview-image" />
        <iframe *ngIf="isPdf(previewDoc.fileName)" [src]="downloadUrl(previewDoc)" class="preview-frame" title="PDF preview"></iframe>
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
    .documents-card { background: #fff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,.05); border: 1px solid #eef2f6; padding: 24px; display: flex; flex-direction: column; gap: 20px; }
    .card-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; }
    .card-header h3 { margin: 0; color: #1e293b; font-size: 1.25rem; }
    .eq-name { color: #0284c7; font-weight: 700; }
    .badge { background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 9999px; font-size: .85rem; font-weight: 600; }
    h4 { margin: 0 0 12px 0; color: #475569; font-size: 1rem; font-weight: 600; }
    .upload-section { background: #f8fafc; border-radius: 8px; padding: 16px; border: 1px dashed #cbd5e1; }
    .upload-form { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .form-group select { padding: 8px 12px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; font-family: inherit; }
    .dropzone { min-width: 240px; border: 1px dashed #94a3b8; background: #fff; border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px; }
    .dropzone.drag-active { border-color: #0284c7; background: #f0f9ff; }
    .dropzone p { margin: 0; color: #64748b; font-size: .8rem; }
    .file-input-hidden { display: none; }
    .file-select-btn { display: inline-flex; width: fit-content; align-items: center; justify-content: center; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 12px; font-size: .82rem; color: #0f172a; background: #f8fafc; cursor: pointer; font-weight: 600; }
    .file-select-btn:hover { background: #eef2ff; border-color: #93c5fd; }
    .file-hint { font-size: .75rem !important; color: #475569 !important; }
    .checksum-line { color: #0f172a !important; font-family: monospace; }
    .warning-msg { color: #b45309 !important; font-weight: 700; }
    .extracted-text-group { width: 100%; }
    .extracted-text-group textarea { width: 100%; resize: vertical; min-height: 64px; border-radius: 6px; border: 1px solid #cbd5e1; padding: 8px 10px; font-family: inherit; font-size: .85rem; }
    .btn { padding: 8px 16px; border-radius: 6px; font-weight: 600; border: none; cursor: pointer; font-family: inherit; transition: all .2s ease; }
    .btn-primary { background: #0284c7; color: #fff; }
    .btn-primary:hover { background: #0369a1; }
    .btn-primary:disabled { background: #94a3b8; cursor: not-allowed; }
    .btn-secondary { background: #e2e8f0; color: #475569; }
    .btn-sm { padding: 6px 10px; font-size: .8rem; }
    .progress-wrap { margin-top: 10px; }
    .progress-label { font-size: .8rem; color: #334155; margin-bottom: 4px; }
    .progress-track { height: 8px; width: 100%; background: #dbeafe; border-radius: 999px; overflow: hidden; }
    .progress-bar { height: 100%; background: #0284c7; transition: width .2s ease; }
    .error-msg { color: #dc2626; margin: 8px 0 0 0; font-size: .9rem; }
    .success-msg { color: #16a34a; margin: 8px 0 0 0; font-size: .9rem; }
    .docs-table-wrap { width: 100%; overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 8px; }
    .docs-table { width: 100%; min-width: 720px; border-collapse: collapse; text-align: left; font-size: .9rem; table-layout: fixed; }
    .docs-table th, .docs-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    .docs-table th { background: #f8fafc; color: #64748b; font-weight: 600; }
    .docs-table th:nth-child(1), .docs-table td:nth-child(1) { width: 28%; }
    .docs-table th:nth-child(2), .docs-table td:nth-child(2) { width: 14%; }
    .docs-table th:nth-child(3), .docs-table td:nth-child(3) { width: 10%; }
    .docs-table th:nth-child(4), .docs-table td:nth-child(4) { width: 22%; }
    .docs-table th:nth-child(5), .docs-table td:nth-child(5) { width: 14%; }
    .docs-table th:nth-child(6), .docs-table td:nth-child(6) { width: 12%; }
    .filename { font-weight: 600; color: #334155; overflow-wrap: anywhere; word-break: break-word; }
    .type-tag { background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 4px; font-size: .8rem; font-weight: 500; }
    .hash { font-family: monospace; color: #64748b; overflow-wrap: anywhere; word-break: break-all; }
    .uploaded-at { white-space: nowrap; }
    .doc-actions { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .download-link { color: #0284c7; text-decoration: none; font-weight: 600; margin-left: 8px; }
    .download-link:hover { text-decoration: underline; }
    .loading, .no-data { padding: 20px; text-align: center; color: #64748b; font-style: italic; }
    .compare-section { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #f8fafc; }
    .compare-picker { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
    .compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .compare-col { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; font-size: .82rem; color: #334155; }
    .compare-col h5 { margin: 0 0 8px 0; font-size: .86rem; color: #0f172a; }
    .compare-col p { margin: 0 0 6px 0; }
    .changed { background: #fef3c7; border-radius: 4px; padding: 2px 4px; }
    .preview-section { border-top: 1px solid #e2e8f0; padding-top: 16px; display: flex; flex-direction: column; gap: 10px; }
    .preview-header { display: flex; justify-content: space-between; align-items: center; }
    .preview-image { width: 100%; max-height: 340px; object-fit: contain; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; }
    .preview-frame { width: 100%; min-height: 360px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; }
    .preview-fallback { border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px; color: #64748b; font-size: .9rem; background: #f8fafc; }
    .ocr-snippet { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
    .ocr-snippet h5 { margin: 0 0 8px 0; color: #334155; font-size: .85rem; }
    .ocr-snippet p { margin: 0; color: #475569; font-size: .85rem; line-height: 1.4; white-space: pre-wrap; }
  `]
})
export class EpsDocumentsComponent implements OnChanges {
  @Input() equipment?: Equipment;

  documents: EquipmentDocument[] = [];
  loading = false;
  uploading = false;
  uploadProgress = 0;
  uploadError = '';
  loadError = '';
  uploadSuccess = false;
  selectedFile: File | null = null;
  selectedFileChecksum = '';
  duplicateChecksumDetected = false;
  dragActive = false;
  previewDoc?: EquipmentDocument;
  compareBaseDoc?: EquipmentDocument;
  compareTargetDoc?: EquipmentDocument;
  compareTargetId = '';

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
      this.resetUploadState();
      this.previewDoc = undefined;
      this.clearCompare();
      this.uploadForm.reset({ documentType: '', extractedText: '' });
    }
  }

  get compareCandidates(): EquipmentDocument[] {
    if (!this.compareBaseDoc) return [];
    return this.documents.filter((d) => d.id !== this.compareBaseDoc?.id);
  }

  loadDocuments(): void {
    if (!this.equipment) return;
    this.loading = true;
    this.loadError = '';
    this.epsService.getEquipmentDocuments(this.equipment.id).subscribe({
      next: (res) => {
        this.documents = res.data;
        this.checkDuplicateChecksum();
        this.loading = false;
      },
      error: (err) => {
        this.loadError = this.buildUserError(err, 'Failed to load documents.');
        this.loading = false;
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.setSelectedFile(file);
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
    const file = event.dataTransfer?.files?.[0] ?? null;
    this.setSelectedFile(file);
  }

  previewDocument(doc: EquipmentDocument): void {
    this.previewDoc = doc;
  }

  closePreview(): void {
    this.previewDoc = undefined;
  }

  setCompareBase(doc: EquipmentDocument): void {
    this.compareBaseDoc = doc;
    this.compareTargetDoc = undefined;
    this.compareTargetId = '';
  }

  setCompareTarget(targetId: string): void {
    this.compareTargetId = targetId;
    this.compareTargetDoc = this.documents.find((d) => d.id === targetId);
  }

  clearCompare(): void {
    this.compareBaseDoc = undefined;
    this.compareTargetDoc = undefined;
    this.compareTargetId = '';
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
    if (this.uploadForm.invalid || !this.selectedFile || !this.equipment || this.duplicateChecksumDetected) return;

    this.uploading = true;
    this.uploadProgress = 0;
    this.uploadError = '';
    this.uploadSuccess = false;

    const docType = this.uploadForm.controls.documentType.value ?? '';
    const extractedText = this.uploadForm.controls.extractedText.value ?? '';

    this.epsService.uploadEquipmentDocumentWithProgress(this.equipment.id, docType, this.selectedFile, extractedText).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          const total = event.total ?? 1;
          this.uploadProgress = Math.max(1, Math.round((event.loaded / total) * 100));
          return;
        }
        if (event.type === HttpEventType.Response) {
          this.uploading = false;
          this.uploadProgress = 100;
          this.uploadSuccess = true;
          this.selectedFile = null;
          this.selectedFileChecksum = '';
          this.duplicateChecksumDetected = false;
          this.uploadForm.reset({ documentType: '', extractedText: '' });
          this.loadDocuments();
        }
      },
      error: (err) => {
        this.uploading = false;
        this.uploadProgress = 0;
        this.uploadError = this.buildUserError(err, 'Failed to upload file.');
      }
    });
  }

  private resetUploadState(): void {
    this.uploading = false;
    this.uploadProgress = 0;
    this.uploadError = '';
    this.uploadSuccess = false;
    this.selectedFile = null;
    this.selectedFileChecksum = '';
    this.duplicateChecksumDetected = false;
  }

  private async setSelectedFile(file: File | null): Promise<void> {
    this.selectedFile = file;
    this.selectedFileChecksum = '';
    this.duplicateChecksumDetected = false;
    if (!file) return;
    this.selectedFileChecksum = await this.computeSha256(file);
    this.checkDuplicateChecksum();
  }

  private checkDuplicateChecksum(): void {
    if (!this.selectedFileChecksum) {
      this.duplicateChecksumDetected = false;
      return;
    }
    this.duplicateChecksumDetected = this.documents.some((d) => d.checksumSha256.toLowerCase() === this.selectedFileChecksum.toLowerCase());
  }

  private async computeSha256(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  private buildUserError(err: any, fallback: string): string {
    const status = err?.status;
    const message = err?.error?.message ?? fallback;
    const requestId = err?.error?.meta?.requestId ?? err?.error?.requestId ?? err?.headers?.get?.('x-request-id') ?? null;
    let normalized = message;
    if (status === 403) normalized = 'Permission denied for this action.';
    if (status === 409) normalized = 'Data changed by another user. Refresh and try again.';
    return requestId ? `${normalized} (Request ID: ${requestId})` : normalized;
  }
}
