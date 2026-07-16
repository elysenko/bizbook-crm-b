import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/role.guard';
import { FlowRoute } from './flow-meta';

// `data.flow` is the single source of truth for the user-flow graph AND the runtime navbar.
// The colossus flow-graph extractor projects it directly (zero heuristics).
//
// DEEP-LINKABLE STATE — every navigable UI state is reachable by URL: list filters bind to
// `?q=` / `?date=` query params the component restores from; detail + edit are `/:id` routes.
export const routes: Routes = ([
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
    data: { flow: { flowId: 'login', node: 'login', entry: true, edgesTo: ['today', 'signup'], label: 'Login' } },
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./features/signup/signup.component').then((m) => m.SignupComponent),
    data: { flow: { flowId: 'signup', node: 'signup', edgesTo: ['today', 'login'], label: 'Sign up' } },
  },
  {
    path: '',
    loadComponent: () =>
      import('./features/shell/app-shell.component').then((m) => m.AppShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'today', pathMatch: 'full' },
      {
        path: 'today',
        loadComponent: () =>
          import('./features/today/today.component').then((m) => m.TodayComponent),
        data: { flow: { flowId: 'today', node: 'today', showInNavbar: true, label: 'Today', icon: '📅', scope: 'all' } },
      },
      {
        path: 'clients',
        loadComponent: () =>
          import('./features/clients/clients-list.component').then((m) => m.ClientsListComponent),
        data: { flow: { flowId: 'clients', node: 'clients', showInNavbar: true, label: 'Clients', icon: '👥', scope: 'all', edgesTo: ['client-new', 'client-detail'] } },
      },
      {
        path: 'clients/new',
        loadComponent: () =>
          import('./features/clients/client-form.component').then((m) => m.ClientFormComponent),
        data: { flow: { flowId: 'client-new', node: 'client-new', label: 'New client', edgesTo: ['clients'] } },
      },
      {
        path: 'clients/:id',
        loadComponent: () =>
          import('./features/clients/client-detail.component').then((m) => m.ClientDetailComponent),
        data: { flow: { flowId: 'client-detail', node: 'client-detail', label: 'Client detail', edgesTo: ['client-edit', 'book'] } },
      },
      {
        path: 'clients/:id/edit',
        loadComponent: () =>
          import('./features/clients/client-form.component').then((m) => m.ClientFormComponent),
        data: { flow: { flowId: 'client-edit', node: 'client-edit', label: 'Edit client', edgesTo: ['client-detail'] } },
      },
      {
        path: 'services',
        loadComponent: () =>
          import('./features/services/services.component').then((m) => m.ServicesComponent),
        data: { flow: { flowId: 'services', node: 'services', showInNavbar: true, label: 'Services', icon: '✂️', scope: 'all', edgesTo: ['service-new', 'service-edit'] } },
      },
      {
        path: 'services/new',
        loadComponent: () =>
          import('./features/services/service-form.component').then((m) => m.ServiceFormComponent),
        canActivate: [adminGuard],
        data: { flow: { flowId: 'service-new', node: 'service-new', label: 'New service', scope: 'admin', edgesTo: ['services'] } },
      },
      {
        path: 'services/:id/edit',
        loadComponent: () =>
          import('./features/services/service-form.component').then((m) => m.ServiceFormComponent),
        canActivate: [adminGuard],
        data: { flow: { flowId: 'service-edit', node: 'service-edit', label: 'Edit service', scope: 'admin', edgesTo: ['services'] } },
      },
      {
        path: 'appointments',
        loadComponent: () =>
          import('./features/appointments/day-view.component').then((m) => m.DayViewComponent),
        data: { flow: { flowId: 'appointments', node: 'appointments', showInNavbar: true, label: 'Calendar', icon: '🗓️', scope: 'all', edgesTo: ['book'] } },
      },
      {
        path: 'appointments/new',
        loadComponent: () =>
          import('./features/appointments/book-appointment.component').then((m) => m.BookAppointmentComponent),
        data: { flow: { flowId: 'book', node: 'book', label: 'Book appointment', edgesTo: ['appointments'] } },
      },
      {
        path: 'revenue',
        loadComponent: () =>
          import('./features/revenue/revenue.component').then((m) => m.RevenueComponent),
        canActivate: [adminGuard],
        data: { flow: { flowId: 'revenue', node: 'revenue', showInNavbar: true, label: 'Revenue', icon: '💰', scope: 'admin' } },
      },
      {
        path: 'admin/settings',
        loadComponent: () =>
          import('./features/admin/admin-settings.component').then((m) => m.AdminSettingsComponent),
        canActivate: [adminGuard],
        data: { flow: { flowId: 'admin-settings', node: 'admin-settings', showInNavbar: true, label: 'Settings', icon: '⚙️', scope: 'admin' } },
      },
    ],
  },
  { path: '**', redirectTo: 'today' },
] satisfies FlowRoute[]) as Routes;
