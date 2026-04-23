import {Routes} from '@angular/router';
import {Landing} from './landing';
import {Auth} from './auth';
import {Onboarding} from './onboarding';
import {authGuard, guestGuard, onboardingGuard} from './auth.guard';
import {MainLayout} from './main-layout';
import {DashboardShell, CampaignPlanShell, TrackingShell, ResilienceShell} from './shells';
import {CropScannerComponent} from './crop-scanner';

export const routes: Routes = [
  { path: '', component: Landing },
  { path: 'auth', component: Auth, canActivate: [guestGuard] },
  { path: 'onboarding', component: Onboarding, canActivate: [onboardingGuard] },
  { 
    path: 'app', 
    component: MainLayout, 
    canActivate: [authGuard],
    children: [
      { path: '', component: DashboardShell },
      { path: 'plan', component: CampaignPlanShell },
      { path: 'tracking', component: TrackingShell },
      { path: 'resilience', component: ResilienceShell },
      { path: 'scan', component: CropScannerComponent },
    ]
  },
  { path: '**', redirectTo: '' }
];
