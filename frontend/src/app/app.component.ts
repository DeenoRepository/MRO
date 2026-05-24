import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'mro-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="header">
      <h1>MRO Platform</h1>
      <nav>
        <a routerLink="/eps" routerLinkActive="active">EPS</a>
        <a routerLink="/mms" routerLinkActive="active">MMS</a>
        <a routerLink="/wms" routerLinkActive="active">WMS</a>
        <a routerLink="/srs" routerLinkActive="active">SRS</a>
        <a routerLink="/reporting" routerLinkActive="active">Reporting</a>
        <a routerLink="/admin" routerLinkActive="active">Admin</a>
      </nav>
    </header>
    <main class="content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .header { padding: 12px 16px; border-bottom: 1px solid #ddd; }
    nav { display: flex; gap: 12px; flex-wrap: wrap; }
    a { text-decoration: none; color: #333; font-weight: 600; }
    a.active { color: #0057b8; }
    .content { padding: 16px; }
  `]
})
export class AppComponent {}

