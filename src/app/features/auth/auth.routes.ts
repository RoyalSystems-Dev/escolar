import { Routes } from '@angular/router';
import { noAuthGuard } from '../../core/auth/guards/auth.guard';

export const authRoutes: Routes = [
  {
    path: '',
    canActivate: [noAuthGuard],
    children: [
      { path: 'login', loadComponent: () => import('./login/login.component').then(m => m.LoginComponent) },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  }
];


