import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'mro-feature-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="workspace-wrapper">
      <!-- REPORTING WORKSPACE -->
      <div *ngIf="title === 'Reporting'" class="dashboard-grid">
        <div class="stats-row">
          <div class="card-premium kpi-card">
            <span class="kpi-label">Mean Time to Repair (MTTR)</span>
            <span class="kpi-value">3.8 hrs</span>
            <span class="kpi-trend up">
              <svg class="trend-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
                <polyline points="17 18 23 18 23 12"/>
              </svg>
              -12.4% decrease (Faster)
            </span>
          </div>

          <div class="card-premium kpi-card">
            <span class="kpi-label">Mean Time Between Failures (MTBF)</span>
            <span class="kpi-value">842 hrs</span>
            <span class="kpi-trend up">
              <svg class="trend-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
              +8.2% increase (More Reliable)
            </span>
          </div>

          <div class="card-premium kpi-card">
            <span class="kpi-label">SLA Breach Rate</span>
            <span class="kpi-value">1.4%</span>
            <span class="kpi-trend down">
              <svg class="trend-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
                <polyline points="17 18 23 18 23 12"/>
              </svg>
              -0.5% decrease (Fewer Breaches)
            </span>
          </div>

          <div class="card-premium kpi-card">
            <span class="kpi-label">Stock Turn Rate</span>
            <span class="kpi-value">6.8x</span>
            <span class="kpi-trend info-trend">Annual projection</span>
          </div>
        </div>

        <div class="charts-row">
          <div class="card-premium chart-container">
            <h3>SLA Compliance by Category</h3>
            <div class="bar-chart-list">
              <div class="chart-item">
                <div class="item-info">
                  <span>Preventive Maintenance</span>
                  <span>98%</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill success" style="width: 98%"></div>
                </div>
              </div>

              <div class="chart-item">
                <div class="item-info">
                  <span>Corrective Repairs</span>
                  <span>91%</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill info" style="width: 91%"></div>
                </div>
              </div>

              <div class="chart-item">
                <div class="item-info">
                  <span>Safety Inspections</span>
                  <span>100%</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill success" style="width: 100%"></div>
                </div>
              </div>

              <div class="chart-item">
                <div class="item-info">
                  <span>Warehouse Shipments</span>
                  <span>84%</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill warning" style="width: 84%"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="card-premium list-container">
            <h3>Active Warehouse Safety Stock Breaches</h3>
            <div class="alert-list">
              <div class="alert-item error-alert">
                <span class="alert-tag">CRITICAL</span>
                <span class="alert-text"><strong>WH-MAIN:</strong> Ball Bearing 20mm (PART-BRG-20) is below safety level (Current: 3, Min Required: 10)</span>
              </div>
              <div class="alert-item warning-alert">
                <span class="alert-tag">WARNING</span>
                <span class="alert-text"><strong>WH-BUFF:</strong> V-Belt Type A (PART-BELT-A) is below safety level (Current: 4, Min Required: 5)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ADMIN WORKSPACE -->
      <div *ngIf="title === 'Admin'" class="admin-grid">
        <div class="card-premium users-section">
          <h3>Seeded Operational Profiles</h3>
          <div class="table-container" style="box-shadow: none; border-radius: 0;">
            <table class="table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Core Role</th>
                  <th>Assigned Authorities</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>admin</strong></td>
                  <td>SYSTEM_ADMIN</td>
                  <td><span class="badge badge-all">ALL_AUTHORITIES</span></td>
                  <td><span class="status-tag active">ACTIVE</span></td>
                </tr>
                <tr>
                  <td><strong>eps_mgr</strong></td>
                  <td>EPS_MANAGER</td>
                  <td><code>EPS_READ</code>, <code>EPS_WRITE</code>, <code>EPS_APPROVE</code></td>
                  <td><span class="status-tag active">ACTIVE</span></td>
                </tr>
                <tr>
                  <td><strong>mms_mgr</strong></td>
                  <td>MMS_MANAGER</td>
                  <td><code>MMS_READ</code>, <code>MMS_WRITE</code>, <code>MMS_ASSIGN</code>, <code>MMS_COMPLETE</code></td>
                  <td><span class="status-tag active">ACTIVE</span></td>
                </tr>
                <tr>
                  <td><strong>tech_john</strong></td>
                  <td>MMS_TECHNICIAN</td>
                  <td><code>MMS_READ</code>, <code>MMS_START</code>, <code>MMS_COMPLETE</code></td>
                  <td><span class="status-tag active">ACTIVE</span></td>
                </tr>
                <tr>
                  <td><strong>wms_mgr</strong></td>
                  <td>WMS_MANAGER</td>
                  <td><code>WMS_READ</code>, <code>WMS_PART_MANAGE</code>, <code>WMS_RESERVE</code>, <code>WMS_CONSUME</code></td>
                  <td><span class="status-tag active">ACTIVE</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card-premium console-section">
          <h3>System & Schema Configuration</h3>
          <div class="config-row">
            <span>Flyway Migration Baseline:</span>
            <code>V012__extend_srs_schema.sql (Success)</code>
          </div>
          <div class="config-row">
            <span>Active Spring Profile:</span>
            <code>local</code>
          </div>
          <div class="config-row">
            <span>Database Engine:</span>
            <code>PostgreSQL 16.2</code>
          </div>
          <div class="config-row">
            <span>File Attachment Root:</span>
            <code>/var/mro/storage/</code>
          </div>
          
          <h4 style="margin: 20px 0 10px 0; font-size: 0.9rem; color: var(--text-muted);">LIVE SECURITY CORRELATION ENGINE</h4>
          <div class="live-console">
            <div class="console-line"><span class="c-time">[21:12:15]</span> <span class="c-info">INFO</span> core.security: Successfully authenticated user 'admin'</div>
            <div class="console-line"><span class="c-time">[21:12:18]</span> <span class="c-info">INFO</span> eps.change-request: Change request CR-991 approved by user 'admin'</div>
            <div class="console-line"><span class="c-time">[21:13:02]</span> <span class="c-info">INFO</span> mms.scheduler: Triggered preventive maintenance cron job check</div>
            <div class="console-line"><span class="c-time">[21:13:05]</span> <span class="c-warn">WARN</span> wms.stock-level: safety stock threshold breached on PART-BRG-20</div>
          </div>
        </div>
      </div>

      <!-- DEFAULT WORKSPACE -->
      <div *ngIf="title !== 'Reporting' && title !== 'Admin'" class="card-premium">
        <h2>{{ title }} Workspace</h2>
        <p>This module's interface configuration has been loaded successfully. Standard DTO actions are active.</p>
      </div>
    </div>
  `,
  styles: [`
    .workspace-wrapper {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .dashboard-grid {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
    }
    .kpi-card {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .kpi-label {
      font-size: 0.85rem;
      color: var(--text-muted);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .kpi-value {
      font-size: 2.25rem;
      font-weight: 700;
      color: var(--text-color);
      letter-spacing: -0.02em;
    }
    .kpi-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .kpi-trend.up {
      color: var(--success-color);
    }
    .kpi-trend.down {
      color: var(--danger-color);
    }
    .kpi-trend.info-trend {
      color: var(--info-color);
    }
    .trend-icon {
      width: 14px;
      height: 14px;
    }
    .charts-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    @media (max-width: 960px) {
      .charts-row {
        grid-template-columns: 1fr;
      }
    }
    .bar-chart-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 16px;
    }
    .chart-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .item-info {
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
      font-weight: 500;
    }
    .bar-track {
      height: 8px;
      background-color: hsl(220, 20%, 90%);
      border-radius: 4px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      border-radius: 4px;
    }
    .bar-fill.success {
      background-color: var(--success-color);
    }
    .bar-fill.info {
      background-color: var(--info-color);
    }
    .bar-fill.warning {
      background-color: var(--warning-color);
    }
    .alert-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 16px;
    }
    .alert-item {
      padding: 12px 16px;
      border-radius: var(--border-radius-md);
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .error-alert {
      background-color: var(--danger-bg);
      border: 1px solid hsla(0, 84%, 60%, 0.2);
    }
    .error-alert .alert-tag {
      color: var(--danger-color);
      font-weight: 700;
    }
    .warning-alert {
      background-color: var(--warning-bg);
      border: 1px solid hsla(35, 92%, 50%, 0.2);
    }
    .warning-alert .alert-tag {
      color: var(--warning-color);
      font-weight: 700;
    }
    .admin-grid {
      display: grid;
      grid-template-columns: 1fr 480px;
      gap: 24px;
      align-items: start;
    }
    @media (max-width: 1100px) {
      .admin-grid {
        grid-template-columns: 1fr;
      }
    }
    .badge {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      color: white;
    }
    .badge-all {
      background: var(--primary-gradient);
    }
    .config-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid var(--border-color);
      font-size: 0.9rem;
    }
    .config-row code {
      color: var(--info-color);
      font-weight: 600;
    }
    .live-console {
      background-color: hsla(223, 47%, 6%, 0.9);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-md);
      padding: 16px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.75rem;
      color: #38bdf8;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 200px;
      overflow-y: auto;
    }
    .console-line {
      line-height: 1.4;
    }
    .c-time {
      color: #64748b;
    }
    .c-info {
      color: #4ade80;
      font-weight: 700;
    }
    .c-warn {
      color: #fbbf24;
      font-weight: 700;
    }
  `]
})
export class FeaturePageComponent {
  title = '';

  constructor(private readonly route: ActivatedRoute) {
    this.title = this.route.snapshot.data['title'] ?? 'Feature';
  }
}
