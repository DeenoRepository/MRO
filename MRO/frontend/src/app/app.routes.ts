import { Routes } from '@angular/router';
import { FeaturePageComponent } from './shared/feature-page.component';
import { EpsPageComponent } from './features/eps/ui/eps-page.component';
import { MmsPageComponent } from './features/mms/ui/mms-page.component';
import { WmsPageComponent } from './features/wms/ui/wms-page.component';
import { SrsPageComponent } from './features/srs/ui/srs-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'eps' },
  { path: 'eps', component: EpsPageComponent },
  { path: 'mms', component: MmsPageComponent },
  { path: 'wms', component: WmsPageComponent },
  { path: 'srs', component: SrsPageComponent },
  { path: 'reporting', component: FeaturePageComponent, data: { title: 'Reporting' } },
  { path: 'admin', component: FeaturePageComponent, data: { title: 'Admin' } },
  { path: '**', redirectTo: 'eps' }
];
