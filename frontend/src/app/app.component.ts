import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'mro-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-layout">
      <!-- SIDEBAR -->
      <aside class="sidebar">
        <div class="logo-area">
          <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <div class="logo-text">
            <span class="brand">MRO</span>
            <span class="sub">ENTERPRISE</span>
          </div>
        </div>
        
        <nav class="nav-menu">
          <a routerLink="/eps" routerLinkActive="active" class="nav-item">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            <span>Equipment (EPS)</span>
          </a>
          <a routerLink="/mms" routerLinkActive="active" class="nav-item">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
            <span>Maintenance (MMS)</span>
          </a>
          <a routerLink="/wms" routerLinkActive="active" class="nav-item">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            <span>Warehouse (WMS)</span>
          </a>
          <a routerLink="/srs" routerLinkActive="active" class="nav-item">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Service Tickets (SRS)</span>
          </a>
          <a routerLink="/reporting" routerLinkActive="active" class="nav-item">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            <span>Reporting & KPIs</span>
          </a>
          <a routerLink="/admin" routerLinkActive="active" class="nav-item">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            <span>Admin Console</span>
          </a>
        </nav>

        <div class="user-profile">
          <div class="avatar">AD</div>
          <div class="info">
            <span class="name">Administrator</span>
            <span class="role">System Administrator</span>
          </div>
        </div>
      </aside>

      <!-- MAIN CONTAINER -->
      <div class="main-container">
        <!-- TOPBAR -->
        <header class="topbar">
          <div class="page-title">
            <h2>{{ currentPageTitle }}</h2>
            <span class="breadcrumbs">MRO / {{ currentPageTitle }}</span>
          </div>

          <div class="toolbar">
            <div class="status-indicator">
              <span class="pulse"></span>
              <span class="status-text">SYSTEM ACTIVE</span>
            </div>
            
            <div class="correlation-search">
              <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" placeholder="Search correlation IDs..." />
            </div>
          </div>
        </header>

        <!-- MAIN SCROLLABLE CONTENT -->
        <main class="content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      width: 100vw;
      height: 100vh;
      background-color: var(--bg-color);
      overflow: hidden;
    }
    .sidebar {
      width: 280px;
      background-color: var(--bg-sidebar);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      padding: 24px 16px;
      box-sizing: border-box;
      flex-shrink: 0;
    }
    .logo-area {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 32px;
      padding: 0 8px;
    }
    .logo-icon {
      width: 32px;
      height: 32px;
      color: var(--primary-color);
    }
    .logo-text {
      display: flex;
      flex-direction: column;
    }
    .brand {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      background: var(--primary-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .sub {
      font-size: 0.65rem;
      font-weight: 600;
      color: var(--text-muted);
      letter-spacing: 0.1em;
    }
    .nav-menu {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex-grow: 1;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      color: var(--text-muted);
      text-decoration: none;
      font-weight: 500;
      font-size: 0.95rem;
      border-radius: var(--border-radius-md);
      transition: var(--transition-smooth);
    }
    .nav-item:hover {
      background-color: hsl(220, 20%, 95%);
      color: var(--text-color);
    }
    .nav-item.active {
      background: var(--primary-gradient);
      color: white;
      box-shadow: 0 4px 14px hsla(220, 90%, 56%, 0.2);
    }
    .nav-icon {
      width: 20px;
      height: 20px;
    }
    .user-profile {
      display: flex;
      align-items: center;
      gap: 12px;
      border-top: 1px solid var(--border-color);
      padding-top: 20px;
    }
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--primary-gradient);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
    }
    .info {
      display: flex;
      flex-direction: column;
    }
    .name {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-color);
    }
    .role {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .main-container {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      height: 100%;
      overflow: hidden;
    }
    .topbar {
      height: 80px;
      background-color: var(--bg-sidebar);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 32px;
      box-sizing: border-box;
      flex-shrink: 0;
    }
    .page-title h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
    }
    .breadcrumbs {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .toolbar {
      display: flex;
      align-items: center;
      gap: 24px;
    }
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      background-color: var(--success-bg);
      border: 1px solid hsla(142, 70%, 45%, 0.2);
      padding: 6px 12px;
      border-radius: var(--border-radius-sm);
    }
    .pulse {
      width: 8px;
      height: 8px;
      background-color: var(--success-color);
      border-radius: 50%;
      box-shadow: 0 0 8px var(--success-color);
      animation: pulse-animation 2s infinite;
    }
    @keyframes pulse-animation {
      0% { transform: scale(0.9); opacity: 0.8; }
      50% { transform: scale(1.1); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0.8; }
    }
    .status-text {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--success-color);
      letter-spacing: 0.05em;
    }
    .correlation-search {
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-icon {
      position: absolute;
      left: 12px;
      width: 16px;
      height: 16px;
      color: var(--text-muted);
    }
    .correlation-search input {
      padding-left: 36px !important;
      width: 220px;
      font-size: 0.85rem;
    }
    .content {
      flex-grow: 1;
      padding: 32px;
      overflow-y: auto;
      box-sizing: border-box;
    }
  `]
})
export class AppComponent {
  currentPageTitle = 'Equipment Registry';

  constructor(private readonly router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      const currentUrl = this.router.url;
      if (currentUrl.includes('/eps')) {
        this.currentPageTitle = 'Equipment Registry';
      } else if (currentUrl.includes('/mms')) {
        this.currentPageTitle = 'Maintenance (MMS)';
      } else if (currentUrl.includes('/wms')) {
        this.currentPageTitle = 'Warehouse (WMS)';
      } else if (currentUrl.includes('/srs')) {
        this.currentPageTitle = 'Service Tickets';
      } else if (currentUrl.includes('/reporting')) {
        this.currentPageTitle = 'Reporting & KPIs';
      } else if (currentUrl.includes('/admin')) {
        this.currentPageTitle = 'Admin Console';
      }
    });
  }
}
