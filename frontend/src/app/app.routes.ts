import { Routes } from '@angular/router';
import { FeaturePageComponent } from './shared/feature-page.component';
import { EpsPageComponent } from './features/eps/ui/eps-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'eps' },
  { path: 'eps', component: EpsPageComponent },
  { path: 'mms', component: FeaturePageComponent, data: { title: 'MMS' } },
  { path: 'wms', component: FeaturePageComponent, data: { title: 'WMS' } },
  { path: 'srs', component: FeaturePageComponent, data: { title: 'SRS' } },
  { path: 'reporting', component: FeaturePageComponent, data: { title: 'Reporting' } },
  { path: 'admin', component: FeaturePageComponent, data: { title: 'Admin' } },
  { path: '**', redirectTo: 'eps' }
];
