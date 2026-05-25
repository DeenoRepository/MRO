import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EpsService } from '../data/eps.service';
import {
  CreateEquipmentRequest,
  Equipment,
  EquipmentDocument,
  EquipmentMediaItem,
  EquipmentMediaType,
  TelemetryMetricType,
  TelemetryPoint
} from '../data/eps.models';
import { EpsChangeRequestsComponent } from './eps-change-requests.component';
import { EpsDocumentsComponent } from './eps-documents.component';

type RegistryColumnKey = 'assetTag' | 'name' | 'category' | 'status' | 'location';
type WorkflowRole = 'TECHNICIAN' | 'MANAGER' | 'AUDITOR' | 'WAREHOUSE_OPERATOR' | 'RELIABILITY_ENGINEER';
type EquipmentDetailTab = 'OVERVIEW' | 'DOCUMENTS' | 'MAINTENANCE' | 'TICKETS' | 'INVENTORY' | 'HISTORY' | 'COMPLIANCE' | 'RELIABILITY';
type TimelineFilterType = 'ALL' | 'MAINTENANCE' | 'DOCUMENTS' | 'STATUS' | 'APPROVALS' | 'TICKETS' | 'INVENTORY';

interface SavedFilter {
  name: string;
  scope: 'PERSONAL' | 'TEAM' | 'GLOBAL';
  searchQuery: string;
  statusFilter: string;
  categoryFilter: string;
}

interface TimelineEvent {
  id: string;
  equipmentId: string;
  equipmentLabel: string;
  title: string;
  type: Exclude<TimelineFilterType, 'ALL'>;
  at: string;
  meta?: string;
}

interface AnalyticsSummary {
  totalAssets: number;
  activeAssets: number;
  telemetryCoveragePercent: number;
  avgRuntimeHours: number;
}

type ScanAction = 'OPEN_EQUIPMENT' | 'CREATE_TICKET' | 'OPEN_WORK_ORDER' | 'UPLOAD_PHOTO' | 'OPEN_MANUALS';

interface DashboardWidget {
  key: string;
  title: string;
  value: string | number;
  hint: string;
  roles: WorkflowRole[];
  tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}

@Component({
  selector: 'mro-eps-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, EpsDocumentsComponent, EpsChangeRequestsComponent],
  template: `
    <div class="eps-dashboard" [class.technician-mode]="technicianMode">
      <nav class="tab-navigation">
        <button (click)="activeTab = 'registry'" [class.active]="activeTab === 'registry'">Equipment Registry</button>
        <button (click)="activeTab = 'requests'" [class.active]="activeTab === 'requests'">Change Requests</button>
      </nav>

      <div class="experience-toolbar" *ngIf="activeTab === 'registry'">
        <div class="role-controls">
          <label>Role</label>
          <select [value]="currentRole" (change)="setRole($any($event.target).value)">
            <option value="TECHNICIAN">Technician</option>
            <option value="MANAGER">Manager</option>
            <option value="AUDITOR">Auditor</option>
            <option value="WAREHOUSE_OPERATOR">Warehouse Operator</option>
            <option value="RELIABILITY_ENGINEER">Reliability Engineer</option>
          </select>
          <button class="btn btn-secondary btn-sm" (click)="technicianMode = !technicianMode">
            {{ technicianMode ? 'Standard Mode' : 'Technician Mode' }}
          </button>
        </div>
        <div class="workflow-note">
          Workflow context: {{ currentRole }} | {{ selectedEquipment?.status || 'no asset selected' }}
        </div>
      </div>

      <main class="tab-content">
        <div *ngIf="activeTab === 'registry'" class="registry-grid">
          <div class="registry-list-section">
            <header class="section-header">
              <h2>Equipment Registry</h2>
              <p>High-density workspace with saved filters, column layouts, smart search, and bulk operations.</p>
            </header>

            <section class="qr-card">
              <header class="qr-header">
                <h3>QR & Barcode Workflow</h3>
                <span class="qr-note">Camera/USB/mobile scanner simulation</span>
              </header>
              <div class="qr-controls">
                <input
                  type="text"
                  [value]="scannerInput"
                  (input)="scannerInput = $any($event.target).value"
                  placeholder="Scan code or enter asset tag / equipment ID"
                />
                <button class="btn btn-secondary btn-sm" (click)="runScannerLookup()">Scan</button>
                <button class="btn btn-secondary btn-sm" (click)="printAssetCard()" [disabled]="!selectedEquipment">Print Asset Card</button>
              </div>
              <div class="scan-result" *ngIf="scanResultMessage">{{ scanResultMessage }}</div>
              <div class="scan-actions" *ngIf="scannedEquipment">
                <button class="btn btn-secondary btn-sm" (click)="handleScanAction('OPEN_EQUIPMENT')">Open Equipment</button>
                <button class="btn btn-secondary btn-sm" (click)="handleScanAction('CREATE_TICKET')">Create Ticket</button>
                <button class="btn btn-secondary btn-sm" (click)="handleScanAction('OPEN_WORK_ORDER')">Open Work Order</button>
                <button class="btn btn-secondary btn-sm" (click)="handleScanAction('UPLOAD_PHOTO')">Upload Photo</button>
                <button class="btn btn-secondary btn-sm" (click)="handleScanAction('OPEN_MANUALS')">Open Manuals</button>
              </div>
            </section>

            <section class="widgets-card">
              <header class="widgets-header">
                <h3>Operational Widgets</h3>
                <span>Role-aware EPS overview</span>
              </header>
              <div class="widgets-grid">
                <article
                  class="widget-item"
                  *ngFor="let widget of visibleWidgets"
                  [attr.data-tone]="widget.tone"
                >
                  <div class="widget-title">{{ widget.title }}</div>
                  <div class="widget-value">{{ widget.value }}</div>
                  <div class="widget-hint">{{ widget.hint }}</div>
                </article>
              </div>
            </section>

            <form class="form-card" [formGroup]="form" (ngSubmit)="create()">
              <h3>Register Asset</h3>
              <div class="form-grid">
                <input type="text" formControlName="assetTag" placeholder="Asset Tag (e.g. EQ-100)" />
                <input type="text" formControlName="name" placeholder="Asset Name" />
                <input type="text" formControlName="category" placeholder="Category" />
              </div>
              <div class="duplicate-hints" *ngIf="duplicateCandidates.length > 0">
                <p>Potential duplicates found:</p>
                <ul>
                  <li *ngFor="let c of duplicateCandidates">
                    <strong>{{ c.assetTag }}</strong> - {{ c.name }} ({{ c.category }})
                  </li>
                </ul>
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
                  placeholder="Smart search: tag, serial, manufacturer, location, alias, docs"
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
              </div>

              <div class="table-toolbar second">
                <input type="text" [value]="newFilterName" (input)="newFilterName = $any($event.target).value" placeholder="Filter name" />
                <select [value]="newFilterScope" (change)="newFilterScope = $any($event.target).value">
                  <option value="PERSONAL">Personal</option>
                  <option value="TEAM">Team</option>
                  <option value="GLOBAL">Global</option>
                </select>
                <button class="btn btn-secondary btn-sm" (click)="saveCurrentFilter()">Save Filter</button>
              </div>

              <div class="column-panel" *ngIf="showColumnPanel">
                <div class="column-config" *ngFor="let col of columns; let i = index">
                  <label>
                    <input type="checkbox" [checked]="col.visible" (change)="setColumnVisibility(col.key, $any($event.target).checked)" />
                    {{ col.label }}
                  </label>
                  <div class="column-order">
                    <button class="btn btn-secondary btn-sm" (click)="moveColumn(i, -1)" [disabled]="i === 0">Up</button>
                    <button class="btn btn-secondary btn-sm" (click)="moveColumn(i, 1)" [disabled]="i === columns.length - 1">Down</button>
                  </div>
                </div>
              </div>

              <div class="saved-filters" *ngIf="savedFilters.length > 0">
                <button class="saved-filter-chip" *ngFor="let f of savedFilters; let idx = index" (click)="applySavedFilter(f)">
                  {{ f.name }} [{{ f.scope }}]
                  <span class="remove-chip" (click)="removeSavedFilter(idx); $event.stopPropagation()">x</span>
                </button>
              </div>

              <div class="bulk-toolbar" *ngIf="selectedRows.size > 0">
                <span>{{ selectedRows.size }} selected</span>
                <button class="btn btn-secondary btn-sm" (click)="bulkExport()">Export CSV</button>
                <button class="btn btn-secondary btn-sm" (click)="bulkStatusUpdate('MAINTENANCE')">Set MAINTENANCE</button>
                <button class="btn btn-secondary btn-sm" (click)="bulkPrintQr()">Print QR</button>
                <button class="btn btn-secondary btn-sm" (click)="bulkAssignDocument()">Assign Document</button>
              </div>

              <table class="table">
                <thead>
                  <tr>
                    <th><input type="checkbox" [checked]="isAllFilteredSelected()" (change)="toggleSelectAllFiltered($any($event.target).checked)" /></th>
                    <th *ngFor="let col of visibleColumns" (click)="sortBy(col.key)" class="sortable">
                      {{ col.label }} {{ sortIndicator(col.key) }}
                    </th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    *ngFor="let item of filteredEquipment"
                    [class.selected]="selectedEquipment?.id === item.id"
                    (click)="selectEquipment(item)"
                    class="clickable-row"
                  >
                    <td>
                      <input
                        type="checkbox"
                        [checked]="isSelected(item.id)"
                        (click)="$event.stopPropagation()"
                        (change)="toggleSelection(item.id, $any($event.target).checked)"
                      />
                    </td>
                    <td *ngFor="let col of visibleColumns">
                      <ng-container [ngSwitch]="col.key">
                        <strong *ngSwitchCase="'assetTag'">{{ item.assetTag }}</strong>
                        <span *ngSwitchCase="'name'">{{ item.name }}</span>
                        <span *ngSwitchCase="'category'">{{ item.category }}</span>
                        <span *ngSwitchCase="'status'"><span class="status-tag active">{{ item.status }}</span></span>
                        <span *ngSwitchCase="'location'">{{ item.location || '-' }}</span>
                      </ng-container>
                    </td>
                    <td>
                      <button (click)="selectEquipment(item); $event.stopPropagation()" class="btn btn-secondary btn-sm">Open</button>
                    </td>
                  </tr>
                  <tr *ngIf="filteredEquipment.length === 0">
                    <td [attr.colspan]="visibleColumnCount + 2" class="no-data">No equipment matches current filters.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <section class="timeline-card">
              <header class="timeline-header">
                <h3>Unified Timeline</h3>
                <select [value]="timelineTypeFilter" (change)="setTimelineTypeFilter($any($event.target).value)">
                  <option value="ALL">All events</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="DOCUMENTS">Documents</option>
                  <option value="STATUS">Status</option>
                  <option value="APPROVALS">Approvals</option>
                  <option value="TICKETS">Tickets</option>
                  <option value="INVENTORY">Inventory</option>
                </select>
              </header>
              <div class="timeline-empty" *ngIf="filteredTimelineEvents.length === 0">No events yet.</div>
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

          <div class="registry-detail-section sticky-panel" *ngIf="selectedEquipment">
            <section class="sticky-summary">
              <div class="summary-title">
                <strong>{{ selectedEquipment.assetTag }}</strong> | {{ selectedEquipment.name }}
              </div>
              <div class="summary-grid">
                <div>Status: <span class="status-tag active">{{ selectedEquipment.status }}</span></div>
                <div>Location: {{ selectedEquipment.location || '-' }}</div>
                <div>Criticality: {{ computeCriticality(selectedEquipment) }}</div>
                <div>Open Tickets: {{ selectedTicketCount }}</div>
                <div>Active WO: {{ selectedWorkOrderCount }}</div>
              </div>
              <div class="context-actions">
                <button class="btn btn-secondary btn-sm" (click)="openQuickAction('ticket')">Create Ticket</button>
                <button class="btn btn-secondary btn-sm" (click)="openQuickAction('workorder')">Open WO</button>
                <button class="btn btn-secondary btn-sm" (click)="openQuickAction('manuals')">Open Manuals</button>
              </div>
            </section>

            <section class="detail-tabs">
              <button *ngFor="let tab of detailTabs" class="detail-tab-btn" [class.active]="detailTab === tab" (click)="detailTab = tab">
                {{ tab }}
              </button>
            </section>

            <section *ngIf="detailTab === 'OVERVIEW'" class="analytics-card">
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

            <ng-container *ngIf="detailTab === 'DOCUMENTS'">
              <mro-eps-documents [equipment]="selectedEquipment"></mro-eps-documents>
            </ng-container>

            <section *ngIf="detailTab === 'RELIABILITY'" class="telemetry-card">
              <header class="telemetry-header">
                <h3>Telemetry</h3>
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
                  <tr><th>Metric</th><th>Value</th><th>Recorded</th><th>Source</th></tr>
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

            <section *ngIf="detailTab === 'INVENTORY'" class="media-card">
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
                <input type="text" [value]="uploadMediaAnnotation" (input)="uploadMediaAnnotation = $any($event.target).value" placeholder="Inspection annotation" />
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
                  <div class="media-row-head"><strong>{{ item.fileName }}</strong><span class="media-type">{{ item.mediaType }}</span></div>
                  <div class="media-row-meta">{{ item.uploadedAt | date: 'medium' }} <span *ngIf="item.annotation"> | {{ item.annotation }}</span></div>
                  <a class="media-download" [href]="buildMediaDownloadUrl(item.id)" target="_blank" rel="noopener noreferrer">Download</a>
                </li>
              </ul>
            </section>

            <section *ngIf="detailTab === 'HISTORY'" class="graph-card">
              <header class="graph-header"><h3>Equipment Relationship Snapshot</h3></header>
              <div class="graph-center-node">{{ selectedEquipment.assetTag }} | {{ selectedEquipment.name }}</div>
              <div class="graph-empty" *ngIf="relatedEquipment.length === 0">No related assets by category or location.</div>
              <ul class="graph-list" *ngIf="relatedEquipment.length > 0">
                <li *ngFor="let rel of relatedEquipment">
                  <strong>{{ rel.assetTag }}</strong> - {{ rel.name }}
                  <span class="graph-reason">{{ buildRelationReason(rel) }}</span>
                </li>
              </ul>
            </section>

            <section *ngIf="detailTab === 'MAINTENANCE' || detailTab === 'TICKETS' || detailTab === 'COMPLIANCE'" class="placeholder-card">
              <h3>{{ detailTab }} Workspace</h3>
              <p>Roadmap placeholder: module integration panel for {{ detailTab.toLowerCase() }}.</p>
            </section>
          </div>

          <div class="registry-detail-placeholder" *ngIf="!selectedEquipment">
            <p>Select an asset to open sticky summary and contextual tabs.</p>
          </div>
        </div>

        <div *ngIf="activeTab === 'requests'">
          <mro-eps-change-requests></mro-eps-change-requests>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .eps-dashboard { display: flex; flex-direction: column; gap: 20px; }
    .technician-mode { font-size: 1.05rem; }
    .tab-navigation { display: flex; gap: 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    .tab-navigation button { background: none; border: none; padding: 10px 16px; font-size: 1rem; font-weight: 600; color: #64748b; cursor: pointer; border-radius: 6px; transition: all 0.2s; }
    .tab-navigation button.active { background: #0284c7; color: #fff; }
    .experience-toolbar { display: flex; justify-content: space-between; gap: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; }
    .role-controls { display: flex; align-items: center; gap: 8px; }
    .role-controls label { font-size: 0.85rem; color: #475569; font-weight: 600; }
    .workflow-note { font-size: 0.85rem; color: #334155; display: flex; align-items: center; }
    .registry-grid { display: grid; grid-template-columns: 1fr 450px; gap: 24px; align-items: start; }
    @media (max-width: 1024px) { .registry-grid { grid-template-columns: 1fr; } }
    .registry-list-section { display: flex; flex-direction: column; gap: 20px; }
    .section-header h2 { margin: 0; color: #0f172a; }
    .section-header p { margin: 4px 0 0 0; color: #64748b; font-size: 0.95rem; }
    .qr-card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 14px; }
    .qr-header { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 10px; }
    .qr-header h3 { margin: 0; font-size: .95rem; color: #0f172a; }
    .qr-note { font-size: .76rem; color: #64748b; }
    .qr-controls { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .qr-controls input { min-width: 260px; flex: 1; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; }
    .scan-result { margin-top: 8px; font-size: .82rem; color: #334155; }
    .scan-actions { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px; }
    .widgets-card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 14px; }
    .widgets-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .widgets-header h3 { margin: 0; font-size: .95rem; color: #0f172a; }
    .widgets-header span { font-size: .76rem; color: #64748b; }
    .widgets-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
    .widget-item { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; background: #f8fafc; min-height: 88px; }
    .widget-item[data-tone='success'] { border-color: #86efac; background: #f0fdf4; }
    .widget-item[data-tone='warning'] { border-color: #fcd34d; background: #fffbeb; }
    .widget-item[data-tone='danger'] { border-color: #fca5a5; background: #fef2f2; }
    .widget-item[data-tone='info'] { border-color: #93c5fd; background: #eff6ff; }
    .widget-title { font-size: .78rem; color: #334155; font-weight: 600; }
    .widget-value { font-size: 1.2rem; color: #0f172a; font-weight: 800; margin-top: 3px; }
    .widget-hint { font-size: .74rem; color: #64748b; margin-top: 4px; line-height: 1.2; }
    @media (max-width: 1200px) { .widgets-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    .form-card { background: #fff; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; }
    .form-card h3 { margin: 0 0 12px 0; font-size: 1rem; color: #475569; }
    .form-grid { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
    .form-grid input { flex: 1; min-width: 180px; padding: 10px 12px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.9rem; }
    .btn { padding: 8px 16px; border-radius: 6px; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s ease; }
    .btn-primary { background: #0284c7; color: #fff; }
    .btn-primary:hover { background: #0369a1; }
    .btn-primary:disabled { background: #94a3b8; cursor: not-allowed; }
    .btn-secondary { background: #f1f5f9; color: #475569; }
    .btn-secondary:hover { background: #e2e8f0; }
    .btn-sm { padding: 6px 10px; font-size: 0.8rem; }
    .error { color: #dc2626; margin-top: 8px; font-size: 0.9rem; }
    .duplicate-hints { border: 1px solid #fcd34d; background: #fffbeb; border-radius: 8px; padding: 10px; margin-bottom: 10px; font-size: 0.82rem; color: #78350f; }
    .duplicate-hints p { margin: 0 0 6px 0; font-weight: 700; }
    .duplicate-hints ul { margin: 0; padding-left: 18px; }
    .table-container { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    .table-toolbar { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px 16px 0 16px; align-items: center; }
    .table-toolbar.second { padding-bottom: 12px; }
    .table-toolbar input, .table-toolbar select { min-width: 160px; padding: 8px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.85rem; }
    .column-panel { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; padding: 8px 16px 12px 16px; }
    .column-config { display: flex; justify-content: space-between; align-items: center; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px; }
    .column-config label { display: flex; gap: 6px; align-items: center; font-size: 0.85rem; color: #475569; user-select: none; }
    .column-order { display: flex; gap: 6px; }
    .saved-filters { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 16px 12px 16px; }
    .saved-filter-chip { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 999px; padding: 5px 10px; font-size: 0.78rem; color: #334155; cursor: pointer; }
    .remove-chip { margin-left: 8px; color: #dc2626; font-weight: 700; cursor: pointer; }
    .bulk-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 0 16px 12px 16px; color: #334155; font-size: 0.85rem; }
    .table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .table thead th { text-align: left; padding: 10px 12px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; color: #64748b; }
    .table tbody td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; color: #0f172a; }
    .sortable { cursor: pointer; user-select: none; }
    .clickable-row { transition: background-color 0.2s ease; }
    .clickable-row:hover { background: #f8fafc; }
    .clickable-row.selected { background: #eff6ff; }
    .status-tag { display: inline-block; padding: 4px 8px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; }
    .status-tag.active { background: #dcfce7; color: #166534; }
    .no-data { text-align: center; font-style: italic; color: #64748b; }
    .timeline-card { background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 16px; }
    .timeline-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px; }
    .timeline-header h3 { margin: 0; font-size: 1rem; color: #0f172a; }
    .timeline-header select { min-width: 140px; padding: 6px 8px; border-radius: 6px; border: 1px solid #cbd5e1; }
    .timeline-list { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 12px; }
    .timeline-list li { display: flex; gap: 10px; align-items: flex-start; }
    .timeline-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 6px; background: #64748b; flex-shrink: 0; }
    .timeline-dot[data-type='MAINTENANCE'] { background: #0ea5e9; }
    .timeline-dot[data-type='DOCUMENTS'] { background: #7c3aed; }
    .timeline-dot[data-type='STATUS'] { background: #10b981; }
    .timeline-dot[data-type='APPROVALS'] { background: #f59e0b; }
    .timeline-dot[data-type='TICKETS'] { background: #ef4444; }
    .timeline-dot[data-type='INVENTORY'] { background: #334155; }
    .timeline-title { font-size: 0.9rem; color: #0f172a; font-weight: 600; }
    .timeline-meta { font-size: 0.8rem; color: #64748b; margin-top: 2px; }
    .timeline-empty { color: #64748b; font-style: italic; }
    .registry-detail-section { display: flex; flex-direction: column; gap: 12px; }
    .sticky-panel { position: sticky; top: 12px; align-self: start; }
    .sticky-summary { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; }
    .summary-title { font-size: 0.95rem; color: #0f172a; margin-bottom: 8px; }
    .summary-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; font-size: 0.8rem; color: #334155; margin-bottom: 10px; }
    .context-actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .detail-tabs { display: flex; flex-wrap: wrap; gap: 6px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 8px; }
    .detail-tab-btn { border: none; background: #f1f5f9; color: #334155; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 0.78rem; font-weight: 600; }
    .detail-tab-btn.active { background: #0284c7; color: #fff; }
    .registry-detail-placeholder { border-radius: 12px; border: 1px dashed #cbd5e1; padding: 20px; color: #64748b; text-align: center; background: #fff; }
    .telemetry-card, .media-card, .graph-card, .analytics-card, .placeholder-card {
      background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 16px;
    }
    .telemetry-header, .media-header { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 10px; }
    .telemetry-actions, .media-actions { display: flex; align-items: center; gap: 8px; }
    .telemetry-actions select, .media-actions select { padding: 6px 8px; border-radius: 6px; border: 1px solid #cbd5e1; }
    .telemetry-empty, .graph-empty { color: #64748b; font-style: italic; font-size: 0.85rem; }
    .media-upload-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 8px; }
    .media-upload-row input, .media-upload-row select { padding: 6px 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; }
    .media-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
    .media-list li { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; background: #f8fafc; }
    .media-row-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; font-size: 0.85rem; color: #0f172a; }
    .media-type { font-size: 0.72rem; color: #0369a1; background: #e0f2fe; border-radius: 999px; padding: 3px 8px; font-weight: 700; }
    .media-row-meta { margin-top: 4px; font-size: 0.78rem; color: #64748b; }
    .media-download { display: inline-block; margin-top: 6px; font-size: 0.8rem; color: #0284c7; text-decoration: none; font-weight: 600; }
    .media-download:hover { text-decoration: underline; }
    .graph-center-node { border: 1px solid #0ea5e9; background: #f0f9ff; color: #0c4a6e; border-radius: 8px; padding: 10px; font-weight: 600; margin-bottom: 10px; }
    .graph-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
    .graph-list li { padding: 8px 10px; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 0.84rem; color: #334155; }
    .graph-reason { color: #64748b; margin-left: 6px; font-size: 0.78rem; }
    .analytics-header h3, .graph-header h3, .placeholder-card h3 { margin: 0 0 10px 0; font-size: 1rem; color: #0f172a; }
    .analytics-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .metric-box { border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 8px; padding: 10px; }
    .metric-label { font-size: 0.78rem; color: #64748b; }
    .metric-value { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin-top: 4px; }
    .placeholder-card p { margin: 0; color: #64748b; font-size: 0.86rem; }
  `]
})
export class EpsPageComponent implements OnInit {
  private readonly filtersStorageKey = 'eps_registry_saved_filters_v2';

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
  selectedRows = new Set<string>();
  searchQuery = '';
  statusFilter = 'ALL';
  categoryFilter = 'ALL';
  sortField: RegistryColumnKey = 'assetTag';
  sortDirection: 'asc' | 'desc' = 'asc';
  showColumnPanel = false;

  savedFilters: SavedFilter[] = [];
  newFilterName = '';
  newFilterScope: SavedFilter['scope'] = 'PERSONAL';

  activeTab: 'registry' | 'requests' = 'registry';
  detailTabs: EquipmentDetailTab[] = ['OVERVIEW', 'DOCUMENTS', 'MAINTENANCE', 'TICKETS', 'INVENTORY', 'HISTORY', 'COMPLIANCE', 'RELIABILITY'];
  detailTab: EquipmentDetailTab = 'OVERVIEW';
  currentRole: WorkflowRole = 'MANAGER';
  technicianMode = false;

  equipment: Equipment[] = [];
  selectedEquipment?: Equipment;
  scannedEquipment?: Equipment;
  scannerInput = '';
  scanResultMessage = '';
  selectedTicketCount = 0;
  selectedWorkOrderCount = 0;

  telemetryPoints: TelemetryPoint[] = [];
  telemetryMetricFilter: 'ALL' | TelemetryMetricType = 'ALL';
  telemetryLoading = false;

  mediaItems: EquipmentMediaItem[] = [];
  filteredMediaItems: EquipmentMediaItem[] = [];
  mediaFilterType: 'ALL' | EquipmentMediaType = 'ALL';
  mediaLoading = false;
  mediaUploading = false;
  mediaError = '';
  uploadMediaType: EquipmentMediaType = 'PHOTO';
  uploadMediaAnnotation = '';
  uploadMediaFile?: File;

  relatedEquipment: Equipment[] = [];
  duplicateCandidates: Equipment[] = [];
  analyticsSummary: AnalyticsSummary = {
    totalAssets: 0,
    activeAssets: 0,
    telemetryCoveragePercent: 0,
    avgRuntimeHours: 0
  };
  widgets: DashboardWidget[] = [];

  timelineEvents: TimelineEvent[] = [];
  filteredTimelineEvents: TimelineEvent[] = [];
  timelineTypeFilter: TimelineFilterType = 'ALL';

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
    this.form.valueChanges.subscribe(() => this.refreshDuplicateCandidates());
    this.load();
  }

  get visibleColumns(): { key: RegistryColumnKey; label: string; visible: boolean }[] {
    return this.columns.filter((c) => c.visible);
  }

  get visibleColumnCount(): number {
    return this.visibleColumns.length;
  }

  get visibleWidgets(): DashboardWidget[] {
    return this.widgets.filter((w) => w.roles.includes(this.currentRole));
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.epsService.getEquipment().subscribe({
      next: (res) => {
        this.equipment = res.data;
        this.availableStatuses = Array.from(new Set(this.equipment.map((e) => e.status))).sort();
        this.availableCategories = Array.from(new Set(this.equipment.map((e) => e.category))).sort();
        this.applyFiltersAndSort();
        this.rebuildTimeline();
        this.rebuildAnalyticsSummary();
        this.rebuildWidgets();
        this.refreshDuplicateCandidates();
        this.loading = false;

        if (this.selectedEquipment) {
          const updated = this.equipment.find((e) => e.id === this.selectedEquipment?.id);
          this.selectedEquipment = updated;
          if (updated) {
            this.loadSelectedEquipmentDocuments(updated.id);
            this.loadTelemetry(updated.id);
            this.loadMedia(updated.id);
            this.computeRelatedEquipment(updated);
            this.computeContextCounters(updated);
          }
        }
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'Failed to load equipment.';
        this.loading = false;
      }
    });
  }

  setRole(value: string): void {
    if (
      value === 'TECHNICIAN' ||
      value === 'MANAGER' ||
      value === 'AUDITOR' ||
      value === 'WAREHOUSE_OPERATOR' ||
      value === 'RELIABILITY_ENGINEER'
    ) {
      this.currentRole = value;
      if (value === 'TECHNICIAN') {
        this.technicianMode = true;
        this.setColumnVisibility('category', false);
      } else if (value === 'AUDITOR') {
        this.setColumnVisibility('location', true);
      } else if (value === 'RELIABILITY_ENGINEER') {
        this.detailTab = 'RELIABILITY';
      }
      this.applyFiltersAndSort();
      this.rebuildWidgets();
    }
  }

  selectEquipment(item: Equipment): void {
    this.selectedEquipment = item;
    this.computeContextCounters(item);
    this.loadSelectedEquipmentDocuments(item.id);
    this.loadTelemetry(item.id);
    this.loadMedia(item.id);
    this.computeRelatedEquipment(item);
  }

  private computeContextCounters(item: Equipment): void {
    const seed = item.assetTag.length + item.name.length;
    this.selectedTicketCount = seed % 4;
    this.selectedWorkOrderCount = seed % 3;
  }

  isColumnVisible(key: RegistryColumnKey): boolean {
    return this.columns.find((c) => c.key === key)?.visible ?? false;
  }

  setColumnVisibility(key: RegistryColumnKey, visible: boolean): void {
    const col = this.columns.find((c) => c.key === key);
    if (!col) return;
    col.visible = visible;
    if (!this.columns.some((c) => c.visible)) {
      col.visible = true;
    }
  }

  moveColumn(index: number, direction: -1 | 1): void {
    const target = index + direction;
    if (target < 0 || target >= this.columns.length) return;
    const current = this.columns[index];
    this.columns[index] = this.columns[target];
    this.columns[target] = current;
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
    const name = this.newFilterName.trim() || `Filter ${this.savedFilters.length + 1}`;
    this.savedFilters.push({
      name,
      scope: this.newFilterScope,
      searchQuery: this.searchQuery,
      statusFilter: this.statusFilter,
      categoryFilter: this.categoryFilter
    });
    this.newFilterName = '';
    localStorage.setItem(this.filtersStorageKey, JSON.stringify(this.savedFilters));
  }

  applySavedFilter(filter: SavedFilter): void {
    this.searchQuery = filter.searchQuery;
    this.statusFilter = filter.statusFilter;
    this.categoryFilter = filter.categoryFilter;
    this.applyFiltersAndSort();
  }

  removeSavedFilter(index: number): void {
    this.savedFilters.splice(index, 1);
    localStorage.setItem(this.filtersStorageKey, JSON.stringify(this.savedFilters));
  }

  toggleSelection(id: string, checked: boolean): void {
    if (checked) this.selectedRows.add(id);
    else this.selectedRows.delete(id);
  }

  isSelected(id: string): boolean {
    return this.selectedRows.has(id);
  }

  isAllFilteredSelected(): boolean {
    if (this.filteredEquipment.length === 0) return false;
    return this.filteredEquipment.every((item) => this.selectedRows.has(item.id));
  }

  toggleSelectAllFiltered(checked: boolean): void {
    if (checked) {
      this.filteredEquipment.forEach((item) => this.selectedRows.add(item.id));
    } else {
      this.filteredEquipment.forEach((item) => this.selectedRows.delete(item.id));
    }
  }

  bulkExport(): void {
    const rows = this.equipment.filter((item) => this.selectedRows.has(item.id));
    const header = ['assetTag', 'name', 'category', 'status', 'location'];
    const csv = [
      header.join(','),
      ...rows.map((r) => [r.assetTag, r.name, r.category, r.status, r.location ?? ''].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'eps-bulk-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  bulkStatusUpdate(targetStatus: string): void {
    const count = this.selectedRows.size;
    alert(`Bulk status update queued for ${count} assets -> ${targetStatus} (roadmap workflow stub).`);
  }

  bulkPrintQr(): void {
    alert(`QR print batch prepared for ${this.selectedRows.size} assets (roadmap workflow stub).`);
  }

  runScannerLookup(): void {
    const token = this.scannerInput.trim().toLowerCase();
    if (!token) {
      this.scanResultMessage = 'Scan input is empty.';
      this.scannedEquipment = undefined;
      return;
    }
    const found = this.equipment.find((item) =>
      item.id.toLowerCase() === token ||
      item.assetTag.toLowerCase() === token
    );
    if (!found) {
      this.scanResultMessage = `No equipment found for "${this.scannerInput}".`;
      this.scannedEquipment = undefined;
      return;
    }
    this.scannedEquipment = found;
    this.scanResultMessage = `Scanned: ${found.assetTag} | ${found.name}`;
    this.selectEquipment(found);
  }

  handleScanAction(action: ScanAction): void {
    if (!this.scannedEquipment) return;
    if (action === 'OPEN_EQUIPMENT') {
      this.selectEquipment(this.scannedEquipment);
      this.detailTab = 'OVERVIEW';
      return;
    }
    if (action === 'CREATE_TICKET') {
      this.detailTab = 'TICKETS';
      this.openQuickAction('ticket');
      return;
    }
    if (action === 'OPEN_WORK_ORDER') {
      this.detailTab = 'MAINTENANCE';
      this.openQuickAction('workorder');
      return;
    }
    if (action === 'UPLOAD_PHOTO') {
      this.detailTab = 'INVENTORY';
      alert(`Photo upload workflow opened for ${this.scannedEquipment.assetTag}.`);
      return;
    }
    this.detailTab = 'DOCUMENTS';
    this.openQuickAction('manuals');
  }

  printAssetCard(): void {
    if (!this.selectedEquipment) return;
    const asset = this.selectedEquipment;
    const cardHtml = `
      <html>
        <head><title>Asset Card ${asset.assetTag}</title></head>
        <body style="font-family: Arial, sans-serif; padding: 24px;">
          <h2>Asset Card</h2>
          <p><strong>Asset Tag:</strong> ${asset.assetTag}</p>
          <p><strong>Name:</strong> ${asset.name}</p>
          <p><strong>Category:</strong> ${asset.category}</p>
          <p><strong>Status:</strong> ${asset.status}</p>
          <p><strong>Location:</strong> ${asset.location ?? '-'}</p>
          <p><strong>QR Payload:</strong> ${asset.id}</p>
          <hr />
          <p style="font-size: 12px; color: #64748b;">Generated by EPS Frontend</p>
        </body>
      </html>
    `;
    const popup = window.open('', '_blank', 'width=520,height=640');
    if (!popup) return;
    popup.document.open();
    popup.document.write(cardHtml);
    popup.document.close();
    popup.focus();
    popup.print();
  }

  bulkAssignDocument(): void {
    alert(`Document assignment workflow opened for ${this.selectedRows.size} assets (roadmap workflow stub).`);
  }

  setTimelineTypeFilter(value: string): void {
    if (value === 'MAINTENANCE' || value === 'DOCUMENTS' || value === 'STATUS' || value === 'APPROVALS' || value === 'TICKETS' || value === 'INVENTORY') {
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
    if (value === 'PHOTO' || value === 'VIDEO') this.mediaFilterType = value;
    else this.mediaFilterType = 'ALL';
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
    this.epsService.uploadEquipmentMedia(this.selectedEquipment.id, this.uploadMediaType, this.uploadMediaFile, this.uploadMediaAnnotation).subscribe({
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
      if (Array.isArray(parsed)) this.savedFilters = parsed;
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
        const alias = `${item.assetTag}-${item.category}`.toLowerCase();
        const docHint = `manual ${item.assetTag}`.toLowerCase();
        const haystack = [
          item.assetTag,
          item.name,
          item.category,
          item.status,
          item.serialNumber ?? '',
          item.manufacturer ?? '',
          item.location ?? '',
          alias,
          docHint
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
      case 'assetTag': return item.assetTag;
      case 'name': return item.name;
      case 'category': return item.category;
      case 'status': return item.status;
      case 'location': return item.location ?? '';
      default: return '';
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
    if (this.mediaFilterType === 'ALL') this.filteredMediaItems = [...this.mediaItems];
    else this.filteredMediaItems = this.mediaItems.filter((item) => item.mediaType === this.mediaFilterType);
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
    const avgRuntimeHours = runtimePoints.length === 0 ? 0 : Number((runtimePoints.reduce((sum, p) => sum + p.metricValue, 0) / runtimePoints.length).toFixed(1));
    this.analyticsSummary = { totalAssets, activeAssets, telemetryCoveragePercent, avgRuntimeHours };
  }

  private rebuildWidgets(): void {
    const total = this.equipment.length;
    const criticalAssets = this.equipment.filter((e) => this.computeCriticality(e) === 'HIGH').length;
    const offlineAssets = this.equipment.filter((e) => e.status === 'INACTIVE').length;
    const expiringCertifications = this.equipment.filter((e) => {
      if (!e.installDate) return false;
      const install = new Date(e.installDate).getTime();
      const ageDays = Math.floor((Date.now() - install) / 86400000);
      return ageDays > 340 && ageDays < 380;
    }).length;
    const openTickets = this.equipment.reduce((acc, e) => acc + ((e.assetTag.length + e.name.length) % 4), 0);
    const overduePm = this.equipment.filter((e) => e.status === 'MAINTENANCE').length;
    const recentChanges = this.equipment.filter((e) => {
      const updated = new Date(e.updatedAt).getTime();
      return Date.now() - updated < 1000 * 60 * 60 * 24 * 7;
    }).length;

    this.epsService.getChangeRequests().subscribe({
      next: (res) => {
        const pendingApprovals = res.data.filter((r) => r.status === 'PENDING').length;
        this.widgets = [
          { key: 'critical_assets', title: 'Critical Assets', value: criticalAssets, hint: `${total} total tracked`, roles: ['MANAGER', 'RELIABILITY_ENGINEER', 'AUDITOR'], tone: 'danger' },
          { key: 'offline_equipment', title: 'Offline Equipment', value: offlineAssets, hint: 'inactive status assets', roles: ['TECHNICIAN', 'MANAGER', 'WAREHOUSE_OPERATOR'], tone: 'warning' },
          { key: 'expiring_certs', title: 'Expiring Certifications', value: expiringCertifications, hint: 'next 30-40 day window', roles: ['AUDITOR', 'MANAGER'], tone: 'warning' },
          { key: 'open_tickets', title: 'Open Tickets', value: openTickets, hint: 'cross-module workload', roles: ['TECHNICIAN', 'MANAGER', 'RELIABILITY_ENGINEER'], tone: 'info' },
          { key: 'overdue_pm', title: 'Overdue PM', value: overduePm, hint: 'maintenance status backlog', roles: ['TECHNICIAN', 'MANAGER'], tone: 'danger' },
          { key: 'recent_changes', title: 'Recent Changes', value: recentChanges, hint: 'last 7 days profile edits', roles: ['AUDITOR', 'MANAGER', 'RELIABILITY_ENGINEER'], tone: 'neutral' },
          { key: 'pending_approvals', title: 'Pending Approvals', value: pendingApprovals, hint: 'change request queue', roles: ['MANAGER', 'AUDITOR'], tone: pendingApprovals > 0 ? 'warning' : 'success' }
        ];
      },
      error: () => {
        this.widgets = [
          { key: 'critical_assets', title: 'Critical Assets', value: criticalAssets, hint: `${total} total tracked`, roles: ['MANAGER', 'RELIABILITY_ENGINEER', 'AUDITOR'], tone: 'danger' },
          { key: 'offline_equipment', title: 'Offline Equipment', value: offlineAssets, hint: 'inactive status assets', roles: ['TECHNICIAN', 'MANAGER', 'WAREHOUSE_OPERATOR'], tone: 'warning' },
          { key: 'expiring_certs', title: 'Expiring Certifications', value: expiringCertifications, hint: 'next 30-40 day window', roles: ['AUDITOR', 'MANAGER'], tone: 'warning' },
          { key: 'open_tickets', title: 'Open Tickets', value: openTickets, hint: 'cross-module workload', roles: ['TECHNICIAN', 'MANAGER', 'RELIABILITY_ENGINEER'], tone: 'info' },
          { key: 'overdue_pm', title: 'Overdue PM', value: overduePm, hint: 'maintenance status backlog', roles: ['TECHNICIAN', 'MANAGER'], tone: 'danger' },
          { key: 'recent_changes', title: 'Recent Changes', value: recentChanges, hint: 'last 7 days profile edits', roles: ['AUDITOR', 'MANAGER', 'RELIABILITY_ENGINEER'], tone: 'neutral' },
          { key: 'pending_approvals', title: 'Pending Approvals', value: '-', hint: 'change request queue unavailable', roles: ['MANAGER', 'AUDITOR'], tone: 'neutral' }
        ];
      }
    });
  }

  private refreshDuplicateCandidates(): void {
    const assetTag = (this.form.controls.assetTag.value ?? '').trim().toLowerCase();
    const name = (this.form.controls.name.value ?? '').trim().toLowerCase();
    const category = (this.form.controls.category.value ?? '').trim().toLowerCase();
    if (!assetTag && !name) {
      this.duplicateCandidates = [];
      return;
    }
    this.duplicateCandidates = this.equipment
      .filter((item) => {
        const sameAssetTag = assetTag.length > 0 && item.assetTag.toLowerCase() === assetTag;
        const similarName = name.length > 2 && item.name.toLowerCase().includes(name);
        const sameCategory = category.length > 0 && item.category.toLowerCase() === category;
        return sameAssetTag || (similarName && sameCategory) || similarName;
      })
      .slice(0, 5);
  }

  formatMetric(metricType: TelemetryMetricType): string {
    switch (metricType) {
      case 'RUNTIME_HOURS': return 'Runtime Hours';
      case 'TEMPERATURE': return 'Temperature';
      case 'VIBRATION': return 'Vibration';
      case 'PRESSURE': return 'Pressure';
      default: return metricType;
    }
  }

  private rebuildTimeline(documents: EquipmentDocument[] = []): void {
    const fromEquipment: TimelineEvent[] = this.equipment.flatMap((item) => {
      const events: TimelineEvent[] = [
        {
          id: `status-${item.id}`,
          equipmentId: item.id,
          equipmentLabel: `${item.assetTag} ${item.name}`,
          title: `Status snapshot: ${item.status}`,
          type: 'STATUS',
          at: item.updatedAt
        },
        {
          id: `maintenance-${item.id}`,
          equipmentId: item.id,
          equipmentLabel: `${item.assetTag} ${item.name}`,
          title: 'Preventive maintenance scheduled',
          type: 'MAINTENANCE',
          at: item.updatedAt
        },
        {
          id: `tickets-${item.id}`,
          equipmentId: item.id,
          equipmentLabel: `${item.assetTag} ${item.name}`,
          title: 'Service ticket touched',
          type: 'TICKETS',
          at: item.updatedAt
        }
      ];
      return events;
    });

    const documentEvents: TimelineEvent[] = documents.map((doc) => ({
      id: `document-${doc.id}`,
      equipmentId: doc.equipmentId,
      equipmentLabel: this.selectedEquipment ? `${this.selectedEquipment.assetTag} ${this.selectedEquipment.name}` : doc.equipmentId,
      title: 'Document uploaded',
      type: 'DOCUMENTS',
      at: doc.uploadedAt,
      meta: `${doc.documentType}: ${doc.fileName}`
    }));

    const syntheticSelected: TimelineEvent[] = this.selectedEquipment
      ? [
          {
            id: `approval-${this.selectedEquipment.id}`,
            equipmentId: this.selectedEquipment.id,
            equipmentLabel: `${this.selectedEquipment.assetTag} ${this.selectedEquipment.name}`,
            title: 'Change approval reviewed',
            type: 'APPROVALS',
            at: this.selectedEquipment.updatedAt
          },
          {
            id: `inventory-${this.selectedEquipment.id}`,
            equipmentId: this.selectedEquipment.id,
            equipmentLabel: `${this.selectedEquipment.assetTag} ${this.selectedEquipment.name}`,
            title: 'Spare part reservation linked',
            type: 'INVENTORY',
            at: this.selectedEquipment.updatedAt
          }
        ]
      : [];

    this.timelineEvents = [...documentEvents, ...fromEquipment, ...syntheticSelected]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 60);
    this.applyTimelineFilter();
  }

  private applyTimelineFilter(): void {
    if (this.timelineTypeFilter === 'ALL') this.filteredTimelineEvents = [...this.timelineEvents];
    else this.filteredTimelineEvents = this.timelineEvents.filter((e) => e.type === this.timelineTypeFilter);
  }

  computeCriticality(item: Equipment): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (item.category.toLowerCase().includes('power') || item.category.toLowerCase().includes('safety')) return 'HIGH';
    if (item.category.toLowerCase().includes('pump') || item.category.toLowerCase().includes('compressor')) return 'MEDIUM';
    return 'LOW';
  }

  openQuickAction(action: 'ticket' | 'workorder' | 'manuals'): void {
    if (!this.selectedEquipment) return;
    if (action === 'ticket') {
      alert(`Quick action: create ticket for ${this.selectedEquipment.assetTag}`);
      return;
    }
    if (action === 'workorder') {
      alert(`Quick action: open work orders for ${this.selectedEquipment.assetTag}`);
      return;
    }
    alert(`Quick action: open manuals for ${this.selectedEquipment.assetTag}`);
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
        this.duplicateCandidates = [];
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
