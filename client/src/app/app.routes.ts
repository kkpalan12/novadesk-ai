import { Routes } from '@angular/router';

import { authGuard } from '../core/auth/auth.guard';
import { workspaceGuard } from '../core/workspace/workspace.guard';

import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

import { WorkspaceSelectionComponent } from './features/workspace/workspace-selection.component';

export const routes: Routes = [
  // =========================================
  // LOGIN
  // =========================================

  {
    path: 'login',

    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },

  // =========================================
  // WORKSPACE SELECTION
  // =========================================

  {
    path: 'workspaces',

    component: WorkspaceSelectionComponent,

    canActivate: [authGuard],
  },

  // =========================================
  // MAIN APPLICATION
  // =========================================

  {
    path: '',

    component: MainLayoutComponent,

    canActivate: [authGuard],

    children: [
      // ---------------------------------------
      // Root
      // ---------------------------------------

      {
        path: '',

        redirectTo: 'workspaces',

        pathMatch: 'full',
      },

      // ---------------------------------------
      // Dashboard
      // ---------------------------------------

      {
        path: 'dashboard',

        canActivate: [workspaceGuard],

        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },

      // ---------------------------------------
      // Projects
      // ---------------------------------------

      {
        path: 'projects',

        canActivate: [workspaceGuard],

        loadComponent: () =>
          import('./features/project/project.component').then(
            (m) => m.ProjectComponent,
          ),
      },

      // ---------------------------------------
      // Tasks
      // ---------------------------------------

      {
        path: 'tasks',

        canActivate: [workspaceGuard],

        loadComponent: () =>
          import('./features/task/task.component').then((m) => m.TaskComponent),
      },

      // ---------------------------------------
      // Task Detail
      // ---------------------------------------

      {
        path: 'tasks/:taskId',

        canActivate: [workspaceGuard],

        loadComponent: () =>
          import('./features/task/task-detail.component').then(
            (m) => m.TaskDetailComponent,
          ),
      },

      // ---------------------------------------
      // Notifications
      // ---------------------------------------

      {
        path: 'notifications',

        canActivate: [workspaceGuard],

        loadComponent: () =>
          import('./features/notification/notification.component').then(
            (m) => m.NotificationComponent,
          ),
      },
    ],
  },

  // =========================================
  // UNKNOWN ROUTE
  // =========================================

  {
    path: '**',

    redirectTo: 'workspaces',
  },
];
