import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth.guards';
import { AuthPage } from './pages/auth-page/auth-page';
import { DashboardPage } from './pages/dashboard/dashboard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'login',
    component: AuthPage,
    canActivate: [guestGuard],
    data: { mode: 'login' },
  },
  {
    path: 'register',
    component: AuthPage,
    canActivate: [guestGuard],
    data: { mode: 'register' },
  },
  {
    path: 'dashboard',
    component: DashboardPage,
    canActivate: [authGuard],
  },
  {
    path: 'contacts',
    loadComponent: () => import('./pages/contacts/contacts').then((m) => m.ContactsPage),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'dashboard' },
];
