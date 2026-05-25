import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Component, ElementRef, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap, takeUntil } from 'rxjs';
import { EpsService } from '../data/eps.service';
import {
  CreateEquipmentRequest,
  Equipment,
  EquipmentCategory,
  EquipmentDocument,
  EquipmentMediaItem,
  EquipmentMediaType,
  CreateEquipmentCategoryRequest,
  UpdateEquipmentRequest,
  UpdateEquipmentCategoryRequest,
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
  actor?: string;
  meta?: string;
  diffAvailable?: boolean;
}

interface AnalyticsSummary {
  totalAssets: number;
  activeAssets: number;
  telemetryCoveragePercent: number;
  avgRuntimeHours: number;
}

type ScanAction = 'OPEN_EQUIPMENT' | 'CREATE_TICKET' | 'OPEN_WORK_ORDER' | 'UPLOAD_PHOTO' | 'OPEN_MANUALS';
type EpsPurposeTab = 'REGISTRY' | 'EQUIPMENT' | 'OPERATIONS' | 'GOVERNANCE';

interface DashboardWidget {
  key: string;
  title: string;
  value: string | number;
  hint: string;
  roles: WorkflowRole[];
  tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
}

interface EquipmentDraft {
  id: string;
  assetTag: string;
  name: string;
  category: string;
  savedAt: string;
}

@Component({
  selector: 'mro-eps-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, EpsDocumentsComponent, EpsChangeRequestsComponent],
  template: `
    <div class="eps-dashboard" [class.technician-mode]="technicianMode">
      <!-- Premium Top Header -->
      <header class="eps-page-header">
        <div class="header-title-area">
          <div class="brand-badge">EPS</div>
          <span class="header-subtitle-text">Equipment Control Center</span>
        </div>

        <!-- Integrated Dev Tools & Info in Header -->
        <div class="header-actions-area">
          <div class="role-selector-card" *ngIf="demoMode">
            <span class="selector-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              Role:
            </span>
            <select [value]="currentRole" (change)="setRole($any($event.target).value)">
              <option value="TECHNICIAN">Technician</option>
              <option value="MANAGER">Manager</option>
              <option value="AUDITOR">Auditor</option>
              <option value="WAREHOUSE_OPERATOR">Warehouse Operator</option>
              <option value="RELIABILITY_ENGINEER">Reliability Engineer</option>
            </select>
            <button class="toggle-mode-btn" (click)="technicianMode = !technicianMode" title="Toggle Compact Mode">
              {{ technicianMode ? 'Standard UI' : 'Compact UI' }}
            </button>
          </div>
          <span class="context-badge">
            <span class="pulse-indicator"></span>
            {{ selectedEquipment?.status || 'NO SELECTION' }}
          </span>
        </div>
      </header>

      <!-- KPI Dashboard Row -->
      <section class="kpi-dashboard" *ngIf="activeTab === 'registry' && registryViewMode === 'BROWSE' && !isDetailOnlyPage">
        <article 
          class="kpi-card" 
          *ngFor="let widget of visibleWidgets | slice:0:5" 
          (click)="onKpiClick(widget.key)"
          [attr.data-tone]="widget.tone"
        >
          <div class="kpi-icon">
            <ng-container [ngSwitch]="widget.key">
              <svg *ngSwitchCase="'critical_assets'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              <svg *ngSwitchCase="'offline_equipment'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
              <svg *ngSwitchCase="'expiring_certs'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <svg *ngSwitchCase="'open_tickets'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
              <svg *ngSwitchCase="'overdue_pm'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <svg *ngSwitchDefault width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            </ng-container>
          </div>
          <div class="kpi-content">
            <span class="kpi-label">{{ widget.title }}</span>
            <div class="kpi-value-row">
              <strong class="kpi-value">{{ widget.value }}</strong>
            </div>
            <span class="kpi-hint">{{ widget.hint }}</span>
          </div>
        </article>
      </section>

      <!-- Navigation & Mode Tabs -->
      <nav class="tab-navigation-bar" *ngIf="!isDetailOnlyPage">
        <div class="nav-left">
          <button (click)="activeTab = 'registry'" [class.active]="activeTab === 'registry'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="nav-icon"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
            Equipment Registry
          </button>
          <button (click)="activeTab = 'requests'" [class.active]="activeTab === 'requests'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="nav-icon"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            Change Requests
          </button>
          <button (click)="activeTab = 'operations'" [class.active]="activeTab === 'operations'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="nav-icon"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
            Operations Scanner
          </button>
          <button (click)="activeTab = 'governance'" [class.active]="activeTab === 'governance'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="nav-icon"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Governance Audit
          </button>
        </div>
        <div class="nav-right" *ngIf="activeTab === 'registry'">
          <div class="view-mode-toggle">
            <button [class.active]="registryViewMode === 'BROWSE'" (click)="registryViewMode = 'BROWSE'">Browse Mode</button>
            <button [class.active]="registryViewMode === 'ADMIN'" (click)="registryViewMode = 'ADMIN'">Admin Mode</button>
          </div>
        </div>
      </nav>

      <!-- Feedback Messages -->
      <div class="alerts-container">
        <div class="alert alert-success" *ngIf="successMessage">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          <span>{{ successMessage }}</span>
        </div>
        <div class="alert alert-error" *ngIf="pageErrorMessage">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <span>{{ pageErrorMessage }}</span>
        </div>
      </div>

      <!-- Main Workspace Grid -->
      <main class="tab-content">
        <!-- Back Navigation Bar for Detail Only Page -->
        <div class="back-navigation-bar" *ngIf="activeTab === 'registry' && isDetailOnlyPage">
          <button class="btn btn-secondary" (click)="goBackToRegistry()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Back to Registry List
          </button>
        </div>

        <div *ngIf="activeTab === 'registry'" class="registry-grid" [class.detail-only-grid]="isDetailOnlyPage">
          
          <!-- LEFT SIDE: Controls, Toolbar & Registry Table (only visible on List view or ADMIN mode) -->
          <div class="registry-list-section" *ngIf="!isDetailOnlyPage || registryViewMode === 'ADMIN'">
            
            <!-- Quick Actions Toolbar -->
            <div class="control-toolbar">
              <div class="search-box-wrapper">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input
                  type="text"
                  [value]="searchQuery"
                  (input)="onSearchInput($any($event.target).value)"
                  placeholder="Search equipment tag, name..."
                />
              </div>
              <div class="toolbar-actions">
                <button class="btn btn-secondary" (click)="showColumnPanel = !showColumnPanel">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
                  Filters
                </button>
                <button class="btn btn-secondary" (click)="runImportStub()">Import</button>
                <button class="btn btn-secondary" (click)="exportSelectionToCsv()">Export</button>
                <button class="btn btn-primary" (click)="openAddEquipment()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  Add Equipment
                </button>
              </div>
            </div>

            <!-- Collapsible Filters Sheet -->
            <section class="collapsible-filter-sheet card-premium" *ngIf="showColumnPanel && registryViewMode === 'BROWSE'">
              <div class="filter-sheet-header">
                <h4>Advanced Search Options</h4>
                <button class="close-sheet-btn" (click)="showColumnPanel = false">×</button>
              </div>
              <div class="filter-sheet-grid">
                <div class="filter-column">
                  <span class="column-group-label">General Selectors</span>
                  <div class="selector-element-row">
                    <select [value]="statusFilter" (change)="setStatusFilter($any($event.target).value)">
                      <option value="ALL">All Statuses</option>
                      <option *ngFor="let s of availableStatuses" [value]="s">{{ s }}</option>
                    </select>
                    <select [value]="categoryFilter" (change)="setCategoryFilter($any($event.target).value)">
                      <option value="ALL">All Categories</option>
                      <option *ngFor="let c of availableCategories" [value]="c">{{ c }}</option>
                    </select>
                  </div>
                </div>
                <div class="filter-column">
                  <span class="column-group-label">Saved Scopes</span>
                  <div class="saved-filters-builder">
                    <input type="text" [value]="newFilterName" (input)="newFilterName = $any($event.target).value" placeholder="Filter name..." />
                    <select [value]="newFilterScope" (change)="newFilterScope = $any($event.target).value">
                      <option value="PERSONAL">Personal</option>
                      <option value="TEAM">Team</option>
                      <option value="GLOBAL">Global</option>
                    </select>
                    <button class="btn btn-secondary btn-sm" (click)="saveCurrentFilter()">Save</button>
                  </div>
                </div>
                <div class="filter-column">
                  <span class="column-group-label">Customize Columns</span>
                  <div class="column-checkboxes">
                    <label *ngFor="let col of columns; let i = index" class="column-checkbox-item">
                      <input type="checkbox" [checked]="col.visible" (change)="setColumnVisibility(col.key, $any($event.target).checked)" />
                      {{ col.label }}
                    </label>
                  </div>
                </div>
              </div>
            </section>

            <!-- Admin Category & Registration View -->
            <section class="admin-panel card-premium" *ngIf="registryViewMode === 'ADMIN'">
              <div class="admin-panel-split">
                <div class="category-admin-card">
                  <header class="category-admin-header">
                    <h4>Category Management</h4>
                    <span>Create & toggle equipment categories</span>
                  </header>
                  <div class="category-create-row">
                    <label>
                      <span>Code</span>
                      <input type="text" [value]="categoryCode" (input)="categoryCode = $any($event.target).value" placeholder="PUMPS" />
                    </label>
                    <label>
                      <span>Name</span>
                      <input type="text" [value]="categoryName" (input)="categoryName = $any($event.target).value" placeholder="Pump Equipment" />
                    </label>
                    <button
                      class="btn btn-primary btn-sm"
                      type="button"
                      [disabled]="categorySubmitting || !categoryCode.trim() || !categoryName.trim()"
                      (click)="createCategory()"
                    >
                      Create
                    </button>
                  </div>
                  <div class="category-feedback" *ngIf="categoriesLoading">Loading categories...</div>
                  <div class="category-feedback error" *ngIf="categoryError">{{ categoryError }}</div>
                  <div class="category-chip-list" *ngIf="!categoriesLoading && categories.length > 0">
                    <article class="category-chip" *ngFor="let c of categories">
                      <div class="category-chip-main">
                        <strong>{{ c.code }}</strong>
                        <span>{{ c.name }}</span>
                      </div>
                      <button class="btn btn-secondary btn-sm" type="button" (click)="toggleCategoryActive(c)">
                        {{ c.active ? 'Deactivate' : 'Activate' }}
                      </button>
                    </article>
                  </div>
                </div>

                <form class="form-card" [formGroup]="form" (ngSubmit)="create()">
                  <h3>Register Asset</h3>
                  <div class="form-grid">
                    <label>
                      <span>Asset Tag</span>
                      <input type="text" formControlName="assetTag" placeholder="EQ-100" />
                    </label>
                    <label>
                      <span>Asset Name</span>
                      <input type="text" formControlName="name" placeholder="Feed Pump A" />
                    </label>
                    <label>
                      <span>Category</span>
                      <select formControlName="category">
                        <option value="" disabled>Select active category</option>
                        <option *ngFor="let c of activeCategories" [value]="c.code">{{ c.code }} - {{ c.name }}</option>
                      </select>
                    </label>
                  </div>
                  <div class="draft-row">
                    <button type="button" class="btn btn-secondary btn-sm" (click)="saveEquipmentDraft()">Save Offline Draft</button>
                  </div>
                  <div class="draft-list" *ngIf="equipmentDrafts.length > 0">
                    <div class="draft-item" *ngFor="let draft of equipmentDrafts">
                      <div class="draft-meta">
                        <strong>{{ draft.assetTag || 'No Tag' }}</strong> | {{ draft.name || 'No Name' }}
                        <span>{{ draft.savedAt | date: 'short' }}</span>
                      </div>
                      <div class="draft-actions">
                        <button type="button" class="btn btn-secondary btn-sm" (click)="loadEquipmentDraft(draft.id)">Load</button>
                        <button type="button" class="btn btn-secondary btn-sm" (click)="removeEquipmentDraft(draft.id)">Remove</button>
                      </div>
                    </div>
                  </div>
                  <div class="duplicate-hints" *ngIf="duplicateCandidates.length > 0">
                    <p>Potential duplicates found:</p>
                    <ul>
                      <li *ngFor="let c of duplicateCandidates">
                        <strong>{{ c.assetTag }}</strong> - {{ c.name }} ({{ c.category }})
                      </li>
                    </ul>
                  </div>
                  <button type="submit" [disabled]="form.invalid || submitting" class="btn btn-primary w-full">
                    {{ submitting ? 'Saving...' : 'Register Asset' }}
                  </button>
                  <p *ngIf="error" class="error">{{ error }}</p>
                </form>
              </div>
            </section>

            <!-- Table & Filters section -->
            <section class="table-container card-premium" *ngIf="registryViewMode === 'BROWSE'">
              
              <!-- Saved filter tags -->
              <div class="saved-filters" *ngIf="savedFilters.length > 0">
                <button class="saved-filter-chip" *ngFor="let f of savedFilters; let idx = index" (click)="applySavedFilter(f)">
                  {{ f.name }} [{{ f.scope }}]
                  <span class="remove-chip" (click)="removeSavedFilter(idx); $event.stopPropagation()">×</span>
                </button>
              </div>

              <!-- Bulk Operations Strip -->
              <div class="bulk-toolbar" *ngIf="selectedRows.size > 0">
                <span class="selected-count"><strong>{{ selectedRows.size }}</strong> items selected</span>
                <div class="bulk-buttons">
                  <button class="btn btn-secondary btn-sm" (click)="bulkExport()">Export CSV</button>
                  <button class="btn btn-secondary btn-sm" (click)="bulkStatusUpdate('MAINTENANCE')">Set Maintenance</button>
                  <button class="btn btn-secondary btn-sm" (click)="bulkPrintQr()">Print QR</button>
                  <button class="btn btn-secondary btn-sm" (click)="bulkAssignDocument()">Assign Document</button>
                </div>
              </div>

              <!-- Main Table -->
              <div class="table-wrapper">
                <div class="table-feedback loading" *ngIf="registryLoading">Loading registry page...</div>
                <div class="table-feedback error" *ngIf="!registryLoading && registryError">{{ registryError }}</div>
                <table class="table">
                  <thead>
                    <tr>
                      <th class="checkbox-cell">
                        <input type="checkbox" [checked]="isAllVisiblePageSelected()" (change)="toggleSelectAllVisiblePage($any($event.target).checked)" />
                      </th>
                      <th *ngFor="let col of visibleColumns" (click)="sortBy(col.key)" class="sortable">
                        <div class="header-cell-content">
                          {{ col.label }}
                          <span class="sort-indicator" [class.active]="sortField === col.key">
                            {{ sortIndicator(col.key) === '^' ? '▲' : sortIndicator(col.key) === 'v' ? '▼' : '⇅' }}
                          </span>
                        </div>
                      </th>
                      <th class="action-cell">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      *ngFor="let item of paginatedEquipment"
                      [class.selected]="selectedEquipment?.id === item.id"
                      (click)="selectEquipment(item)"
                      class="clickable-row"
                    >
                      <td class="checkbox-cell" (click)="$event.stopPropagation()">
                        <input
                          type="checkbox"
                          [checked]="isSelected(item.id)"
                          (change)="toggleSelection(item.id, $any($event.target).checked)"
                        />
                      </td>
                      <td *ngFor="let col of visibleColumns">
                        <ng-container [ngSwitch]="col.key">
                          <span *ngSwitchCase="'assetTag'" class="asset-tag-label">{{ item.assetTag }}</span>
                          <span *ngSwitchCase="'name'" class="asset-name-label">{{ item.name }}</span>
                          <span *ngSwitchCase="'category'" class="asset-category-label">{{ item.category }}</span>
                          <span *ngSwitchCase="'status'">
                            <span class="status-tag" [class]="item.status">{{ item.status }}</span>
                          </span>
                          <span *ngSwitchCase="'location'" class="asset-location-label">{{ item.location || '-' }}</span>
                        </ng-container>
                      </td>
                      <td class="action-cell">
                        <button (click)="selectEquipment(item); $event.stopPropagation()" class="details-link-btn">
                          View
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </button>
                      </td>
                    </tr>
                    <tr *ngIf="filteredEquipment.length === 0 && !registryLoading">
                      <td [attr.colspan]="visibleColumnCount + 2" class="no-data-cell">
                        <div class="empty-state-view">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                          <p>{{ registryEmptyMessage }}</p>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Pager -->
              <div class="pager-row" *ngIf="totalRegistryItems > pageSize">
                <button class="btn btn-secondary btn-sm" (click)="prevPage()" [disabled]="currentPage === 1">Prev</button>
                <span class="page-indicator">Page <strong>{{ currentPage }}</strong> of {{ totalPages }}</span>
                <button class="btn btn-secondary btn-sm" (click)="nextPage()" [disabled]="currentPage === totalPages">Next</button>
              </div>
            </section>
          </div>

          <!-- RIGHT SIDE: Dedicated Detail panel (visible on Detail page) -->
          <div class="registry-detail-section sticky-panel" *ngIf="isDetailOnlyPage && registryViewMode === 'BROWSE'">
            <div class="detail-workspace-wrapper" *ngIf="selectedEquipment">
              
              <!-- Workspace Detail Content directly inside the left panel -->
              <div class="workspace-tabs-container">
                <ng-container [ngTemplateOutlet]="selectedWorkspaceTpl"></ng-container>
              </div>

            </div>
          </div>
        </div>

        <!-- Detail workspace template when selected -->
        <ng-template #selectedWorkspaceTpl>
          <div class="workspace-area">
            <!-- Feature Sub-navigation within Equipment Workspace -->
            <div class="workspace-nav-tabs">
              <div class="nav-buttons">
                <button *ngFor="let tab of detailTabs" class="workspace-tab-btn" [class.active]="detailTab === tab" (click)="onDetailTabSelect(tab)">
                  {{ tab }}
                </button>
              </div>
            </div>

            <!-- TAB CONTENT: Overview (Technical Passport of Equipment) -->
            <section *ngIf="detailTab === 'OVERVIEW'" class="passport-sheet card-premium">
              <header class="passport-title-header">
                <div class="passport-badge">OFFICIAL TECHNICAL PASSPORT</div>
                <h2 class="passport-main-title">TECHNICAL PASSPORT: {{ selectedEquipment?.name }}</h2>
                <div class="passport-subtitle">
                  <span>Standard Reference ID: <strong>{{ selectedEquipment?.assetTag }}</strong></span>
                  <span class="divider">•</span>
                  <span>Category: <strong>{{ selectedEquipment?.category }}</strong></span>
                  <span class="divider">•</span>
                  <span>Registered in EPS: <strong>{{ selectedEquipment?.createdAt | date:'mediumDate' }}</strong></span>
                </div>
              </header>

              <!-- Technical Passport Document Layout -->
              <div class="passport-sections">
                
                <!-- Section I: General Identification Details -->
                <div class="passport-section-group">
                  <h4 class="section-group-title">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="section-icon"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    I. General Asset Identification
                  </h4>
                  <div class="passport-grid">
                    <div class="passport-field">
                      <span class="field-label">Asset Name</span>
                      <strong class="field-value">{{ selectedEquipment?.name }}</strong>
                    </div>
                    <div class="passport-field">
                      <span class="field-label">Asset Tag / ID</span>
                      <strong class="field-value font-mono">{{ selectedEquipment?.assetTag }}</strong>
                    </div>
                    <div class="passport-field">
                      <span class="field-label">Equipment Category</span>
                      <strong class="field-value">{{ selectedEquipment?.category }}</strong>
                    </div>
                    <div class="passport-field">
                      <span class="field-label">Current Deployment Location</span>
                      <strong class="field-value">{{ selectedEquipment?.location || 'Not Assigned' }}</strong>
                    </div>
                  </div>
                </div>

                <!-- Section II: Manufacturing Specifications -->
                <div class="passport-section-group">
                  <h4 class="section-group-title">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="section-icon"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    II. Manufacturing & Commissioning Data
                  </h4>
                  <div class="passport-grid">
                    <div class="passport-field">
                      <span class="field-label">Manufacturer Name</span>
                      <strong class="field-value">{{ selectedEquipment?.manufacturer || 'Not Specified' }}</strong>
                    </div>
                    <div class="passport-field">
                      <span class="field-label">Model Designation</span>
                      <strong class="field-value">{{ selectedEquipment?.model || 'Not Specified' }}</strong>
                    </div>
                    <div class="passport-field">
                      <span class="field-label">Serial Number (S/N)</span>
                      <strong class="field-value font-mono">{{ selectedEquipment?.serialNumber || 'Not Specified' }}</strong>
                    </div>
                    <div class="passport-field">
                      <span class="field-label">Commissioning / Installation Date</span>
                      <strong class="field-value">{{ selectedEquipment?.installDate || 'Not Specified' }}</strong>
                    </div>
                  </div>
                </div>

                <!-- Section III: Technical Parameters & Environmental Limits -->
                <div class="passport-section-group">
                  <h4 class="section-group-title">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="section-icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                    III. Design Limits & Operational Parameters
                  </h4>
                  <div class="passport-grid">
                    <div class="passport-field">
                      <span class="field-label">Expected Lifetime</span>
                      <strong class="field-value">12 Years</strong>
                    </div>
                    <div class="passport-field">
                      <span class="field-label">Operating Temperature Range</span>
                      <strong class="field-value">-20°C to +85°C</strong>
                    </div>
                    <div class="passport-field">
                      <span class="field-label">Maximum Design Load / Pressure</span>
                      <strong class="field-value">16.0 Bar / 250 PSI</strong>
                    </div>
                    <div class="passport-field">
                      <span class="field-label">Power Consumption / Input</span>
                      <strong class="field-value">15 kW / 400V Tri-Phase</strong>
                    </div>
                  </div>
                </div>

                <!-- Section IV: Verification & Regulatory Certification -->
                <div class="passport-section-group">
                  <h4 class="section-group-title">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="section-icon"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    IV. Regulatory Compliance & Verification Stamps
                  </h4>
                  <div class="verification-stamps">
                    <div class="stamp-box approved">
                      <span class="stamp-label">EPS COMPLIANCE</span>
                      <strong class="stamp-status">VERIFIED</strong>
                      <span class="stamp-date">Date: {{ selectedEquipment?.createdAt | date:'shortDate' }}</span>
                    </div>
                    <div class="stamp-box safety">
                      <span class="stamp-label">INDUSTRIAL SAFETY</span>
                      <strong class="stamp-status">APPROVED</strong>
                      <span class="stamp-date">Class: CAT II</span>
                    </div>
                    <div class="stamp-box audit">
                      <span class="stamp-label">IMMUTABLE AUDIT LOG</span>
                      <strong class="stamp-status">SIGNED</strong>
                      <span class="stamp-date">Block: #{{ selectedEquipment?.id | slice:0:8 }}</span>
                    </div>
                  </div>
                </div>

              </div>
            </section>

            <!-- TAB CONTENT: Documents module wrapper -->
            <div *ngIf="detailTab === 'DOCUMENTS'" class="documents-module-wrapper">
              <mro-eps-documents [equipment]="selectedEquipment"></mro-eps-documents>
            </div>

            <!-- TAB CONTENT: Telemetry -->
            <section *ngIf="detailTab === 'RELIABILITY'" class="telemetry-card card-premium">
              <header class="card-header">
                <div class="header-left">
                  <h3>Sensors & Telemetry</h3>
                  <p>Real-time machine health inputs</p>
                </div>
                <div class="telemetry-actions">
                  <select [value]="telemetryMetricFilter" (change)="setTelemetryMetricFilter($any($event.target).value)">
                    <option value="ALL">All Metrics</option>
                    <option value="TEMPERATURE">Temperature</option>
                    <option value="VIBRATION">Vibration</option>
                    <option value="PRESSURE">Pressure</option>
                    <option value="RUNTIME_HOURS">Runtime Hours</option>
                  </select>
                  <button class="btn btn-secondary btn-sm" (click)="refreshTelemetry()">Refresh</button>
                </div>
              </header>
              <div class="telemetry-empty" *ngIf="telemetryLoading">Loading sensor grid...</div>
              <div class="telemetry-empty" *ngIf="!telemetryLoading && telemetryPoints.length === 0">No telemetry records found.</div>
              
              <!-- Telemetry visual grid cards with progress status -->
              <div class="sensor-grid-layout" *ngIf="!telemetryLoading && telemetryPoints.length > 0">
                <article class="sensor-card" *ngFor="let point of telemetryPoints">
                  <div class="sensor-card-head">
                    <span class="sensor-type-badge">{{ formatMetric(point.metricType) }}</span>
                    <span class="sensor-origin">{{ point.source || 'Generic' }}</span>
                  </div>
                  <div class="sensor-value-group">
                    <strong class="sensor-value">{{ point.metricValue }} {{ point.unit || '' }}</strong>
                    <div class="sensor-health-bar">
                      <div class="health-fill" [style.width.%]="point.metricValue > 100 ? 100 : point.metricValue"></div>
                    </div>
                  </div>
                  <span class="sensor-time">Recorded: {{ point.recordedAt | date: 'shortTime' }}</span>
                </article>
              </div>
            </section>

            <!-- TAB CONTENT: Inventory Media -->
            <section *ngIf="detailTab === 'INVENTORY'" class="media-card card-premium">
              <header class="card-header">
                <div>
                  <h3>Inspection & Inventory Media</h3>
                  <p>Upload visual proofs or inventory documents</p>
                </div>
                <div class="media-actions">
                  <select [value]="mediaFilterType" (change)="setMediaFilter($any($event.target).value)">
                    <option value="ALL">All Media</option>
                    <option value="PHOTO">Photos</option>
                    <option value="VIDEO">Videos</option>
                  </select>
                  <button class="btn btn-secondary btn-sm" (click)="refreshMedia()">Refresh</button>
                </div>
              </header>
              <div class="media-upload-row">
                <select [value]="uploadMediaType" (change)="uploadMediaType = $any($event.target).value">
                  <option value="PHOTO">Photo Attachment</option>
                  <option value="VIDEO">Video Attachment</option>
                </select>
                <input type="text" [value]="uploadMediaAnnotation" (input)="uploadMediaAnnotation = $any($event.target).value" placeholder="Inspection annotation notes..." />
                <input type="file" (change)="onMediaFileSelected($event)" class="file-input" />
                <button class="btn btn-primary btn-sm" (click)="uploadMedia()" [disabled]="mediaUploading || !uploadMediaFile">
                  {{ mediaUploading ? 'Uploading...' : 'Upload File' }}
                </button>
              </div>
              <p class="error" *ngIf="mediaError">{{ mediaError }}</p>
              <div class="telemetry-empty" *ngIf="mediaLoading">Retrieving media items...</div>
              <div class="telemetry-empty" *ngIf="!mediaLoading && filteredMediaItems.length === 0">No inspection media found.</div>
              
              <!-- Refined Gallery Grid for media items -->
              <div class="gallery-grid" *ngIf="!mediaLoading && filteredMediaItems.length > 0">
                <article class="gallery-item" *ngFor="let item of filteredMediaItems">
                  <div class="item-visual-fallback">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    <span class="media-type-badge">{{ item.mediaType }}</span>
                  </div>
                  <div class="gallery-item-content">
                    <strong class="item-filename">{{ item.fileName }}</strong>
                    <p class="item-meta">Date: {{ item.uploadedAt | date: 'short' }}</p>
                    <p class="item-annotation" *ngIf="item.annotation">{{ item.annotation }}</p>
                    <a class="item-download-link" [href]="buildMediaDownloadUrl(item.id)" target="_blank" rel="noopener noreferrer">
                      Download
                    </a>
                  </div>
                </article>
              </div>
            </section>

            <!-- TAB CONTENT: Relationships / History Topology -->
            <section *ngIf="detailTab === 'HISTORY'" class="graph-card card-premium">
              <header class="card-header">
                <h3>Asset Topology & Connections</h3>
                <p>Related structures by category and facility locations</p>
              </header>
              <div class="graph-center-node">{{ selectedEquipment?.assetTag }} — {{ selectedEquipment?.name }}</div>
              <div class="graph-empty" *ngIf="relatedEquipment.length === 0">No related topology items.</div>
              
              <!-- Structured hierarchical topology connectors list -->
              <div class="topology-connector-tree" *ngIf="relatedEquipment.length > 0">
                <div class="topology-branch" *ngFor="let rel of relatedEquipment">
                  <div class="branch-connector-line"></div>
                  <div class="branch-card">
                    <span class="branch-tag">{{ rel.assetTag }}</span>
                    <strong class="branch-name">{{ rel.name }}</strong>
                    <span class="branch-reason-text">{{ buildRelationReason(rel) }}</span>
                  </div>
                </div>
              </div>
            </section>

            <!-- ROADMAP TAB PLACEHOLDER -->
            <section *ngIf="detailTab === 'MAINTENANCE' || detailTab === 'TICKETS' || detailTab === 'COMPLIANCE'" class="placeholder-card card-premium">
              <div class="empty-state-view py-6">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M9 17v-5h6v5"></path></svg>
                <h3>{{ detailTab }} Interface</h3>
                <p>Enterprise cross-module connectivity for {{ detailTab | lowercase }} workspace is coming soon.</p>
              </div>
            </section>
          </div>
        </ng-template>

        <!-- CHANGE REQUESTS TAB -->
        <div *ngIf="activeTab === 'requests'">
          <mro-eps-change-requests></mro-eps-change-requests>
        </div>

        <!-- OPERATIONS SCANNER TAB -->
        <div *ngIf="activeTab === 'operations'" class="tab-content-pane">
          <section class="ops-scan-panel card-premium">
            <div class="ops-scan-header">
              <h3>Scanner & Print Utility</h3>
              <span>Manage physical barcodes and asset tagging</span>
            </div>
            <div class="qr-controls">
              <input
                type="text"
                [value]="scannerInput"
                (input)="scannerInput = $any($event.target).value"
                placeholder="Scan code or enter asset tag / equipment ID"
              />
              <button class="btn btn-primary" (click)="runScannerLookup()">Scan</button>
              <button class="btn btn-secondary" (click)="printAssetCard()" [disabled]="!selectedEquipment">
                Print Asset Card
              </button>
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
        </div>

        <!-- GOVERNANCE AUDIT TAB -->
        <div *ngIf="activeTab === 'governance'" class="tab-content-pane">
          <section class="timeline-card card-premium">
            <header class="timeline-header">
              <div class="timeline-header-title">
                <h3>Governance & Audit Trail</h3>
                <p>Comprehensive audit log and change traceability</p>
              </div>
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
            <div class="timeline-empty" *ngIf="timelineGroups.length === 0">No events found.</div>
            <div class="timeline-group" *ngFor="let group of timelineGroups">
              <div class="timeline-date">{{ group.dateLabel }}</div>
              <ul class="timeline-list">
                <li *ngFor="let event of group.events">
                  <div class="timeline-dot" [attr.data-type]="event.type"></div>
                  <div class="timeline-body">
                    <div class="timeline-title-row">
                      <span class="timeline-type-pill" [attr.data-type]="event.type">{{ event.type }}</span>
                      <div class="timeline-title">{{ event.title }}</div>
                    </div>
                    <div class="timeline-meta">
                      <strong>{{ event.equipmentLabel }}</strong> • {{ event.at | date: 'shortTime' }} • {{ event.actor || 'System' }}
                      <span *ngIf="event.meta" class="meta-separator">| {{ event.meta }}</span>
                    </div>
                    <button class="timeline-diff-link" *ngIf="event.diffAvailable" (click)="viewTimelineDiff(event)">
                      View diff details
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </section>
        </div>
      </main>
    </div>
  `,
  styles: [`


    /* Clean modern CSS using curated HSL Harmonies & CSS variables */
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .eps-dashboard {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding: 8px;
      animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Page Header */
    .eps-page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      padding-bottom: 8px;
    }

    .header-title-area {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-badge {
      background: var(--primary-gradient);
      color: white;
      font-weight: 800;
      font-size: 0.8rem;
      padding: 4px 8px;
      border-radius: var(--border-radius-sm);
      letter-spacing: 0.05em;
      box-shadow: 0 4px 10px rgba(2, 132, 199, 0.2);
    }

    .eps-page-header h1 {
      margin: 0;
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--text-color);
      letter-spacing: -0.02em;
    }

    .eps-page-header p {
      margin: 2px 0 0 0;
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .header-subtitle-text {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-muted);
    }

    .header-actions-area {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    /* Integrated Dev Tools Role Selector */
    .role-selector-card {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-md);
      padding: 6px 12px;
      box-shadow: var(--shadow-premium);
    }

    .selector-label {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .role-selector-card select {
      background: transparent !important;
      border: none !important;
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-color);
      padding: 2px 24px 2px 4px !important;
      cursor: pointer;
      box-shadow: none !important;
    }

    .toggle-mode-btn {
      background: hsl(220, 20%, 94%);
      border: none;
      color: var(--text-color);
      padding: 4px 8px;
      font-size: 0.75rem;
      font-weight: 700;
      border-radius: var(--border-radius-sm);
      cursor: pointer;
      transition: var(--transition-smooth);
    }

    .toggle-mode-btn:hover {
      background: var(--primary-color);
      color: white;
    }

    .context-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      background: hsl(220, 20%, 92%);
      padding: 6px 12px;
      border-radius: var(--border-radius-md);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .pulse-indicator {
      width: 8px;
      height: 8px;
      background-color: var(--success-color);
      border-radius: 50%;
      box-shadow: 0 0 0 0 rgba(22, 101, 52, 0.4);
      animation: pulse 1.8s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(22, 101, 52, 0.5); }
      70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(22, 101, 52, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(22, 101, 52, 0); }
    }

    /* KPI Dashboard Row */
    .kpi-dashboard {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .kpi-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      padding: 16px;
      display: flex;
      align-items: flex-start;
      gap: 14px;
      cursor: pointer;
      box-shadow: var(--shadow-premium);
      transition: var(--transition-smooth);
      position: relative;
      overflow: hidden;
    }

    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 28px -8px rgba(15, 23, 42, 0.12);
      border-color: hsla(220, 90%, 50%, 0.15);
    }

    .kpi-card::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: var(--text-muted);
    }

    .kpi-card[data-tone='success']::before { background: var(--success-color); }
    .kpi-card[data-tone='warning']::before { background: var(--warning-color); }
    .kpi-card[data-tone='danger']::before { background: var(--danger-color); }
    .kpi-card[data-tone='info']::before { background: var(--info-color); }

    .kpi-icon {
      width: 38px;
      height: 38px;
      border-radius: var(--border-radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      background: hsl(220, 20%, 96%);
      color: var(--text-color);
      flex-shrink: 0;
    }

    .kpi-card[data-tone='success'] .kpi-icon { background: var(--success-bg); color: var(--success-color); }
    .kpi-card[data-tone='warning'] .kpi-icon { background: var(--warning-bg); color: var(--warning-color); }
    .kpi-card[data-tone='danger'] .kpi-icon { background: var(--danger-bg); color: var(--danger-color); }
    .kpi-card[data-tone='info'] .kpi-icon { background: var(--info-bg); color: var(--info-color); }

    .kpi-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .kpi-label {
      font-size: 0.76rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .kpi-value {
      font-size: 1.4rem;
      font-weight: 800;
      color: var(--text-color);
      line-height: 1.1;
    }

    .kpi-hint {
      font-size: 0.72rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    /* Main Tab Navigation Bar */
    .tab-navigation-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid var(--border-color);
      padding-bottom: 2px;
    }

    .nav-left {
      display: flex;
      gap: 4px;
    }

    .nav-left button {
      background: none;
      border: none;
      padding: 12px 20px;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-muted);
      cursor: pointer;
      position: relative;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: var(--transition-smooth);
    }

    .nav-left button:hover {
      color: var(--text-color);
    }

    .nav-left button.active {
      color: var(--primary-color);
    }

    .nav-left button.active::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      right: 0;
      height: 2.5px;
      background: var(--primary-gradient);
      border-radius: 99px;
    }

    .view-mode-toggle {
      display: flex;
      background: hsl(220, 20%, 94%);
      padding: 3px;
      border-radius: var(--border-radius-md);
    }

    .view-mode-toggle button {
      border: none;
      background: transparent;
      padding: 6px 14px;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-muted);
      cursor: pointer;
      border-radius: var(--border-radius-sm);
      transition: var(--transition-smooth);
    }

    .view-mode-toggle button.active {
      background: var(--bg-card);
      color: var(--text-color);
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06);
    }

    /* Alerts */
    .alerts-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: var(--border-radius-md);
      font-size: 0.88rem;
      font-weight: 600;
      line-height: 1.4;
      animation: alertSlideIn 0.3s ease;
    }

    @keyframes alertSlideIn {
      from { transform: translateY(-8px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .alert-success { background: var(--success-bg); color: var(--success-color); border: 1px solid hsla(142, 70%, 45%, 0.1); }
    .alert-error { background: var(--danger-bg); color: var(--danger-color); border: 1px solid hsla(0, 84%, 60%, 0.1); }

    .tab-content {
      min-height: 650px;
    }

    .back-navigation-bar {
      margin-bottom: 16px;
      display: flex;
    }

    /* Layout Workspace Grid */
    .registry-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
      align-items: start;
    }

    .registry-grid.detail-only-grid {
      grid-template-columns: 1fr;
    }

    .detail-workspace-wrapper {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
      align-items: start;
    }

    .detail-sidebar {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    @media (max-width: 1100px) {
      .detail-workspace-wrapper {
        grid-template-columns: 1fr;
      }
    }

    /* Technical Passport Styles */
    .passport-sheet {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      padding: 24px;
      box-shadow: var(--shadow-premium);
      position: relative;
    }

    .passport-title-header {
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 16px;
      margin-bottom: 24px;
    }

    .passport-badge {
      display: inline-block;
      font-size: 0.68rem;
      font-weight: 600;
      color: hsl(220, 80%, 45%);
      background: hsl(220, 80%, 96%);
      padding: 3px 8px;
      border-radius: 4px;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      text-transform: uppercase;
    }

    .passport-main-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-color);
      margin: 0 0 6px 0;
      letter-spacing: -0.3px;
    }

    .passport-subtitle {
      font-size: 0.8rem;
      color: var(--text-muted);
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }

    .passport-subtitle .divider {
      color: var(--border-color);
    }

    .passport-sections {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .passport-section-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .section-group-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      color: hsl(220, 80%, 40%);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0;
      padding-bottom: 6px;
      border-bottom: 1px solid hsla(220, 15%, 85%, 0.4);
    }

    .section-icon {
      color: hsl(220, 80%, 50%);
      opacity: 0.85;
    }

    .passport-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px 24px;
      padding: 8px 0;
    }

    .passport-field {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 6px 10px;
      border-radius: var(--border-radius-sm);
      border-left: 2.5px solid transparent;
      background: hsla(220, 15%, 96%, 0.25);
      transition: var(--transition-smooth);
    }

    .passport-field:hover {
      background: hsla(220, 15%, 96%, 0.85);
      border-left-color: hsl(220, 90%, 50%);
      transform: translateX(3px);
    }

    .field-label {
      font-size: 0.68rem;
      font-weight: 500;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .field-value {
      font-size: 0.9rem;
      color: var(--text-color);
      font-weight: 500;
    }

    .verification-stamps {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin-top: 4px;
    }

    .stamp-box {
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 8px 14px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
      min-width: 150px;
      background: hsl(220, 10%, 99%);
      transition: var(--transition-smooth);
    }

    .stamp-box:hover {
      transform: translateY(-1px);
    }

    .stamp-box.approved {
      border-color: hsla(142, 76%, 50%, 0.15);
      background: hsla(142, 76%, 97%, 0.5);
    }

    .stamp-box.approved .stamp-status {
      color: var(--success-color);
    }

    .stamp-box.safety {
      border-color: hsla(35, 90%, 50%, 0.15);
      background: hsla(35, 90%, 97%, 0.5);
    }

    .stamp-box.safety .stamp-status {
      color: var(--warning-color);
    }

    .stamp-box.audit {
      border-color: hsla(220, 90%, 50%, 0.15);
      background: hsla(220, 90%, 97%, 0.5);
    }

    .stamp-box.audit .stamp-status {
      color: var(--primary-color);
    }

    .stamp-label {
      font-size: 0.65rem;
      font-weight: 600;
      color: var(--text-muted);
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .stamp-status {
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .stamp-date {
      font-size: 0.68rem;
      color: var(--text-muted);
    }

    .registry-list-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 0;
    }

    /* Control Toolbar */
    .control-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .search-box-wrapper {
      position: relative;
      flex: 1;
      max-width: 480px;
      min-width: 240px;
    }

    .search-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      pointer-events: none;
    }

    .search-box-wrapper input {
      width: 100%;
      padding-left: 40px !important;
      font-size: 0.9rem;
    }

    .toolbar-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    /* Purpose Tabs Wrapper */
    .purpose-tabs-wrapper {
      display: flex;
      gap: 6px;
      background: hsl(220, 20%, 94%);
      padding: 4px;
      border-radius: var(--border-radius-md);
      align-self: flex-start;
    }

    .purpose-tab-btn {
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-size: 0.8rem;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: var(--border-radius-sm);
      cursor: pointer;
      transition: var(--transition-smooth);
    }

    .purpose-tab-btn:hover:not(:disabled) {
      color: var(--text-color);
    }

    .purpose-tab-btn.active {
      background: var(--bg-card);
      color: var(--primary-color);
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.05);
    }

    .purpose-tab-btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    /* Advanced Collapsible Filter Sheet */
    .collapsible-filter-sheet {
      display: flex;
      flex-direction: column;
      gap: 14px;
      animation: filterSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes filterSlideDown {
      from { opacity: 0; transform: translateY(-12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .filter-sheet-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .filter-sheet-header h4 {
      margin: 0;
      font-size: 0.92rem;
      font-weight: 800;
    }

    .close-sheet-btn {
      border: none;
      background: transparent;
      font-size: 1.2rem;
      color: var(--text-muted);
      cursor: pointer;
    }

    .filter-sheet-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .filter-column {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .column-group-label {
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      color: var(--text-muted);
      letter-spacing: 0.03em;
    }

    .selector-element-row {
      display: flex;
      gap: 8px;
    }

    .selector-element-row select {
      flex: 1;
      font-size: 0.8rem;
    }

    .column-checkboxes {
      display: flex;
      flex-wrap: wrap;
      gap: 6px 12px;
    }

    .column-checkbox-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text-color);
      cursor: pointer;
    }

    /* Operational & Scanner Panels */
    .ops-scan-panel {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .ops-scan-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 800;
    }

    .ops-scan-header span {
      font-size: 0.76rem;
      color: var(--text-muted);
    }

    .qr-controls {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .qr-controls input {
      flex: 1;
      min-width: 200px;
    }

    .scan-result {
      background: hsl(220, 20%, 96%);
      padding: 10px 14px;
      border-radius: var(--border-radius-sm);
      font-size: 0.84rem;
      font-weight: 600;
      border-left: 3px solid var(--primary-color);
    }

    .scan-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    /* Admin Category Configuration Panel */
    .admin-panel-split {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    @media (max-width: 768px) {
      .admin-panel-split { grid-template-columns: 1fr; }
    }

    .category-admin-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .category-admin-header h4 {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 800;
    }

    .category-admin-header span {
      font-size: 0.74rem;
      color: var(--text-muted);
    }

    .category-create-row {
      display: grid;
      grid-template-columns: 80px 1fr auto;
      gap: 8px;
      align-items: flex-end;
    }

    .category-create-row label {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--text-muted);
    }

    /* Form Layout Elements */
    .form-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-card h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 800;
      color: var(--text-color);
    }

    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .form-grid label {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 0.76rem;
      font-weight: 700;
      color: var(--text-muted);
    }

    .form-grid input, .form-grid select {
      width: 100%;
      box-sizing: border-box;
    }

    .category-chip-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 180px;
      overflow-y: auto;
      padding-right: 4px;
    }

    .category-chip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-md);
      padding: 8px 12px;
      background: hsl(220, 20%, 97%);
    }

    .category-chip-main strong {
      font-size: 0.8rem;
      color: var(--text-color);
    }

    .category-chip-main span {
      font-size: 0.74rem;
      color: var(--text-muted);
      margin-left: 6px;
    }

    /* Premium Table layout styling */
    .table-container {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: 0 !important;
    }

    .table-filters-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-bottom: 1px solid var(--border-color);
      flex-wrap: wrap;
    }

    .filter-controls-group {
      display: flex;
      gap: 8px;
    }

    .filter-controls-group select {
      font-size: 0.8rem;
      font-weight: 600;
      padding: 8px 24px 8px 10px !important;
    }

    .saved-filters-builder {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .saved-filters-builder input {
      font-size: 0.8rem;
      padding: 8px 10px !important;
      width: 140px;
    }

    .saved-filters-builder select {
      font-size: 0.8rem;
      padding: 8px 24px 8px 10px !important;
      width: 100px;
    }

    .column-panel {
      background: hsl(220, 20%, 97%);
      border-bottom: 1px solid var(--border-color);
      padding: 12px 16px;
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }

    .column-config {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.78rem;
      font-weight: 600;
    }

    .column-order {
      display: flex;
      gap: 2px;
    }

    .saved-filters {
      padding: 10px 16px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .saved-filter-chip {
      background: hsl(220, 20%, 94%);
      border: 1px solid var(--border-color);
      border-radius: 99px;
      padding: 4px 10px;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--text-color);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .remove-chip {
      color: var(--text-muted);
      font-size: 0.88rem;
      line-height: 1;
    }

    .bulk-toolbar {
      background: hsla(220, 90%, 50%, 0.05);
      border-bottom: 1px solid var(--border-color);
      padding: 10px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .selected-count {
      font-size: 0.8rem;
      color: var(--primary-color);
    }

    .bulk-buttons {
      display: flex;
      gap: 6px;
    }

    /* Main raw table rules */
    .table-wrapper {
      overflow-x: auto;
      width: 100%;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .table th {
      padding: 12px 16px;
      font-size: 0.72rem;
    }

    .checkbox-cell {
      width: 46px;
      text-align: center;
      padding: 12px 6px !important;
    }

    .header-cell-content {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .sort-indicator {
      font-size: 0.65rem;
      color: var(--text-muted);
      opacity: 0.4;
      transition: var(--transition-smooth);
    }

    .sort-indicator.active {
      opacity: 1;
      color: var(--primary-color);
    }

    .clickable-row {
      cursor: pointer;
      transition: var(--transition-smooth);
    }

    .table td {
      padding: 14px 16px;
      font-size: 0.86rem;
      vertical-align: middle;
    }

    .asset-tag-label {
      font-weight: 700;
      color: var(--text-color);
      font-family: monospace;
      font-size: 0.84rem;
    }

    .asset-name-label {
      font-weight: 600;
      color: var(--text-color);
    }

    .asset-category-label, .asset-location-label {
      color: var(--text-muted);
    }

    .action-cell {
      width: 90px;
      text-align: right;
    }

    .details-link-btn {
      background: transparent;
      border: none;
      color: var(--primary-color);
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: var(--border-radius-sm);
      transition: var(--transition-smooth);
    }

    .details-link-btn:hover {
      background: hsla(220, 90%, 50%, 0.08);
    }

    /* Pager area */
    .pager-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px;
      border-top: 1px solid var(--border-color);
      background: hsl(220, 20%, 98%);
    }

    .page-indicator {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    /* Empty states */
    .empty-state-view {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 32px;
      color: var(--text-muted);
      gap: 8px;
    }

    .empty-state-view h3 {
      margin: 0;
      color: var(--text-color);
      font-size: 1rem;
      font-weight: 800;
    }

    .empty-state-view p {
      margin: 0;
      font-size: 0.84rem;
      max-width: 320px;
    }

    /* STICKY DETAIL PANEL SIDEBAR (Right) */
    .sticky-panel {
      position: sticky;
      top: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .sticky-summary {
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .summary-meta-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .meta-tag {
      background: hsl(220, 20%, 94%);
      color: var(--text-color);
      font-size: 0.68rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 99px;
      text-transform: uppercase;
    }

    .summary-asset-title {
      margin: 0 0 4px 0;
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-color);
      line-height: 1.2;
    }

    .summary-asset-tag {
      font-family: monospace;
      font-size: 0.84rem;
      color: var(--text-muted);
      margin-bottom: 20px;
    }

    .summary-details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 8px;
      border-top: 1px solid var(--border-color);
      padding-top: 16px;
      margin-bottom: 20px;
    }

    .grid-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .item-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .item-val {
      font-size: 0.84rem;
      color: var(--text-color);
    }

    .critical-high {
      color: var(--danger-color);
      font-weight: 700;
    }

    .context-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      border-top: 1px solid var(--border-color);
      padding-top: 16px;
    }

    .context-actions button {
      flex: 1;
      min-width: 110px;
    }

    /* Quick mini edit card */
    .quick-edit-card h3 {
      margin: 0 0 10px 0;
      font-size: 0.9rem;
      font-weight: 800;
    }

    .edit-form-fields {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .edit-form-fields label {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--text-muted);
    }

    .edit-form-fields input, .edit-form-fields select {
      font-size: 0.84rem;
      padding: 8px 10px !important;
    }

    /* Fallback placeholder sidebar */
    .registry-detail-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 40px 24px;
      color: var(--text-muted);
      min-height: 300px;
      gap: 12px;
    }

    .placeholder-icon {
      color: var(--border-color);
    }

    .registry-detail-placeholder h4 {
      margin: 0;
      color: var(--text-color);
      font-size: 0.95rem;
      font-weight: 800;
    }

    .registry-detail-placeholder p {
      margin: 0;
      font-size: 0.78rem;
      line-height: 1.5;
    }

    /* WORKSPACE MODE DETAILED AREA */
    .workspace-area {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-height: 480px;
      animation: workspaceSlideIn 0.3s ease;
    }

    @keyframes workspaceSlideIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .workspace-nav-tabs {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      padding: 4px 4px 12px 4px;
    }

    .nav-title-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .nav-title-group h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 800;
      font-family: monospace;
    }

    .nav-buttons {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }

    .workspace-tab-btn {
      background: transparent;
      border: none;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      padding: 8px 14px;
      border-radius: var(--border-radius-md);
      cursor: pointer;
      transition: var(--transition-smooth);
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .workspace-tab-btn:hover {
      background: hsl(220, 20%, 94%);
      color: var(--text-color);
    }

    .workspace-tab-btn.active {
      background: var(--primary-gradient);
      color: white !important;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.15);
    }

    /* Detail Card Overviews */
    .card-header h3 {
      margin: 0 0 4px 0;
      font-size: 1rem;
      font-weight: 800;
    }

    .card-header p {
      margin: 0;
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .analytics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
      margin-top: 16px;
    }

    .metric-box {
      background: hsl(220, 20%, 97%);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-md);
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .metric-label {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .metric-value {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-color);
    }

    /* Telemetry Current */
    .telemetry-card .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 12px;
      margin-bottom: 14px;
    }

    .telemetry-actions {
      display: flex;
      gap: 8px;
    }

    .telemetry-actions select {
      font-size: 0.8rem;
      padding: 6px 20px 6px 10px !important;
    }

    .telemetry-empty {
      font-style: italic;
      color: var(--text-muted);
      font-size: 0.84rem;
      padding: 24px 0;
      text-align: center;
    }

    .metric-badge {
      background: hsl(220, 20%, 93%);
      color: var(--text-color);
      padding: 4px 10px;
      border-radius: 99px;
      font-weight: 700;
      font-size: 0.8rem;
    }

    /* Media List Inspection attachments */
    .media-upload-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      background: hsl(220, 20%, 97%);
      padding: 10px 14px;
      border-radius: var(--border-radius-md);
      margin-top: 14px;
      margin-bottom: 14px;
    }

    .media-upload-row select, .media-upload-row input {
      font-size: 0.78rem;
      padding: 6px 10px !important;
    }

    .file-input {
      background: transparent !important;
      border: none !important;
      padding: 0 !important;
      font-size: 0.76rem;
      max-width: 180px;
    }

    /* Sensor Grid Layout (Telemetry view) */
    .sensor-grid-layout {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 12px;
    }

    .sensor-card {
      background: hsl(220, 20%, 97%);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: var(--transition-smooth);
    }

    .sensor-card:hover {
      background: var(--bg-card);
      border-color: hsla(220, 90%, 50%, 0.15);
      transform: translateY(-1px);
    }

    .sensor-card-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .sensor-type-badge {
      font-size: 0.72rem;
      font-weight: 800;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    .sensor-origin {
      font-size: 0.7rem;
      font-family: monospace;
      color: var(--text-muted);
    }

    .sensor-value-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .sensor-value {
      font-size: 1.4rem;
      font-weight: 800;
      color: var(--text-color);
    }

    .sensor-health-bar {
      height: 6px;
      background: hsl(220, 20%, 90%);
      border-radius: 99px;
      overflow: hidden;
    }

    .health-fill {
      height: 100%;
      background: var(--primary-gradient);
      border-radius: 99px;
      transition: width 0.6s ease;
    }

    .sensor-time {
      font-size: 0.68rem;
      color: var(--text-muted);
    }

    /* Media Visual Gallery Grid */
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-top: 12px;
    }

    .gallery-item {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-premium);
      transition: var(--transition-smooth);
    }

    .gallery-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 24px -6px rgba(15, 23, 42, 0.1);
      border-color: hsla(220, 90%, 50%, 0.15);
    }

    .item-visual-fallback {
      height: 100px;
      background: hsl(220, 20%, 97%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      position: relative;
    }

    .media-type-badge {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: var(--info-bg);
      color: var(--info-color);
      font-size: 0.62rem;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: var(--border-radius-sm);
    }

    .gallery-item-content {
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .item-filename {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-color);
      word-break: break-all;
    }

    .item-meta {
      font-size: 0.68rem;
      color: var(--text-muted);
    }

    .item-annotation {
      font-size: 0.72rem;
      color: var(--text-color);
      background: hsl(220, 20%, 96%);
      padding: 4px 8px;
      border-radius: var(--border-radius-sm);
      margin-top: 4px;
    }

    .item-download-link {
      font-size: 0.76rem;
      font-weight: 700;
      color: var(--primary-color);
      text-decoration: none;
      margin-top: 8px;
      align-self: flex-start;
    }

    .item-download-link:hover {
      text-decoration: underline;
    }

    /* Topology Connector Tree */
    .topology-connector-tree {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 14px;
      position: relative;
      padding-left: 20px;
    }

    .topology-connector-tree::before {
      content: '';
      position: absolute;
      left: 6px;
      top: 0;
      bottom: 24px;
      width: 2px;
      background: var(--border-color);
    }

    .topology-branch {
      position: relative;
      display: flex;
      align-items: center;
    }

    .branch-connector-line {
      position: absolute;
      left: -14px;
      top: 50%;
      width: 14px;
      height: 2px;
      background: var(--border-color);
    }

    .branch-card {
      background: hsl(220, 20%, 97%);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-md);
      padding: 8px 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      flex: 1;
    }

    .branch-tag {
      font-family: monospace;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--primary-color);
    }

    .branch-name {
      font-size: 0.8rem;
      color: var(--text-color);
    }

    .branch-reason-text {
      font-size: 0.72rem;
      color: var(--text-muted);
    }

    /* Complete edit panel */
    .edit-card h3 {
      margin: 0 0 4px 0;
      font-size: 1rem;
      font-weight: 800;
    }

    .edit-card span {
      font-size: 0.76rem;
      color: var(--text-muted);
      display: block;
      margin-bottom: 14px;
    }

    .edit-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }

    .edit-grid label {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--text-muted);
    }

    .edit-actions {
      display: flex;
      gap: 8px;
    }

    /* Tech mode overrides for accessibility */
    .technician-mode {
      font-size: 1.02rem;
    }

    .technician-mode input, .technician-mode select {
      padding: 12px 14px !important;
      font-size: 0.92rem !important;
    }

    .technician-mode .btn {
      padding: 12px 20px !important;
      font-size: 0.9rem !important;
    }

    /* Utilities */
    .w-full { width: 100%; }
    .mt-2 { margin-top: 8px; }
    .mt-4 { margin-top: 16px; }
    .py-6 { padding-top: 24px; padding-bottom: 24px; }
    .py-12 { padding-top: 48px; padding-bottom: 48px; }
    .font-semibold { font-weight: 600; }
  `]
})
export class EpsPageComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly searchQueryInput$ = new Subject<string>();
  private readonly registryLoadTrigger$ = new Subject<void>();

  private readonly filtersStorageKey = 'eps_registry_saved_filters_v2';
  private readonly equipmentDraftsStorageKey = 'eps_equipment_drafts_v1';

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
  paginatedEquipment: Equipment[] = [];
  pageSize = 20;
  currentPage = 1;
  totalRegistryItems = 0;
  totalRegistryPages = 1;
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

  activeTab: 'registry' | 'requests' | 'operations' | 'governance' = 'registry';
  isDetailOnlyPage = false;
  detailTabs: EquipmentDetailTab[] = ['OVERVIEW', 'DOCUMENTS', 'MAINTENANCE', 'TICKETS', 'INVENTORY', 'HISTORY', 'COMPLIANCE', 'RELIABILITY'];
  detailTab: EquipmentDetailTab = 'OVERVIEW';
  currentRole: WorkflowRole = 'MANAGER';
  purposeTab: EpsPurposeTab = 'REGISTRY';
  isCompactViewport = false;
  technicianMode = false;
  registryViewMode: 'BROWSE' | 'ADMIN' = 'BROWSE';
  showOpsInsights = false;
  showTimeline = false;
  showEditPanel = false;
  showViewSettings = false;
  readonly demoMode = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

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
  telemetryLoadedForEquipmentId?: string;
  mediaLoadedForEquipmentId?: string;

  relatedEquipment: Equipment[] = [];
  duplicateCandidates: Equipment[] = [];
  analyticsSummary: AnalyticsSummary = {
    totalAssets: 0,
    activeAssets: 0,
    telemetryCoveragePercent: 0,
    avgRuntimeHours: 0
  };
  widgets: DashboardWidget[] = this.buildFallbackWidgets();
  equipmentDrafts: EquipmentDraft[] = [];

  timelineEvents: TimelineEvent[] = [];
  filteredTimelineEvents: TimelineEvent[] = [];
  timelineTypeFilter: TimelineFilterType = 'ALL';

  loading = false;
  registryLoading = false;
  submitting = false;
  error = '';
  registryError = '';
  categories: EquipmentCategory[] = [];
  categoriesLoading = false;
  categoryError = '';
  categorySubmitting = false;
  categoryCode = '';
  categoryName = '';
  editSubmitting = false;
  editError = '';
  successMessage = '';
  pageErrorMessage = '';

  readonly form = this.fb.group({
    assetTag: ['', [Validators.required, Validators.maxLength(64)]],
    name: ['', [Validators.required, Validators.maxLength(255)]],
    category: ['', [Validators.required, Validators.maxLength(128)]]
  });
  readonly editForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    category: ['', [Validators.required, Validators.maxLength(128)]],
    location: ['', [Validators.maxLength(255)]],
    manufacturer: ['', [Validators.maxLength(255)]],
    model: ['', [Validators.maxLength(255)]],
    serialNumber: ['', [Validators.maxLength(128)]],
    installDate: ['']
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly epsService: EpsService,
    private readonly hostElement: ElementRef<HTMLElement>,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  @HostListener('document:keydown.escape')
  onEscapePressed(): void {
    this.showViewSettings = false;
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.syncViewportMode();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.showViewSettings) return;
    const target = event.target as Node | null;
    if (!target) return;
    if (!this.hostElement.nativeElement.contains(target)) {
      this.showViewSettings = false;
    }
  }

  ngOnInit(): void {
    this.syncViewportMode();
    this.loadSavedFilters();
    this.loadEquipmentDrafts();
    this.form.valueChanges.subscribe(() => this.refreshDuplicateCandidates());
    this.searchQueryInput$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        this.searchQuery = value;
        this.applyFiltersAndSort();
      });
    this.registryLoadTrigger$
      .pipe(
        switchMap(() => this.epsService.getEquipmentRegistryPage({
          status: this.statusFilter,
          category: this.categoryFilter,
          query: this.searchQuery,
          page: this.currentPage - 1,
          size: this.pageSize,
          sortBy: this.sortField,
          sortDirection: this.sortDirection
        }).pipe(
          catchError((err) => {
            this.registryError = this.buildUserError(err, 'Failed to load registry page.');
            return of({
              data: {
                items: [],
                page: 0,
                size: this.pageSize,
                totalItems: 0,
                totalPages: 1
              },
              meta: {},
              errors: []
            });
          })
        )),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        this.paginatedEquipment = res.data.items;
        this.filteredEquipment = res.data.items;
        this.totalRegistryItems = res.data.totalItems;
        this.totalRegistryPages = Math.max(1, res.data.totalPages);
        this.registryLoading = false;
      });
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.isDetailOnlyPage = true;
        if (this.equipment.length > 0) {
          const found = this.equipment.find((e) => e.id === id);
          if (found) {
            this.loadSelectedEquipmentDetails(found);
          }
        }
      } else {
        this.isDetailOnlyPage = false;
        this.selectedEquipment = undefined;
      }
    });
    this.loadCategories();
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get visibleColumns(): { key: RegistryColumnKey; label: string; visible: boolean }[] {
    return this.columns.filter((c) => c.visible);
  }

  get visibleColumnCount(): number {
    return this.visibleColumns.length;
  }

  get totalPages(): number {
    return Math.max(1, this.totalRegistryPages);
  }

  get visibleWidgets(): DashboardWidget[] {
    const roleWidgets = this.widgets.filter((w) => w.roles.includes(this.currentRole));
    if (roleWidgets.length > 0) return roleWidgets;
    return this.buildFallbackWidgets().filter((w) => w.roles.includes(this.currentRole));
  }

  get activeCategories(): EquipmentCategory[] {
    return this.categories.filter((c) => c.active);
  }

  get registryEmptyMessage(): string {
    if (this.registryLoading) return 'Loading equipment...';
    if (this.searchQuery.trim().length > 0) return 'No search results. Try a broader query.';
    if (this.statusFilter !== 'ALL' || this.categoryFilter !== 'ALL') return 'No equipment matches current filters.';
    if (this.equipment.length === 0) return 'No equipment in registry yet. Use + Add Equipment to create the first asset.';
    return 'No equipment matches current filters.';
  }

  get timelineGroups(): { dateLabel: string; events: TimelineEvent[] }[] {
    const groups = new Map<string, TimelineEvent[]>();
    for (const event of this.filteredTimelineEvents) {
      const dateKey = new Date(event.at).toDateString();
      if (!groups.has(dateKey)) groups.set(dateKey, []);
      groups.get(dateKey)!.push(event);
    }
    return Array.from(groups.entries()).map(([dateLabel, events]) => ({ dateLabel, events }));
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.pageErrorMessage = '';
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

        const targetId = this.route.snapshot.paramMap.get('id') || this.selectedEquipment?.id;
        if (targetId) {
          const found = this.equipment.find((e) => e.id === targetId);
          if (found) {
            this.loadSelectedEquipmentDetails(found);
          }
        }
      },
      error: (err) => {
        this.error = this.buildUserError(err, 'Failed to load equipment.');
        this.pageErrorMessage = this.error;
        this.widgets = this.buildFallbackWidgets();
        this.loading = false;
      }
    });
  }

  loadCategories(): void {
    this.categoriesLoading = true;
    this.categoryError = '';
    this.epsService.getCategories().subscribe({
      next: (res) => {
        this.categories = [...res.data].sort((a, b) => a.code.localeCompare(b.code));
        this.categoriesLoading = false;
      },
      error: (err) => {
        this.categoryError = this.buildUserError(err, 'Failed to load categories.');
        this.categoriesLoading = false;
      }
    });
  }

  createCategory(): void {
    const code = this.categoryCode.trim().toUpperCase();
    const name = this.categoryName.trim();
    if (!code || !name) return;

    const payload: CreateEquipmentCategoryRequest = { code, name };
    this.categorySubmitting = true;
    this.categoryError = '';
    this.epsService.createCategory(payload).subscribe({
      next: () => {
        this.categoryCode = '';
        this.categoryName = '';
        this.categorySubmitting = false;
        this.showSuccess('Category created successfully.');
        this.loadCategories();
      },
      error: (err) => {
        this.categoryError = this.buildUserError(err, 'Failed to create category.');
        this.pageErrorMessage = this.categoryError;
        this.categorySubmitting = false;
      }
    });
  }

  toggleCategoryActive(category: EquipmentCategory): void {
    const payload: UpdateEquipmentCategoryRequest = {
      name: category.name,
      parentId: category.parentId ?? null,
      isActive: !category.active
    };
    this.categoryError = '';
    this.epsService.updateCategory(category.id, payload).subscribe({
      next: () => {
        this.showSuccess('Category status updated.');
        this.loadCategories();
      },
      error: (err) => {
        this.categoryError = this.buildUserError(err, 'Failed to update category status.');
        this.pageErrorMessage = this.categoryError;
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
        this.onDetailTabSelect('RELIABILITY');
      }
      this.applyFiltersAndSort();
      this.rebuildWidgets();
    }
  }

  setPurposeTab(tab: EpsPurposeTab): void {
    if (tab === 'EQUIPMENT' && !this.selectedEquipment) {
      this.purposeTab = 'REGISTRY';
      return;
    }
    this.purposeTab = tab;
  }

  selectEquipment(item: Equipment): void {
    this.router.navigate(['/eps', item.id]);
  }

  loadSelectedEquipmentDetails(item: Equipment): void {
    this.selectedEquipment = item;
    this.editError = '';
    this.showEditPanel = false;
    this.editForm.patchValue({
      name: item.name ?? '',
      category: item.category ?? '',
      location: item.location ?? '',
      manufacturer: item.manufacturer ?? '',
      model: item.model ?? '',
      serialNumber: item.serialNumber ?? '',
      installDate: item.installDate ?? ''
    });
    this.computeContextCounters(item);
    this.loadSelectedEquipmentDocuments(item.id);
    this.computeRelatedEquipment(item);
    this.lazyLoadDetailData();
    this.onDetailTabSelect('OVERVIEW');
    if (this.isCompactViewport) {
      this.purposeTab = 'EQUIPMENT';
    }
  }

  goBackToRegistry(): void {
    this.router.navigate(['/eps']);
  }

  private syncViewportMode(): void {
    this.isCompactViewport = typeof window !== 'undefined' && window.innerWidth <= 1200;
  }

  saveEquipmentEdit(): void {
    if (!this.selectedEquipment || this.editForm.invalid) return;
    const payload: UpdateEquipmentRequest = {
      name: this.editForm.controls.name.value ?? '',
      category: this.editForm.controls.category.value ?? '',
      location: (this.editForm.controls.location.value ?? '').trim() || undefined,
      manufacturer: (this.editForm.controls.manufacturer.value ?? '').trim() || undefined,
      model: (this.editForm.controls.model.value ?? '').trim() || undefined,
      serialNumber: (this.editForm.controls.serialNumber.value ?? '').trim() || undefined,
      installDate: (this.editForm.controls.installDate.value ?? '').trim() || undefined
    };
    this.editSubmitting = true;
    this.editError = '';
    this.epsService.updateEquipment(this.selectedEquipment.id, payload).subscribe({
      next: () => {
        this.editSubmitting = false;
        this.showSuccess('Equipment updated successfully.');
        this.load();
      },
      error: (err) => {
        this.editError = this.buildUserError(err, 'Failed to update equipment.');
        this.pageErrorMessage = this.editError;
        this.editSubmitting = false;
      }
    });
  }

  cancelEdit(): void {
    if (!this.selectedEquipment) return;
    this.editError = '';
    this.editForm.reset({
      name: this.selectedEquipment.name ?? '',
      category: this.selectedEquipment.category ?? '',
      location: this.selectedEquipment.location ?? '',
      manufacturer: this.selectedEquipment.manufacturer ?? '',
      model: this.selectedEquipment.model ?? '',
      serialNumber: this.selectedEquipment.serialNumber ?? '',
      installDate: this.selectedEquipment.installDate ?? ''
    });
    this.showEditPanel = false;
  }

  openAddEquipment(): void {
    this.registryViewMode = 'ADMIN';
    this.showSuccess('Switched to Admin Mode for equipment registration.');
  }

  runImportStub(): void {
    this.showSuccess('Import workflow is available in the next EPS release.');
  }

  exportSelectionToCsv(): void {
    this.bulkExport();
  }

  onKpiClick(key: string): void {
    if (key === 'critical_assets') {
      this.statusFilter = 'ACTIVE';
      this.applyFiltersAndSort();
      return;
    }
    if (key === 'offline_equipment') {
      this.statusFilter = 'INACTIVE';
      this.applyFiltersAndSort();
      return;
    }
    if (key === 'overdue_pm') {
      this.detailTab = 'MAINTENANCE';
      return;
    }
    if (key === 'open_tickets') {
      this.detailTab = 'TICKETS';
      return;
    }
    if (key === 'recent_changes') {
      this.showTimeline = true;
      return;
    }
    if (key === 'pending_approvals') {
      this.activeTab = 'requests';
    }
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
    this.searchQueryInput$.next(value);
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

  isAllVisiblePageSelected(): boolean {
    if (this.paginatedEquipment.length === 0) return false;
    return this.paginatedEquipment.every((item) => this.selectedRows.has(item.id));
  }

  toggleSelectAllVisiblePage(checked: boolean): void {
    if (checked) {
      this.paginatedEquipment.forEach((item) => this.selectedRows.add(item.id));
    } else {
      this.paginatedEquipment.forEach((item) => this.selectedRows.delete(item.id));
    }
  }

  toggleSelectAllFiltered(checked: boolean): void {
    if (checked) {
      this.filteredEquipment.forEach((item) => this.selectedRows.add(item.id));
    } else {
      this.filteredEquipment.forEach((item) => this.selectedRows.delete(item.id));
    }
  }

  nextPage(): void {
    if (this.currentPage >= this.totalPages) return;
    this.currentPage += 1;
    this.applyPagination();
  }

  prevPage(): void {
    if (this.currentPage <= 1) return;
    this.currentPage -= 1;
    this.applyPagination();
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
    this.activeTab = 'registry';
    if (action === 'OPEN_EQUIPMENT') {
      this.selectEquipment(this.scannedEquipment);
      this.onDetailTabSelect('OVERVIEW');
      return;
    }
    if (action === 'CREATE_TICKET') {
      this.onDetailTabSelect('TICKETS');
      this.openQuickAction('ticket');
      return;
    }
    if (action === 'OPEN_WORK_ORDER') {
      this.onDetailTabSelect('MAINTENANCE');
      this.openQuickAction('workorder');
      return;
    }
    if (action === 'UPLOAD_PHOTO') {
      this.onDetailTabSelect('INVENTORY');
      alert(`Photo upload workflow opened for ${this.scannedEquipment.assetTag}.`);
      return;
    }
    this.onDetailTabSelect('DOCUMENTS');
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

  private loadEquipmentDrafts(): void {
    const raw = localStorage.getItem(this.equipmentDraftsStorageKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) this.equipmentDrafts = parsed;
    } catch {
      this.equipmentDrafts = [];
    }
  }

  private persistEquipmentDrafts(): void {
    localStorage.setItem(this.equipmentDraftsStorageKey, JSON.stringify(this.equipmentDrafts));
  }

  saveEquipmentDraft(): void {
    const draft: EquipmentDraft = {
      id: crypto.randomUUID(),
      assetTag: this.form.controls.assetTag.value ?? '',
      name: this.form.controls.name.value ?? '',
      category: this.form.controls.category.value ?? '',
      savedAt: new Date().toISOString()
    };
    this.equipmentDrafts.unshift(draft);
    this.persistEquipmentDrafts();
  }

  loadEquipmentDraft(id: string): void {
    const draft = this.equipmentDrafts.find((d) => d.id === id);
    if (!draft) return;
    this.form.patchValue({
      assetTag: draft.assetTag,
      name: draft.name,
      category: draft.category
    });
    this.refreshDuplicateCandidates();
  }

  removeEquipmentDraft(id: string): void {
    this.equipmentDrafts = this.equipmentDrafts.filter((d) => d.id !== id);
    this.persistEquipmentDrafts();
  }

  private applyFiltersAndSort(): void {
    this.currentPage = 1;
    this.applyPagination();
  }

  private applyPagination(): void {
    this.registryLoading = true;
    this.registryError = '';
    this.registryLoadTrigger$.next();
  }

  onDetailTabSelect(tab: EquipmentDetailTab): void {
    this.detailTab = tab;
    this.lazyLoadDetailData();
  }

  private lazyLoadDetailData(): void {
    if (!this.selectedEquipment) return;
    if (this.detailTab === 'RELIABILITY' && this.telemetryLoadedForEquipmentId !== this.selectedEquipment.id) {
      this.loadTelemetry(this.selectedEquipment.id);
      this.telemetryLoadedForEquipmentId = this.selectedEquipment.id;
      return;
    }
    if (this.detailTab === 'INVENTORY' && this.mediaLoadedForEquipmentId !== this.selectedEquipment.id) {
      this.loadMedia(this.selectedEquipment.id);
      this.mediaLoadedForEquipmentId = this.selectedEquipment.id;
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

    this.epsService.getChangeRequestsCached().subscribe({
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

  private buildFallbackWidgets(): DashboardWidget[] {
    return [
      { key: 'critical_assets', title: 'Critical Assets', value: '-', hint: 'data loading', roles: ['MANAGER', 'RELIABILITY_ENGINEER', 'AUDITOR'], tone: 'neutral' },
      { key: 'offline_equipment', title: 'Offline Equipment', value: '-', hint: 'data loading', roles: ['TECHNICIAN', 'MANAGER', 'WAREHOUSE_OPERATOR'], tone: 'neutral' },
      { key: 'expiring_certs', title: 'Expiring Certifications', value: '-', hint: 'data loading', roles: ['AUDITOR', 'MANAGER'], tone: 'neutral' },
      { key: 'open_tickets', title: 'Open Tickets', value: '-', hint: 'data loading', roles: ['TECHNICIAN', 'MANAGER', 'RELIABILITY_ENGINEER'], tone: 'neutral' },
      { key: 'overdue_pm', title: 'Overdue PM', value: '-', hint: 'data loading', roles: ['TECHNICIAN', 'MANAGER'], tone: 'neutral' },
      { key: 'recent_changes', title: 'Recent Changes', value: '-', hint: 'data loading', roles: ['AUDITOR', 'MANAGER', 'RELIABILITY_ENGINEER'], tone: 'neutral' },
      { key: 'pending_approvals', title: 'Pending Approvals', value: '-', hint: 'data loading', roles: ['MANAGER', 'AUDITOR'], tone: 'neutral' }
    ];
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
          at: item.updatedAt,
          actor: 'System'
        },
        {
          id: `maintenance-${item.id}`,
          equipmentId: item.id,
          equipmentLabel: `${item.assetTag} ${item.name}`,
          title: 'Preventive maintenance scheduled',
          type: 'MAINTENANCE',
          at: item.updatedAt,
          actor: 'Maintenance Planner'
        },
        {
          id: `tickets-${item.id}`,
          equipmentId: item.id,
          equipmentLabel: `${item.assetTag} ${item.name}`,
          title: 'Service ticket touched',
          type: 'TICKETS',
          at: item.updatedAt,
          actor: 'Service Desk'
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
      actor: 'Document Control',
      meta: `${doc.documentType}: ${doc.fileName}`,
      diffAvailable: doc.version > 1
    }));

    const syntheticSelected: TimelineEvent[] = this.selectedEquipment
      ? [
          {
            id: `approval-${this.selectedEquipment.id}`,
            equipmentId: this.selectedEquipment.id,
            equipmentLabel: `${this.selectedEquipment.assetTag} ${this.selectedEquipment.name}`,
            title: 'Change approval reviewed',
            type: 'APPROVALS',
            at: this.selectedEquipment.updatedAt,
            actor: 'Approver',
            diffAvailable: true
          },
          {
            id: `inventory-${this.selectedEquipment.id}`,
            equipmentId: this.selectedEquipment.id,
            equipmentLabel: `${this.selectedEquipment.assetTag} ${this.selectedEquipment.name}`,
            title: 'Spare part reservation linked',
            type: 'INVENTORY',
            at: this.selectedEquipment.updatedAt,
            actor: 'Warehouse'
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

  viewTimelineDiff(event: TimelineEvent): void {
    alert(`Diff view requested for ${event.title} (${event.equipmentLabel})`);
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
        this.showSuccess('Equipment registered successfully.');
        this.load();
      },
      error: (err) => {
        this.error = this.buildUserError(err, 'Failed to create equipment.');
        this.pageErrorMessage = this.error;
        this.submitting = false;
      }
    });
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    setTimeout(() => {
      if (this.successMessage === message) this.successMessage = '';
    }, 3500);
  }
}
