import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { WmsService } from '../data/wms.service';
import {
  Warehouse,
  Part,
  StockLevel,
  StockMovement,
  Reservation,
  WarehouseTransfer,
  CreateWarehouseRequest,
  CreatePartRequest,
  CreateStockMovementRequest,
  CreateReservationRequest,
  CreateWarehouseTransferRequest
} from '../data/wms.models';

@Component({
  selector: 'mro-wms-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="wms-dashboard">
      <header class="dashboard-header">
        <h1>Warehouse Management System</h1>
        <p>Manage warehouses, catalog parts, trace stock movements, and coordinate transfers.</p>
      </header>

      <nav class="tab-navigation">
        <button (click)="activeTab = 'warehouses'" [class.active]="activeTab === 'warehouses'">
          Warehouses
        </button>
        <button (click)="activeTab = 'parts'" [class.active]="activeTab === 'parts'">
          Parts Catalog
        </button>
        <button (click)="activeTab = 'stock'" [class.active]="activeTab === 'stock'">
          Stock & Movements
        </button>
        <button (click)="activeTab = 'reservations'" [class.active]="activeTab === 'reservations'">
          Reservations
        </button>
        <button (click)="activeTab = 'transfers'" [class.active]="activeTab === 'transfers'">
          Transfers
        </button>
      </nav>

      <div *ngIf="globalError" class="alert alert-danger">{{ globalError }}</div>
      <div *ngIf="globalInfo" class="alert alert-success">{{ globalInfo }}</div>

      <main class="tab-content">
        <!-- WAREHOUSES TAB -->
        <div *ngIf="activeTab === 'warehouses'" class="tab-grid">
          <div class="main-column">
            <div class="card">
              <h3>Warehouse Registry</h3>
              <div class="table-container">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Location</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let wh of warehouses" 
                        [class.selected]="selectedWarehouse?.id === wh.id"
                        (click)="selectWarehouse(wh)"
                        class="clickable-row">
                      <td><strong>{{ wh.code }}</strong></td>
                      <td>{{ wh.name }}</td>
                      <td>{{ wh.type }}</td>
                      <td>{{ wh.location || '—' }}</td>
                      <td>
                        <span class="status-badge" [class.active]="wh.isActive" [class.inactive]="!wh.isActive">
                          {{ wh.isActive ? 'Active' : 'Inactive' }}
                        </span>
                      </td>
                    </tr>
                    <tr *ngIf="warehouses.length === 0">
                      <td colspan="5" class="no-data">No warehouses found.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="side-column">
            <!-- WAREHOUSE CRUD FORM -->
            <div class="card">
              <h3>Create Warehouse</h3>
              <form [formGroup]="warehouseForm" (ngSubmit)="createWarehouse()">
                <div class="form-group">
                  <label for="whCode">Code</label>
                  <input id="whCode" type="text" formControlName="code" placeholder="WH-001" />
                </div>
                <div class="form-group">
                  <label for="whName">Name</label>
                  <input id="whName" type="text" formControlName="name" placeholder="Main Logistics Center" />
                </div>
                <div class="form-group">
                  <label for="whType">Type</label>
                  <select id="whType" formControlName="type">
                    <option value="MAIN">MAIN</option>
                    <option value="SATELLITE">SATELLITE</option>
                    <option value="FIELD">FIELD</option>
                    <option value="TEMPORARY">TEMPORARY</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="whLocation">Location</label>
                  <input id="whLocation" type="text" formControlName="location" placeholder="Sector 4, Building B" />
                </div>
                <div class="form-group">
                  <label for="whDescription">Description</label>
                  <textarea id="whDescription" formControlName="description" rows="2" placeholder="Primary storage facility"></textarea>
                </div>
                <button type="submit" [disabled]="warehouseForm.invalid" class="btn btn-primary btn-block">
                  Save Warehouse
                </button>
              </form>
            </div>

            <!-- SELECTED WAREHOUSE DETAILS -->
            <div class="card detail-card" *ngIf="selectedWarehouse">
              <div class="detail-header">
                <h4>{{ selectedWarehouse.name }} Details</h4>
                <button *ngIf="selectedWarehouse.isActive" (click)="deactivateWarehouse(selectedWarehouse.id)" class="btn btn-danger btn-sm">
                  Deactivate
                </button>
              </div>
              <p><strong>Code:</strong> {{ selectedWarehouse.code }}</p>
              <p><strong>Type:</strong> {{ selectedWarehouse.type }}</p>
              <p><strong>Location:</strong> {{ selectedWarehouse.location || 'N/A' }}</p>
              <p><strong>Description:</strong> {{ selectedWarehouse.description || 'N/A' }}</p>
              
              <hr />
              
              <div class="form-group mt-3">
                <label>Assign Custodian (User ID)</label>
                <div class="input-group">
                  <input type="text" #custodianInput placeholder="UUID" class="form-control" [value]="selectedWarehouse.custodianId || ''" />
                  <button (click)="assignCustodian(selectedWarehouse.id, custodianInput.value)" class="btn btn-secondary btn-sm">
                    Assign
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- PARTS CATALOG TAB -->
        <div *ngIf="activeTab === 'parts'" class="tab-grid">
          <div class="main-column">
            <div class="card">
              <h3>Spare Parts Catalogue</h3>
              <div class="table-container">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Part Number</th>
                      <th>Name</th>
                      <th>Unit</th>
                      <th>Manufacturer</th>
                      <th>Min Stock</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let part of parts" 
                        [class.selected]="selectedPart?.id === part.id"
                        (click)="selectPart(part)"
                        class="clickable-row">
                      <td><strong>{{ part.partNumber }}</strong></td>
                      <td>{{ part.name }}</td>
                      <td>{{ part.unit }}</td>
                      <td>{{ part.manufacturer || '—' }}</td>
                      <td>{{ part.minStockLevel }}</td>
                      <td>
                        <span class="status-badge" [class.active]="part.isActive" [class.inactive]="!part.isActive">
                          {{ part.isActive ? 'Active' : 'Inactive' }}
                        </span>
                      </td>
                    </tr>
                    <tr *ngIf="parts.length === 0">
                      <td colspan="6" class="no-data">No parts found.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="side-column">
            <!-- PART CREATE FORM -->
            <div class="card">
              <h3>Add Part</h3>
              <form [formGroup]="partForm" (ngSubmit)="createPart()">
                <div class="form-group">
                  <label for="partNum">Part Number</label>
                  <input id="partNum" type="text" formControlName="partNumber" placeholder="P-100-XYZ" />
                </div>
                <div class="form-group">
                  <label for="partName">Name</label>
                  <input id="partName" type="text" formControlName="name" placeholder="Hydraulic Pump Valve" />
                </div>
                <div class="form-group">
                  <label for="partUnit">Unit</label>
                  <input id="partUnit" type="text" formControlName="unit" placeholder="PCS" />
                </div>
                <div class="form-group">
                  <label for="partManufacturer">Manufacturer</label>
                  <input id="partManufacturer" type="text" formControlName="manufacturer" placeholder="Bosch" />
                </div>
                <div class="form-group">
                  <label for="partModel">Model</label>
                  <input id="partModel" type="text" formControlName="model" placeholder="Rexroth" />
                </div>
                <div class="form-group">
                  <label for="partMinStock">Min Stock Level</label>
                  <input id="partMinStock" type="number" formControlName="minStockLevel" placeholder="5" />
                </div>
                <div class="form-group">
                  <label for="partDesc">Description</label>
                  <textarea id="partDesc" formControlName="description" rows="2" placeholder="Details..."></textarea>
                </div>
                <button type="submit" [disabled]="partForm.invalid" class="btn btn-primary btn-block">
                  Save Part
                </button>
              </form>
            </div>

            <!-- SELECTED PART DETAILS -->
            <div class="card detail-card" *ngIf="selectedPart">
              <div class="detail-header">
                <h4>{{ selectedPart.name }} Details</h4>
                <button *ngIf="selectedPart.isActive" (click)="deactivatePart(selectedPart.id)" class="btn btn-danger btn-sm">
                  Deactivate
                </button>
              </div>
              <p><strong>Part Number:</strong> {{ selectedPart.partNumber }}</p>
              <p><strong>Manufacturer:</strong> {{ selectedPart.manufacturer || 'N/A' }}</p>
              <p><strong>Model:</strong> {{ selectedPart.model || 'N/A' }}</p>
              <p><strong>Min Stock Level:</strong> {{ selectedPart.minStockLevel }} {{ selectedPart.unit }}</p>
              <p><strong>Description:</strong> {{ selectedPart.description || 'N/A' }}</p>
            </div>
          </div>
        </div>

        <!-- STOCK & MOVEMENTS TAB -->
        <div *ngIf="activeTab === 'stock'" class="tab-grid-vertical">
          <div class="grid-three-columns">
            <!-- SEARCH STOCK LEVELS -->
            <div class="card span-two">
              <div class="stock-header">
                <h3>Stock Levels</h3>
                <div class="filters">
                  <label>
                    <input type="checkbox" #belowMinCheck (change)="loadStockLevels(belowMinCheck.checked)" />
                    Below Minimum Only
                  </label>
                </div>
              </div>
              <div class="table-container">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Warehouse</th>
                      <th>Part Number</th>
                      <th>Part Name</th>
                      <th>On Hand</th>
                      <th>Reserved</th>
                      <th>Available</th>
                      <th>Min Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let stock of stockLevels" [class.warning-row]="stock.belowMinimum">
                      <td>{{ stock.warehouseCode }}</td>
                      <td><strong>{{ stock.partNumber }}</strong></td>
                      <td>{{ stock.partName }}</td>
                      <td>{{ stock.quantityOnHand }}</td>
                      <td>{{ stock.quantityReserved }}</td>
                      <td><strong>{{ stock.quantityAvailable }}</strong></td>
                      <td>
                        {{ stock.minStockLevel }}
                        <span *ngIf="stock.belowMinimum" class="badge-alert ml-1">LOW</span>
                      </td>
                    </tr>
                    <tr *ngIf="stockLevels.length === 0">
                      <td colspan="7" class="no-data">No stock levels recorded yet.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- POST STOCK MOVEMENTS -->
            <div class="card">
              <h3>Post Stock Movement</h3>
              <form [formGroup]="movementForm" (ngSubmit)="postStockMovement()">
                <div class="form-group">
                  <label for="moveWh">Warehouse</label>
                  <select id="moveWh" formControlName="warehouseId">
                    <option *ngFor="let wh of warehouses" [value]="wh.id">{{ wh.code }} - {{ wh.name }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="movePart">Part</label>
                  <select id="movePart" formControlName="partId">
                    <option *ngFor="let part of parts" [value]="part.id">{{ part.partNumber }} - {{ part.name }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="moveType">Movement Type</label>
                  <select id="moveType" formControlName="movementType">
                    <option value="RECEIPT">RECEIPT (Add stock)</option>
                    <option value="ISSUE">ISSUE (Dispatch stock)</option>
                    <option value="ADJUSTMENT_IN">ADJUSTMENT_IN (Positive adj.)</option>
                    <option value="ADJUSTMENT_OUT">ADJUSTMENT_OUT (Negative adj.)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="moveQty">Quantity</label>
                  <input id="moveQty" type="number" formControlName="quantity" placeholder="10" />
                </div>
                <div class="form-group">
                  <label for="moveReason">Reason / Notes</label>
                  <input id="moveReason" type="text" formControlName="reason" placeholder="Ref. Invoice, correction, etc." />
                </div>
                <button type="submit" [disabled]="movementForm.invalid" class="btn btn-primary btn-block">
                  Submit Movement
                </button>
              </form>
            </div>
          </div>

          <!-- MOVEMENT LEDGER LOG -->
          <div class="card">
            <h3>Recent Movement Ledger Log</h3>
            <div class="filters-row mb-3">
              <select #ledgerWh (change)="loadLedger(ledgerWh.value)">
                <option value="">-- All Warehouses --</option>
                <option *ngFor="let wh of warehouses" [value]="wh.id">{{ wh.code }}</option>
              </select>
            </div>
            <div class="table-container">
              <table class="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Warehouse</th>
                    <th>Part</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Reference</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let mv of movements">
                    <td>{{ mv.createdAt | date:'medium' }}</td>
                    <td>{{ getWarehouseCode(mv.warehouseId) }}</td>
                    <td>{{ getPartNumber(mv.partId) }}</td>
                    <td>
                      <span class="status-badge" [class.active]="mv.movementType.includes('RECEIPT') || mv.movementType.includes('IN')" [class.inactive]="mv.movementType.includes('ISSUE') || mv.movementType.includes('OUT') || mv.movementType.includes('CONSUME')">
                        {{ mv.movementType }}
                      </span>
                    </td>
                    <td><strong>{{ mv.quantity }}</strong></td>
                    <td>{{ mv.referenceType ? mv.referenceType + ': ' + mv.referenceId : '—' }}</td>
                    <td>{{ mv.reason || '—' }}</td>
                  </tr>
                  <tr *ngIf="movements.length === 0">
                    <td colspan="7" class="no-data">No movements recorded.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- RESERVATIONS TAB -->
        <div *ngIf="activeTab === 'reservations'" class="tab-grid">
          <div class="main-column">
            <div class="card">
              <div class="stock-header">
                <h3>Active Reservaton Ledger</h3>
                <button (click)="triggerExpirationSweep()" class="btn btn-secondary btn-sm">
                  Run Expiration Sweep
                </button>
              </div>
              <div class="table-container">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Warehouse</th>
                      <th>Part Number</th>
                      <th>Qty</th>
                      <th>Ref Type</th>
                      <th>Ref ID</th>
                      <th>Expires At</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let res of reservations">
                      <td>{{ getWarehouseCode(res.warehouseId) }}</td>
                      <td>{{ getPartNumber(res.partId) }}</td>
                      <td><strong>{{ res.quantity }}</strong></td>
                      <td>{{ res.referenceType || '—' }}</td>
                      <td>{{ res.referenceId || '—' }}</td>
                      <td>{{ res.expiresAt ? (res.expiresAt | date:'short') : 'Never' }}</td>
                      <td>
                        <span class="status-badge" [class.active]="res.status === 'RESERVED'" [class.inactive]="res.status !== 'RESERVED'">
                          {{ res.status }}
                        </span>
                      </td>
                      <td>
                        <div class="btn-group" *ngIf="res.status === 'RESERVED'">
                          <button (click)="consumeReservation(res.id)" class="btn btn-primary btn-sm mr-1">
                            Consume
                          </button>
                          <button (click)="releaseReservation(res.id)" class="btn btn-secondary btn-sm">
                            Release
                          </button>
                        </div>
                        <span *ngIf="res.status !== 'RESERVED'">—</span>
                      </td>
                    </tr>
                    <tr *ngIf="reservations.length === 0">
                      <td colspan="8" class="no-data">No reservations found.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="side-column">
            <div class="card">
              <h3>Create Stock Reservation</h3>
              <form [formGroup]="reservationForm" (ngSubmit)="createReservation()">
                <div class="form-group">
                  <label for="resWh">Warehouse</label>
                  <select id="resWh" formControlName="warehouseId">
                    <option *ngFor="let wh of warehouses" [value]="wh.id">{{ wh.code }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="resPart">Part</label>
                  <select id="resPart" formControlName="partId">
                    <option *ngFor="let part of parts" [value]="part.id">{{ part.partNumber }} - {{ part.name }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="resQty">Quantity</label>
                  <input id="resQty" type="number" formControlName="quantity" placeholder="5" />
                </div>
                <div class="form-group">
                  <label for="resRefType">Reference Type</label>
                  <input id="resRefType" type="text" formControlName="referenceType" placeholder="WORK_ORDER" />
                </div>
                <div class="form-group">
                  <label for="resRefId">Reference ID</label>
                  <input id="resRefId" type="text" formControlName="referenceId" placeholder="UUID" />
                </div>
                <div class="form-group">
                  <label for="resExpires">Expires At</label>
                  <input id="resExpires" type="datetime-local" formControlName="expiresAt" />
                </div>
                <button type="submit" [disabled]="reservationForm.invalid" class="btn btn-primary btn-block">
                  Reserve Stock
                </button>
              </form>
            </div>
          </div>
        </div>

        <!-- TRANSFERS TAB -->
        <div *ngIf="activeTab === 'transfers'" class="tab-grid">
          <div class="main-column">
            <div class="card">
              <h3>Warehouse Transfers Board</h3>
              <div class="table-container">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>Target</th>
                      <th>Part</th>
                      <th>Qty</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let tr of transfers">
                      <td>{{ getWarehouseCode(tr.sourceWarehouseId) }}</td>
                      <td>{{ getWarehouseCode(tr.targetWarehouseId) }}</td>
                      <td>{{ getPartNumber(tr.partId) }}</td>
                      <td><strong>{{ tr.quantity }}</strong></td>
                      <td>
                        <span class="status-badge" 
                              [class.active]="tr.status === 'COMPLETED' || tr.status === 'APPROVED'" 
                              [class.inactive]="tr.status === 'CANCELLED'"
                              [class.warning]="tr.status === 'IN_TRANSIT' || tr.status === 'REQUESTED'">
                          {{ tr.status }}
                        </span>
                      </td>
                      <td>
                        <div class="btn-group">
                          <button *ngIf="tr.status === 'DRAFT'" (click)="submitTransfer(tr.id)" class="btn btn-primary btn-sm mr-1">
                            Submit
                          </button>
                          <button *ngIf="tr.status === 'REQUESTED'" (click)="approveTransfer(tr.id)" class="btn btn-success btn-sm mr-1">
                            Approve
                          </button>
                          <button *ngIf="tr.status === 'APPROVED'" (click)="startTransfer(tr.id)" class="btn btn-warning btn-sm mr-1">
                            Ship
                          </button>
                          <button *ngIf="tr.status === 'IN_TRANSIT'" (click)="completeTransfer(tr.id)" class="btn btn-success btn-sm mr-1">
                            Complete
                          </button>
                          <button *ngIf="tr.status !== 'COMPLETED' && tr.status !== 'CANCELLED'" (click)="cancelTransfer(tr.id)" class="btn btn-danger btn-sm">
                            Cancel
                          </button>
                        </div>
                        <span *ngIf="tr.status === 'COMPLETED' || tr.status === 'CANCELLED'">—</span>
                      </td>
                    </tr>
                    <tr *ngIf="transfers.length === 0">
                      <td colspan="6" class="no-data">No transfers found.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="side-column">
            <div class="card">
              <h3>Request Transfer</h3>
              <form [formGroup]="transferForm" (ngSubmit)="createTransfer()">
                <div class="form-group">
                  <label for="trSrc">Source Warehouse</label>
                  <select id="trSrc" formControlName="sourceWarehouseId">
                    <option *ngFor="let wh of warehouses" [value]="wh.id">{{ wh.code }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="trTgt">Target Warehouse</label>
                  <select id="trTgt" formControlName="targetWarehouseId">
                    <option *ngFor="let wh of warehouses" [value]="wh.id">{{ wh.code }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="trPart">Part</label>
                  <select id="trPart" formControlName="partId">
                    <option *ngFor="let part of parts" [value]="part.id">{{ part.partNumber }} - {{ part.name }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="trQty">Quantity</label>
                  <input id="trQty" type="number" formControlName="quantity" placeholder="5" />
                </div>
                <button type="submit" [disabled]="transferForm.invalid" class="btn btn-primary btn-block">
                  Create Request
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .wms-dashboard {
      display: flex;
      flex-direction: column;
      gap: 20px;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }
    .dashboard-header h1 {
      margin: 0;
      color: #0f172a;
      font-size: 1.8rem;
    }
    .dashboard-header p {
      margin: 4px 0 0 0;
      color: #64748b;
      font-size: 0.95rem;
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
      font-size: 0.95rem;
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
    .alert {
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 550;
    }
    .alert-danger {
      background-color: #fef2f2;
      color: #991b1b;
      border: 1px solid #fee2e2;
    }
    .alert-success {
      background-color: #f0fdf4;
      color: #166534;
      border: 1px solid #dcfce7;
    }
    .tab-grid {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 24px;
      align-items: start;
    }
    .tab-grid-vertical {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .grid-three-columns {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
      align-items: start;
    }
    .main-column {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .side-column {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .card {
      background: #ffffff;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
      border: 1px solid #e2e8f0;
    }
    .card h3 {
      margin: 0 0 16px 0;
      font-size: 1.1rem;
      color: #1e293b;
      font-weight: 600;
    }
    .detail-card {
      border-top: 4px solid #0284c7;
    }
    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .detail-header h4 {
      margin: 0;
      font-size: 1rem;
      color: #1e293b;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 14px;
    }
    .form-group label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
    }
    .form-group input, .form-group select, .form-group textarea {
      padding: 10px 12px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      font-size: 0.9rem;
      font-family: inherit;
      transition: border-color 0.15s ease;
    }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
      outline: none;
      border-color: #0284c7;
    }
    .input-group {
      display: flex;
      gap: 8px;
    }
    .input-group input {
      flex: 1;
    }
    .btn {
      padding: 9px 16px;
      border-radius: 6px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      font-family: inherit;
      font-size: 0.9rem;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .btn-primary { background: #0284c7; color: white; }
    .btn-primary:hover { background: #0369a1; }
    .btn-primary:disabled { background: #94a3b8; cursor: not-allowed; }
    .btn-secondary { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
    .btn-secondary:hover { background: #e2e8f0; }
    .btn-danger { background: #ef4444; color: white; }
    .btn-danger:hover { background: #dc2626; }
    .btn-warning { background: #f59e0b; color: white; }
    .btn-warning:hover { background: #d97706; }
    .btn-success { background: #10b981; color: white; }
    .btn-success:hover { background: #059669; }
    .btn-sm { padding: 6px 12px; font-size: 0.8rem; }
    .btn-block { width: 100%; }
    .table-container {
      background: #ffffff;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      overflow-x: auto;
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
      color: #475569;
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
    .warning-row {
      background-color: #fffbeb;
    }
    .status-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 9999px;
      text-transform: uppercase;
      display: inline-block;
    }
    .status-badge.active { background: #d1fae5; color: #065f46; }
    .status-badge.inactive { background: #fee2e2; color: #991b1b; }
    .status-badge.warning { background: #fef3c7; color: #92400e; }
    .badge-alert {
      background: #ef4444;
      color: white;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 4px;
    }
    .no-data {
      text-align: center;
      color: #64748b;
      font-style: italic;
      padding: 24px;
    }
    .btn-group {
      display: inline-flex;
    }
    .ml-1 { margin-left: 4px; }
    .mr-1 { margin-right: 4px; }
    .mt-3 { margin-top: 12px; }
    .mb-3 { margin-bottom: 12px; }
    .span-two { grid-column: span 2; }
    .stock-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    hr {
      border: 0;
      border-top: 1px solid #e2e8f0;
      margin: 16px 0;
    }
  `]
})
export class WmsPageComponent implements OnInit {
  activeTab: 'warehouses' | 'parts' | 'stock' | 'reservations' | 'transfers' = 'warehouses';

  warehouses: Warehouse[] = [];
  parts: Part[] = [];
  stockLevels: StockLevel[] = [];
  movements: StockMovement[] = [];
  reservations: Reservation[] = [];
  transfers: WarehouseTransfer[] = [];

  selectedWarehouse?: Warehouse;
  selectedPart?: Part;

  globalError = '';
  globalInfo = '';

  // Forms
  warehouseForm = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(32)]],
    name: ['', [Validators.required, Validators.maxLength(255)]],
    type: ['MAIN', Validators.required],
    location: [''],
    description: ['']
  });

  partForm = this.fb.group({
    partNumber: ['', [Validators.required, Validators.maxLength(64)]],
    name: ['', [Validators.required, Validators.maxLength(255)]],
    unit: ['PCS', Validators.required],
    manufacturer: [''],
    model: [''],
    minStockLevel: [0, [Validators.required, Validators.min(0)]],
    description: ['']
  });

  movementForm = this.fb.group({
    warehouseId: ['', Validators.required],
    partId: ['', Validators.required],
    movementType: ['RECEIPT', Validators.required],
    quantity: [1, [Validators.required, Validators.min(0.001)]],
    reason: ['']
  });

  reservationForm = this.fb.group({
    warehouseId: ['', Validators.required],
    partId: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(0.001)]],
    referenceType: ['WORK_ORDER'],
    referenceId: [''],
    expiresAt: ['']
  });

  transferForm = this.fb.group({
    sourceWarehouseId: ['', Validators.required],
    targetWarehouseId: ['', Validators.required],
    partId: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(0.001)]]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly wmsService: WmsService
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.wmsService.getWarehouses().subscribe({
      next: (res) => {
        this.warehouses = res.data;
        if (this.warehouses.length > 0) {
          this.movementForm.patchValue({ warehouseId: this.warehouses[0].id });
          this.reservationForm.patchValue({ warehouseId: this.warehouses[0].id });
          this.transferForm.patchValue({ sourceWarehouseId: this.warehouses[0].id, targetWarehouseId: this.warehouses[0].id });
        }
      },
      error: (err) => this.showError(err)
    });

    this.wmsService.getParts().subscribe({
      next: (res) => {
        this.parts = res.data;
        if (this.parts.length > 0) {
          this.movementForm.patchValue({ partId: this.parts[0].id });
          this.reservationForm.patchValue({ partId: this.parts[0].id });
          this.transferForm.patchValue({ partId: this.parts[0].id });
        }
      },
      error: (err) => this.showError(err)
    });

    this.loadStockLevels();
    this.loadLedger();
    this.loadReservations();
    this.loadTransfers();
  }

  // WAREHOUSE OPERATIONS
  selectWarehouse(wh: Warehouse): void {
    this.selectedWarehouse = wh;
  }

  createWarehouse(): void {
    if (this.warehouseForm.invalid) return;
    const req = this.warehouseForm.value as CreateWarehouseRequest;
    this.wmsService.createWarehouse(req).subscribe({
      next: () => {
        this.showInfo('Warehouse created successfully');
        this.warehouseForm.reset({ type: 'MAIN' });
        this.loadAll();
      },
      error: (err) => this.showError(err)
    });
  }

  deactivateWarehouse(id: string): void {
    this.wmsService.deactivateWarehouse(id).subscribe({
      next: () => {
        this.showInfo('Warehouse deactivated');
        this.selectedWarehouse = undefined;
        this.loadAll();
      },
      error: (err) => this.showError(err)
    });
  }

  assignCustodian(id: string, custodianId: string): void {
    const cid = custodianId.trim() ? custodianId.trim() : null;
    this.wmsService.assignWarehouseCustodian(id, cid).subscribe({
      next: () => {
        this.showInfo('Custodian assigned successfully');
        this.selectedWarehouse = undefined;
        this.loadAll();
      },
      error: (err) => this.showError(err)
    });
  }

  // PART OPERATIONS
  selectPart(part: Part): void {
    this.selectedPart = part;
  }

  createPart(): void {
    if (this.partForm.invalid) return;
    const req = this.partForm.value as CreatePartRequest;
    this.wmsService.createPart(req).subscribe({
      next: () => {
        this.showInfo('Part registered in catalogue');
        this.partForm.reset({ unit: 'PCS', minStockLevel: 0 });
        this.loadAll();
      },
      error: (err) => this.showError(err)
    });
  }

  deactivatePart(id: string): void {
    this.wmsService.deactivatePart(id).subscribe({
      next: () => {
        this.showInfo('Part deactivated');
        this.selectedPart = undefined;
        this.loadAll();
      },
      error: (err) => this.showError(err)
    });
  }

  // STOCK & MOVEMENTS
  loadStockLevels(belowMin = false): void {
    this.wmsService.getStockLevels(belowMin ? { belowMinimum: true } : {}).subscribe({
      next: (res) => this.stockLevels = res.data,
      error: (err) => this.showError(err)
    });
  }

  loadLedger(whId = ''): void {
    if (whId) {
      this.wmsService.getStockMovementsByWarehouse(whId).subscribe({
        next: (res) => this.movements = res.data,
        error: (err) => this.showError(err)
      });
    } else {
      // Just load general movements or first warehouse
      this.wmsService.getWarehouses().subscribe({
        next: (res) => {
          if (res.data.length > 0) {
            this.wmsService.getStockMovementsByWarehouse(res.data[0].id).subscribe({
              next: (mvs) => this.movements = mvs.data,
              error: (err) => this.showError(err)
            });
          }
        }
      });
    }
  }

  postStockMovement(): void {
    if (this.movementForm.invalid) return;
    const formVal = this.movementForm.value;
    const req: CreateStockMovementRequest = {
      warehouseId: formVal.warehouseId!,
      partId: formVal.partId!,
      movementType: formVal.movementType!,
      quantity: formVal.quantity!,
      reason: formVal.reason || undefined
    };

    const action = req.movementType === 'RECEIPT'
      ? this.wmsService.receiveStock(req)
      : req.movementType === 'ISSUE'
        ? this.wmsService.issueStock(req)
        : this.wmsService.adjustStock(req);

    action.subscribe({
      next: () => {
        this.showInfo('Stock movement posted successfully');
        this.movementForm.patchValue({ quantity: 1, reason: '' });
        this.loadAll();
      },
      error: (err) => this.showError(err)
    });
  }

  // RESERVATIONS
  loadReservations(): void {
    this.wmsService.getReservations().subscribe({
      next: (res) => this.reservations = res.data,
      error: (err) => this.showError(err)
    });
  }

  createReservation(): void {
    if (this.reservationForm.invalid) return;
    const val = this.reservationForm.value;
    const req: CreateReservationRequest = {
      warehouseId: val.warehouseId!,
      partId: val.partId!,
      quantity: val.quantity!,
      referenceType: val.referenceType || undefined,
      referenceId: val.referenceId || undefined,
      expiresAt: val.expiresAt ? new Date(val.expiresAt).toISOString() : undefined
    };

    this.wmsService.createReservation(req).subscribe({
      next: () => {
        this.showInfo('Stock reservation created');
        this.reservationForm.patchValue({ quantity: 1, referenceId: '', expiresAt: '' });
        this.loadAll();
      },
      error: (err) => this.showError(err)
    });
  }

  releaseReservation(id: string): void {
    this.wmsService.releaseReservation(id).subscribe({
      next: () => {
        this.showInfo('Reservation released');
        this.loadAll();
      },
      error: (err) => this.showError(err)
    });
  }

  consumeReservation(id: string): void {
    this.wmsService.consumeReservation(id).subscribe({
      next: () => {
        this.showInfo('Reservation consumed');
        this.loadAll();
      },
      error: (err) => this.showError(err)
    });
  }

  triggerExpirationSweep(): void {
    this.wmsService.expireReservations().subscribe({
      next: (res) => {
        this.showInfo(`Sweep complete: ${res.data} expired reservations released.`);
        this.loadAll();
      },
      error: (err) => this.showError(err)
    });
  }

  // TRANSFERS
  loadTransfers(): void {
    this.wmsService.getTransfers().subscribe({
      next: (res) => this.transfers = res.data,
      error: (err) => this.showError(err)
    });
  }

  createTransfer(): void {
    if (this.transferForm.invalid) return;
    const val = this.transferForm.value;
    const req: CreateWarehouseTransferRequest = {
      sourceWarehouseId: val.sourceWarehouseId!,
      targetWarehouseId: val.targetWarehouseId!,
      partId: val.partId!,
      quantity: val.quantity!
    };

    this.wmsService.createTransfer(req).subscribe({
      next: () => {
        this.showInfo('Transfer request created as DRAFT');
        this.transferForm.patchValue({ quantity: 1 });
        this.loadAll();
      },
      error: (err) => this.showError(err)
    });
  }

  submitTransfer(id: string): void {
    this.wmsService.submitTransfer(id).subscribe({
      next: () => {
        this.showInfo('Transfer submitted for approval');
        this.loadAll();
      },
      error: (err) => this.showError(err)
    });
  }

  approveTransfer(id: string): void {
    this.wmsService.approveTransfer(id).subscribe({
      next: () => {
        this.showInfo('Transfer approved');
        this.loadAll();
      },
      error: (err) => this.showError(err)
    });
  }

  startTransfer(id: string): void {
    this.wmsService.startTransfer(id).subscribe({
      next: () => {
        this.showInfo('Transfer shipment started (In Transit)');
        this.loadAll();
      },
      error: (err) => this.showError(err)
    });
  }

  completeTransfer(id: string): void {
    this.wmsService.completeTransfer(id).subscribe({
      next: () => {
        this.showInfo('Transfer completed successfully');
        this.loadAll();
      },
      error: (err) => this.showError(err)
    });
  }

  cancelTransfer(id: string): void {
    this.wmsService.cancelTransfer(id).subscribe({
      next: () => {
        this.showInfo('Transfer cancelled');
        this.loadAll();
      },
      error: (err) => this.showError(err)
    });
  }

  // HELPERS
  getWarehouseCode(id: string): string {
    const wh = this.warehouses.find(w => w.id === id);
    return wh ? wh.code : id;
  }

  getPartNumber(id: string): string {
    const p = this.parts.find(part => part.id === id);
    return p ? p.partNumber : id;
  }

  private showError(err: any): void {
    console.error(err);
    this.globalInfo = '';
    this.globalError = err?.error?.message || err?.message || 'An error occurred during transaction.';
    setTimeout(() => this.globalError = '', 8000);
  }

  private showInfo(msg: string): void {
    this.globalError = '';
    this.globalInfo = msg;
    setTimeout(() => this.globalInfo = '', 5000);
  }
}
