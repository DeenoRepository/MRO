import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EpsService } from '../data/eps.service';
import { CreateEquipmentRequest, Equipment, EquipmentDocument, TelemetryMetricType, TelemetryPoint, EquipmentMediaItem, EquipmentMediaType } from '../data/eps.models';
import { EpsDocumentsComponent } from './eps-documents.component';
import { EpsChangeRequestsComponent } from './eps-change-requests.component';

type RegistryColumnKey = 'assetTag' | 'name' | 'category' | 'status' | 'location';
type TimelineEventType = 'CREATED' | 'UPDATED' | 'DOCUMENT';
type MediaFilterType = 'ALL' | EquipmentMediaType;

interface TimelineEvent {
  id: string;
  equipmentId: string;
  equipmentLabel: string;
  title: string;
  type: TimelineEventType;
  at: string;
  meta?: string;
}

interface AnalyticsSummary {
  totalAssets: number;
  activeAssets: number;
  telemetryCoveragePercent: number;
  avgRuntimeHours: number;
}

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
              <div class="table-toolbar">
                <input
                  type="text"
                  [value]="searchQuery"
                  (input)="onSearchInput($any($event.target).value)"
                  placeholder="Smart search: asset tag, serial, manufacturer, location"
                />
                <select [value]="statusFilter" (change)="setStatusFilter($any($event.target).value)">
                  <option value="ALL">All statuses</option>
                  <option *ngFor="let s of availableStatuses" [value]="s">{{ s }}</option>
                </select>
                <select [value]="categoryFilter" (change)="setCategoryFilter($any($event.target).value)">
                  <option value="ALL">All categories</option>
                  <option *ngFor="let c of availableCategories" [value]="c">{{ c }}</option>
                </select>
                <button class="btn btn-secondary btn-sm" (click)="toggleColumnPanel()">
                  {{ showColumnPanel ? 'Hide Columns' : 'Columns' }}
                </button>
                <button class="btn btn-secondary btn-sm" (click)="saveCurrentFilter()">
                  Save Filter
                </button>
              </div>

              <div class="column-panel" *ngIf="showColumnPanel">
                <label *ngFor="let col of columns">
                  <input
                    type="checkbox"
                    [checked]="col.visible"
                    (change)="setColumnVisibility(col.key, $any($event.target).checked)"
                  />
                  {{ col.label }}
                </label>
              </div>

              <div class="saved-filters" *ngIf="savedFilters.length > 0">
                <button class="saved-filter-chip" *ngFor="let f of savedFilters; let idx = index" (click)="applySavedFilter(f)">
                  {{ f.name }}
                  <span class="remove-chip" (click)="removeSavedFilter(idx); $event.stopPropagation()">×</span>
                </button>
              </div>

              <table class="table">
                <thead>
                  <tr>
                    <th *ngIf="isColumnVisible('assetTag')" (click)="sortBy('assetTag')" class="sortable">
                      Asset Tag {{ sortIndicator('assetTag') }}
                    </th>
                    <th *ngIf="isColumnVisible('name')" (click)="sortBy('name')" class="sortable">
                      Name {{ sortIndicator('name') }}
                    </th>
                    <th *ngIf="isColumnVisible('category')" (click)="sortBy('category')" class="sortable">
                      Category {{ sortIndicator('category') }}
                    </th>
                    <th *ngIf="isColumnVisible('status')" (click)="sortBy('status')" class="sortable">
                      Status {{ sortIndicator('status') }}
                    </th>
                    <th *ngIf="isColumnVisible('location')" (click)="sortBy('location')" class="sortable">
                      Location {{ sortIndicator('location') }}
                    </th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of filteredEquipment" 
                      [class.selected]="selectedEquipment?.id === item.id"
                      (click)="selectEquipment(item)"
                      class="clickable-row">
                    <td *ngIf="isColumnVisible('assetTag')"><strong>{{ item.assetTag }}</strong></td>
                    <td *ngIf="isColumnVisible('name')">{{ item.name }}</td>
                    <td *ngIf="isColumnVisible('category')">{{ item.category }}</td>
                    <td *ngIf="isColumnVisible('status')"><span class="status-tag active">{{ item.status }}</span></td>
                    <td *ngIf="isColumnVisible('location')">{{ item.location || '-' }}</td>
                    <td>
                      <button (click)="selectEquipment(item); $event.stopPropagation()" class="btn btn-secondary btn-sm">
                        View Documents
                      </button>
                    </td>
                  </tr>
                  <tr *ngIf="filteredEquipment.length === 0">
                    <td [attr.colspan]="visibleColumnCount + 1" class="no-data">No equipment matches current filters.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <section class="timeline-card">
              <header class="timeline-header">
                <h3>Activity Timeline</h3>
                <select [value]="timelineTypeFilter" (change)="setTimelineTypeFilter($any($event.target).value)">
                  <option value="ALL">All events</option>
                  <option value="CREATED">Created</option>
                  <option value="UPDATED">Updated</option>
                  <option value="DOCUMENT">Documents</option>
                </select>
              </header>

              <div class="timeline-empty" *ngIf="filteredTimelineEvents.length === 0">
                No events yet.
              </div>

              <ul class="timeline-list" *ngIf="filteredTimelineEvents.length > 0">
                <li *ngFor="let event of filteredTimelineEvents">
                  <div class="timeline-dot" [attr.data-type]="event.type"></div>
                  <div class="timeline-body">
                    <div class="timeline-title">{{ event.title }}</div>
                    <div class="timeline-meta">
                      {{ event.equipmentLabel }} | {{ event.at | date: 'medium' }}
                      <span *ngIf="event.meta"> | {{ event.meta }}</span>
                    </div>
                  </div>
                </li>
              </ul>
            </section>
          </div>

          <!-- DOCUMENT SIDE PANEL -->
          <div class="registry-detail-section" *ngIf="selectedEquipment">
            <mro-eps-documents [equipment]="selectedEquipment"></mro-eps-documents>
            <section class="telemetry-card">
              <header class="telemetry-header">
                <h3>Live Telemetry</h3>
                <div class="telemetry-actions">
                  <select [value]="telemetryMetricFilter" (change)="setTelemetryMetricFilter($any($event.target).value)">
                    <option value="ALL">All metrics</option>
                    <option value="TEMPERATURE">Temperature</option>
                    <option value="VIBRATION">Vibration</option>
                    <option value="PRESSURE">Pressure</option>
                    <option value="RUNTIME_HOURS">Runtime Hours</option>
                  </select>
                  <button class="btn btn-secondary btn-sm" (click)="refreshTelemetry()">Refresh</button>
                </div>
              </header>
              <div class="telemetry-empty" *ngIf="telemetryLoading">Loading telemetry...</div>
              <div class="telemetry-empty" *ngIf="!telemetryLoading && telemetryPoints.length === 0">No telemetry points.</div>
              <table class="table telemetry-table" *ngIf="!telemetryLoading && telemetryPoints.length > 0">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Value</th>
                    <th>Recorded</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let point of telemetryPoints">
                    <td>{{ formatMetric(point.metricType) }}</td>
                    <td>{{ point.metricValue }} {{ point.unit || '' }}</td>
                    <td>{{ point.recordedAt | date: 'short' }}</td>
                    <td>{{ point.source || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section class="media-card">
              <header class="media-header">
                <h3>Inspection Media</h3>
                <div class="media-actions">
                  <select [value]="mediaFilterType" (change)="setMediaFilter($any($event.target).value)">
                    <option value="ALL">All media</option>
                    <option value="PHOTO">Photos</option>
                    <option value="VIDEO">Videos</option>
                  </select>
                  <button class="btn btn-secondary btn-sm" (click)="refreshMedia()">Refresh</button>
                </div>
              </header>

              <div class="media-upload-row">
                <select [value]="uploadMediaType" (change)="uploadMediaType = $any($event.target).value">
                  <option value="PHOTO">Photo</option>
                  <option value="VIDEO">Video</option>
                </select>
                <input type="text" [value]="uploadMediaAnnotation" (input)="uploadMediaAnnotation = $any($event.target).value" placeholder="Inspection note / annotation" />
                <input type="file" (change)="onMediaFileSelected($event)" />
                <button class="btn btn-primary btn-sm" (click)="uploadMedia()" [disabled]="mediaUploading || !uploadMediaFile">
                  {{ mediaUploading ? 'Uploading...' : 'Upload' }}
                </button>
              </div>

              <p class="error" *ngIf="mediaError">{{ mediaError }}</p>
              <div class="telemetry-empty" *ngIf="mediaLoading">Loading media...</div>
              <div class="telemetry-empty" *ngIf="!mediaLoading && filteredMediaItems.length === 0">No media records.</div>

              <ul class="media-list" *ngIf="!mediaLoading && filteredMediaItems.length > 0">
                <li *ngFor="let item of filteredMediaItems">
                  <div class="media-row-head">
                    <strong>{{ item.fileName }}</strong>
                    <span class="media-type">{{ item.mediaType }}</span>
                  </div>
                  <div class="media-row-meta">
                    {{ item.uploadedAt | date: 'medium' }}
                    <span *ngIf="item.annotation"> | {{ item.annotation }}</span>
                    <span *ngIf="item.fileSize"> | {{ item.fileSize | number }} bytes</span>
                  </div>
                  <a class="media-download" [href]="buildMediaDownloadUrl(item.id)" target="_blank" rel="noopener noreferrer">Download</a>
                </li>
              </ul>
            </section>

            <section class="graph-card">
              <header class="graph-header">
                <h3>Asset Relationship Snapshot</h3>
              </header>
              <div class="graph-center-node" *ngIf="selectedEquipment">
                {{ selectedEquipment.assetTag }} | {{ selectedEquipment.name }}
              </div>
              <div class="graph-empty" *ngIf="relatedEquipment.length === 0">
                No related assets by category or location.
              </div>
              <ul class="graph-list" *ngIf="relatedEquipment.length > 0">
                <li *ngFor="let rel of relatedEquipment">
                  <strong>{{ rel.assetTag }}</strong> - {{ rel.name }}
                  <span class="graph-reason">{{ buildRelationReason(rel) }}</span>
                </li>
              </ul>
            </section>

            <section class="analytics-card">
              <header class="analytics-header">
                <h3>Reliability Snapshot</h3>
              </header>
              <div class="analytics-grid">
                <div class="metric-box">
                  <div class="metric-label">Total Assets</div>
                  <div class="metric-value">{{ analyticsSummary.totalAssets }}</div>
                </div>
                <div class="metric-box">
                  <div class="metric-label">Active Assets</div>
                  <div class="metric-value">{{ analyticsSummary.activeAssets }}</div>
                </div>
                <div class="metric-box">
                  <div class="metric-label">Telemetry Coverage</div>
                  <div class="metric-value">{{ analyticsSummary.telemetryCoveragePercent }}%</div>
                </div>
                <div class="metric-box">
                  <div class="metric-label">Avg Runtime (h)</div>
                  <div class="metric-value">{{ analyticsSummary.avgRuntimeHours }}</div>
                </div>
              </div>
            </section>
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
    .table-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 12px 16px 0 16px;
      align-items: center;
    }
    .table-toolbar input,
    .table-toolbar select {
      min-width: 180px;
      padding: 8px 10px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      font-size: 0.85rem;
    }
    .column-panel {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      padding: 8px 16px 12px 16px;
      font-size: 0.85rem;
      color: #475569;
    }
    .column-panel label {
      display: flex;
      gap: 6px;
      align-items: center;
      user-select: none;
    }
    .saved-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 0 16px 12px 16px;
    }
    .saved-filter-chip {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      color: #334155;
      border-radius: 999px;
      font-size: 0.8rem;
      padding: 4px 10px;
      cursor: pointer;
    }
    .remove-chip {
      margin-left: 8px;
      font-weight: 700;
      color: #64748b;
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
    .table th.sortable {
      cursor: pointer;
      user-select: none;
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
    .registry-detail-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .telemetry-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      padding: 16px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
    }
    .telemetry-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .telemetry-header h3 {
      margin: 0;
      font-size: 1rem;
      color: #0f172a;
    }
    .telemetry-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .telemetry-actions select {
      min-width: 140px;
      padding: 6px 8px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
    }
    .telemetry-table {
      font-size: 0.82rem;
    }
    .telemetry-empty {
      color: #64748b;
      font-style: italic;
    }
    .media-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      padding: 16px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
    }
    .media-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .media-header h3 {
      margin: 0;
      font-size: 1rem;
      color: #0f172a;
    }
    .media-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .media-actions select,
    .media-upload-row select,
    .media-upload-row input[type='text'],
    .media-upload-row input[type='file'] {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 6px 8px;
      font-size: 0.82rem;
    }
    .media-upload-row {
      display: grid;
      grid-template-columns: 120px 1fr 1fr auto;
      gap: 8px;
      align-items: center;
      margin-bottom: 12px;
    }
    .media-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .media-list li {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px;
      background: #f8fafc;
    }
    .media-row-head {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      align-items: center;
    }
    .media-type {
      font-size: 0.75rem;
      font-weight: 700;
      color: #0369a1;
    }
    .media-row-meta {
      margin-top: 4px;
      font-size: 0.8rem;
      color: #64748b;
    }
    .media-download {
      display: inline-block;
      margin-top: 6px;
      font-size: 0.82rem;
      color: #0284c7;
      text-decoration: none;
      font-weight: 600;
    }
    .media-download:hover {
      text-decoration: underline;
    }
    .graph-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      padding: 16px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
    }
    .graph-header h3 {
      margin: 0 0 10px 0;
      font-size: 1rem;
      color: #0f172a;
    }
    .graph-center-node {
      border: 1px solid #0ea5e9;
      background: #f0f9ff;
      color: #0c4a6e;
      border-radius: 8px;
      padding: 10px;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .graph-empty {
      color: #64748b;
      font-style: italic;
    }
    .graph-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .graph-list li {
      padding: 8px 10px;
      border-radius: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      font-size: 0.84rem;
      color: #334155;
    }
    .graph-reason {
      color: #64748b;
      margin-left: 6px;
      font-size: 0.78rem;
    }
    .analytics-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      padding: 16px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
    }
    .analytics-header h3 {
      margin: 0 0 12px 0;
      font-size: 1rem;
      color: #0f172a;
    }
    .analytics-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
    .metric-box {
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 8px;
      padding: 10px;
    }
    .metric-label {
      font-size: 0.78rem;
      color: #64748b;
    }
    .metric-value {
      font-size: 1.1rem;
      font-weight: 700;
      color: #0f172a;
      margin-top: 4px;
    }
    .timeline-card {
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
      border: 1px solid #e2e8f0;
      padding: 16px;
    }
    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .timeline-header h3 {
      margin: 0;
      font-size: 1rem;
      color: #0f172a;
    }
    .timeline-header select {
      min-width: 140px;
      padding: 6px 8px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
    }
    .timeline-list {
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .timeline-list li {
      display: flex;
      gap: 10px;
      align-items: flex-start;
    }
    .timeline-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-top: 6px;
      background: #64748b;
      flex-shrink: 0;
    }
    .timeline-dot[data-type='CREATED'] { background: #059669; }
    .timeline-dot[data-type='UPDATED'] { background: #0ea5e9; }
    .timeline-dot[data-type='DOCUMENT'] { background: #7c3aed; }
    .timeline-title {
      font-size: 0.9rem;
      color: #0f172a;
      font-weight: 600;
    }
    .timeline-meta {
      font-size: 0.8rem;
      color: #64748b;
      margin-top: 2px;
    }
    .timeline-empty {
      color: #64748b;
      font-style: italic;
    }
  `]
})
export class EpsPageComponent implements OnInit {
  private readonly filtersStorageKey = 'eps_registry_saved_filters_v1';

  columns: { key: RegistryColumnKey; label: string; visible: boolean }[] = [
    { key: 'assetTag', label: 'Asset Tag', visible: true },
    { key: 'name', label: 'Name', visible: true },
    { key: 'category', label: 'Category', visible: true },
    { key: 'status', label: 'Status', visible: true },
    { key: 'location', label: 'Location', visible: true }
  ];

  availableStatuses: string[] = [];
  availableCategories: string[] = [];
  filteredEquipment: Equipment[] = [];
  searchQuery = '';
  statusFilter = 'ALL';
  categoryFilter = 'ALL';
  sortField: RegistryColumnKey = 'assetTag';
  sortDirection: 'asc' | 'desc' = 'asc';
  showColumnPanel = false;
  savedFilters: {
    name: string;
    searchQuery: string;
    statusFilter: string;
    categoryFilter: string;
  }[] = [];

  activeTab: 'registry' | 'requests' = 'registry';
  equipment: Equipment[] = [];
  selectedEquipment?: Equipment;
  telemetryPoints: TelemetryPoint[] = [];
  telemetryMetricFilter: 'ALL' | TelemetryMetricType = 'ALL';
  telemetryLoading = false;
  mediaItems: EquipmentMediaItem[] = [];
  filteredMediaItems: EquipmentMediaItem[] = [];
  mediaFilterType: MediaFilterType = 'ALL';
  mediaLoading = false;
  mediaUploading = false;
  mediaError = '';
  uploadMediaType: EquipmentMediaType = 'PHOTO';
  uploadMediaAnnotation = '';
  uploadMediaFile?: File;
  relatedEquipment: Equipment[] = [];
  analyticsSummary: AnalyticsSummary = {
    totalAssets: 0,
    activeAssets: 0,
    telemetryCoveragePercent: 0,
    avgRuntimeHours: 0
  };
  timelineEvents: TimelineEvent[] = [];
  filteredTimelineEvents: TimelineEvent[] = [];
  timelineTypeFilter: 'ALL' | TimelineEventType = 'ALL';
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
    this.loadSavedFilters();
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.epsService.getEquipment().subscribe({
      next: (res) => {
        this.equipment = res.data;
        this.availableStatuses = Array.from(new Set(this.equipment.map(e => e.status))).sort();
        this.availableCategories = Array.from(new Set(this.equipment.map(e => e.category))).sort();
        this.applyFiltersAndSort();
        this.rebuildTimeline();
        this.rebuildAnalyticsSummary();
        this.loading = false;
        // Keep selection active if it still exists
        if (this.selectedEquipment) {
          const updated = this.equipment.find(e => e.id === this.selectedEquipment?.id);
          this.selectedEquipment = updated;
          if (updated) {
            this.loadSelectedEquipmentDocuments(updated.id);
            this.loadTelemetry(updated.id);
            this.loadMedia(updated.id);
            this.computeRelatedEquipment(updated);
          }
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
    this.loadSelectedEquipmentDocuments(item.id);
    this.loadTelemetry(item.id);
    this.loadMedia(item.id);
    this.computeRelatedEquipment(item);
  }

  get visibleColumnCount(): number {
    return this.columns.filter(c => c.visible).length;
  }

  isColumnVisible(key: RegistryColumnKey): boolean {
    return this.columns.find(c => c.key === key)?.visible ?? false;
  }

  setColumnVisibility(key: RegistryColumnKey, visible: boolean): void {
    const col = this.columns.find(c => c.key === key);
    if (!col) return;
    col.visible = visible;
    if (!this.columns.some(c => c.visible)) {
      col.visible = true;
    }
  }

  toggleColumnPanel(): void {
    this.showColumnPanel = !this.showColumnPanel;
  }

  sortBy(field: RegistryColumnKey): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFiltersAndSort();
  }

  sortIndicator(field: RegistryColumnKey): string {
    if (this.sortField !== field) return '';
    return this.sortDirection === 'asc' ? '^' : 'v';
  }

  onSearchInput(value: string): void {
    this.searchQuery = value;
    this.applyFiltersAndSort();
  }

  setStatusFilter(value: string): void {
    this.statusFilter = value;
    this.applyFiltersAndSort();
  }

  setCategoryFilter(value: string): void {
    this.categoryFilter = value;
    this.applyFiltersAndSort();
  }

  saveCurrentFilter(): void {
    const name = `Filter ${this.savedFilters.length + 1}`;
    this.savedFilters.push({
      name,
      searchQuery: this.searchQuery,
      statusFilter: this.statusFilter,
      categoryFilter: this.categoryFilter
    });
    localStorage.setItem(this.filtersStorageKey, JSON.stringify(this.savedFilters));
  }

  applySavedFilter(filter: { searchQuery: string; statusFilter: string; categoryFilter: string }): void {
    this.searchQuery = filter.searchQuery;
    this.statusFilter = filter.statusFilter;
    this.categoryFilter = filter.categoryFilter;
    this.applyFiltersAndSort();
  }

  removeSavedFilter(index: number): void {
    this.savedFilters.splice(index, 1);
    localStorage.setItem(this.filtersStorageKey, JSON.stringify(this.savedFilters));
  }

  setTimelineTypeFilter(value: string): void {
    if (value === 'CREATED' || value === 'UPDATED' || value === 'DOCUMENT') {
      this.timelineTypeFilter = value;
    } else {
      this.timelineTypeFilter = 'ALL';
    }
    this.applyTimelineFilter();
  }

  setTelemetryMetricFilter(value: string): void {
    if (value === 'TEMPERATURE' || value === 'VIBRATION' || value === 'PRESSURE' || value === 'RUNTIME_HOURS') {
      this.telemetryMetricFilter = value;
    } else {
      this.telemetryMetricFilter = 'ALL';
    }
    this.refreshTelemetry();
  }

  refreshTelemetry(): void {
    if (!this.selectedEquipment) {
      this.telemetryPoints = [];
      return;
    }
    this.loadTelemetry(this.selectedEquipment.id);
  }

  setMediaFilter(value: string): void {
    if (value === 'PHOTO' || value === 'VIDEO') {
      this.mediaFilterType = value;
    } else {
      this.mediaFilterType = 'ALL';
    }
    this.applyMediaFilter();
  }

  onMediaFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.uploadMediaFile = input?.files?.item(0) ?? undefined;
  }

  refreshMedia(): void {
    if (!this.selectedEquipment) {
      this.mediaItems = [];
      this.filteredMediaItems = [];
      return;
    }
    this.loadMedia(this.selectedEquipment.id);
  }

  uploadMedia(): void {
    if (!this.selectedEquipment || !this.uploadMediaFile) return;
    this.mediaUploading = true;
    this.mediaError = '';
    this.epsService.uploadEquipmentMedia(
      this.selectedEquipment.id,
      this.uploadMediaType,
      this.uploadMediaFile,
      this.uploadMediaAnnotation
    ).subscribe({
      next: () => {
        this.mediaUploading = false;
        this.uploadMediaFile = undefined;
        this.uploadMediaAnnotation = '';
        this.loadMedia(this.selectedEquipment!.id);
      },
      error: (err) => {
        this.mediaError = err?.error?.message ?? 'Failed to upload media.';
        this.mediaUploading = false;
      }
    });
  }

  private loadSavedFilters(): void {
    const raw = localStorage.getItem(this.filtersStorageKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        this.savedFilters = parsed;
      }
    } catch {
      this.savedFilters = [];
    }
  }

  private applyFiltersAndSort(): void {
    const query = this.searchQuery.trim().toLowerCase();
    this.filteredEquipment = this.equipment
      .filter((item) => {
        if (this.statusFilter !== 'ALL' && item.status !== this.statusFilter) return false;
        if (this.categoryFilter !== 'ALL' && item.category !== this.categoryFilter) return false;
        if (!query) return true;
        const haystack = [
          item.assetTag,
          item.name,
          item.category,
          item.status,
          item.serialNumber ?? '',
          item.manufacturer ?? '',
          item.location ?? ''
        ].join(' ').toLowerCase();
        return haystack.includes(query);
      })
      .sort((a, b) => {
        const left = String(this.readSortValue(a, this.sortField)).toLowerCase();
        const right = String(this.readSortValue(b, this.sortField)).toLowerCase();
        const result = left.localeCompare(right);
        return this.sortDirection === 'asc' ? result : -result;
      });
  }

  private readSortValue(item: Equipment, field: RegistryColumnKey): string {
    switch (field) {
      case 'assetTag':
        return item.assetTag;
      case 'name':
        return item.name;
      case 'category':
        return item.category;
      case 'status':
        return item.status;
      case 'location':
        return item.location ?? '';
      default:
        return '';
    }
  }

  private loadSelectedEquipmentDocuments(equipmentId: string): void {
    this.epsService.getEquipmentDocuments(equipmentId).subscribe({
      next: (res) => this.rebuildTimeline(res.data),
      error: () => this.rebuildTimeline()
    });
  }

  private loadTelemetry(equipmentId: string): void {
    this.telemetryLoading = true;
    const metricType = this.telemetryMetricFilter === 'ALL' ? undefined : this.telemetryMetricFilter;
    this.epsService.getEquipmentTelemetry(equipmentId, metricType).subscribe({
      next: (res) => {
        this.telemetryPoints = res.data;
        this.rebuildAnalyticsSummary();
        this.telemetryLoading = false;
      },
      error: () => {
        this.telemetryPoints = [];
        this.rebuildAnalyticsSummary();
        this.telemetryLoading = false;
      }
    });
  }

  private loadMedia(equipmentId: string): void {
    this.mediaLoading = true;
    this.mediaError = '';
    this.epsService.getEquipmentMedia(equipmentId).subscribe({
      next: (res) => {
        this.mediaItems = res.data;
        this.applyMediaFilter();
        this.mediaLoading = false;
      },
      error: () => {
        this.mediaItems = [];
        this.filteredMediaItems = [];
        this.mediaLoading = false;
      }
    });
  }

  private applyMediaFilter(): void {
    if (this.mediaFilterType === 'ALL') {
      this.filteredMediaItems = [...this.mediaItems];
      return;
    }
    this.filteredMediaItems = this.mediaItems.filter((item) => item.mediaType === this.mediaFilterType);
  }

  buildMediaDownloadUrl(mediaId: string): string {
    return `/api/v1/eps/equipment/media/${mediaId}/download`;
  }

  buildRelationReason(item: Equipment): string {
    if (!this.selectedEquipment) return '';
    const sameCategory = item.category === this.selectedEquipment.category;
    const sameLocation = !!item.location && item.location === this.selectedEquipment.location;
    if (sameCategory && sameLocation) return '(same category and location)';
    if (sameCategory) return '(same category)';
    if (sameLocation) return '(same location)';
    return '';
  }

  private computeRelatedEquipment(source: Equipment): void {
    this.relatedEquipment = this.equipment
      .filter((item) => item.id !== source.id)
      .filter((item) => item.category === source.category || (!!item.location && item.location === source.location))
      .slice(0, 8);
  }

  private rebuildAnalyticsSummary(): void {
    const totalAssets = this.equipment.length;
    const activeAssets = this.equipment.filter((item) => item.status === 'ACTIVE').length;
    const telemetryCoveragePercent = totalAssets > 0 && this.telemetryPoints.length > 0 ? 100 : 0;
    const runtimePoints = this.telemetryPoints.filter((item) => item.metricType === 'RUNTIME_HOURS');
    const avgRuntimeHours = runtimePoints.length === 0
      ? 0
      : Number((runtimePoints.reduce((sum, point) => sum + point.metricValue, 0) / runtimePoints.length).toFixed(1));
    this.analyticsSummary = {
      totalAssets,
      activeAssets,
      telemetryCoveragePercent,
      avgRuntimeHours
    };
  }

  formatMetric(metricType: TelemetryMetricType): string {
    switch (metricType) {
      case 'RUNTIME_HOURS':
        return 'Runtime Hours';
      case 'TEMPERATURE':
        return 'Temperature';
      case 'VIBRATION':
        return 'Vibration';
      case 'PRESSURE':
        return 'Pressure';
      default:
        return metricType;
    }
  }

  private rebuildTimeline(documents: EquipmentDocument[] = []): void {
    const equipmentEvents: TimelineEvent[] = this.equipment.flatMap((item) => {
      const created: TimelineEvent = {
        id: `created-${item.id}`,
        equipmentId: item.id,
        equipmentLabel: `${item.assetTag} ${item.name}`,
        title: 'Equipment registered',
        type: 'CREATED',
        at: item.createdAt
      };
      const updates: TimelineEvent[] = item.updatedAt !== item.createdAt
        ? [{
            id: `updated-${item.id}`,
            equipmentId: item.id,
            equipmentLabel: `${item.assetTag} ${item.name}`,
            title: 'Equipment profile updated',
            type: 'UPDATED',
            at: item.updatedAt
          }]
        : [];
      return [created, ...updates];
    });

    const documentEvents: TimelineEvent[] = documents.map((doc) => ({
      id: `document-${doc.id}`,
      equipmentId: doc.equipmentId,
      equipmentLabel: this.selectedEquipment
        ? `${this.selectedEquipment.assetTag} ${this.selectedEquipment.name}`
        : doc.equipmentId,
      title: 'Document uploaded',
      type: 'DOCUMENT',
      at: doc.uploadedAt,
      meta: `${doc.documentType}: ${doc.fileName}`
    }));

    this.timelineEvents = [...documentEvents, ...equipmentEvents]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 40);
    this.applyTimelineFilter();
  }

  private applyTimelineFilter(): void {
    if (this.timelineTypeFilter === 'ALL') {
      this.filteredTimelineEvents = [...this.timelineEvents];
      return;
    }
    this.filteredTimelineEvents = this.timelineEvents.filter((event) => event.type === this.timelineTypeFilter);
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
