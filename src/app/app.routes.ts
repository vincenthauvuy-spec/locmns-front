import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'materiels',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/materiels/materiels.component').then(m => m.MaterielsComponent)
  },
  {
    path: 'materiels/gestion',
    canActivate: [authGuard, roleGuard('GESTIONNAIRE')],
    loadComponent: () =>
      import('./features/materiels/gestion-materiels.component').then(m => m.GestionMaterielsComponent)
  },
  {
    path: 'emprunts',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/emprunts/emprunts.component').then(m => m.EmpruntsComponent)
  },
  {
    path: 'emprunts/validation',
    canActivate: [authGuard, roleGuard('GESTIONNAIRE')],
    loadComponent: () =>
      import('./features/emprunts/validation-emprunts.component').then(m => m.ValidationEmpruntsComponent)
  },
  {
    path: 'incidents',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/incidents/incidents.component').then(m => m.IncidentsComponent)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];