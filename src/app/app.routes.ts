import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { LayoutComponent } from './shared/components/layout.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'materiels',
        loadComponent: () =>
          import('./features/materiels/materiels.component').then((m) => m.MaterielsComponent),
      },
      {
        path: 'materiels/gestion',
        canActivate: [roleGuard('GESTIONNAIRE')],
        loadComponent: () =>
          import('./features/materiels/gestion-materiels.component').then(
            (m) => m.GestionMaterielsComponent,
          ),
      },
      {
        path: 'emprunts',
        loadComponent: () =>
          import('./features/emprunts/emprunts.component').then((m) => m.EmpruntsComponent),
      },
      {
        path: 'emprunts/validation',
        canActivate: [roleGuard('GESTIONNAIRE')],
        loadComponent: () =>
          import('./features/emprunts/validation-emprunts.component').then(
            (m) => m.ValidationEmpruntsComponent,
          ),
      },
      {
        path: 'incidents',
        canActivate: [roleGuard('GESTIONNAIRE')],
        loadComponent: () =>
          import('./features/incidents/incidents.component').then((m) => m.IncidentsComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];