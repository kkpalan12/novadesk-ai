import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';

import { LoginComponent } from './features/auth/login/login.component';

import { WorkspaceSelectionComponent } from './features/workspace/workspace-selection.component';

import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';
export const routes: Routes = [
  // =========================================
  // AUTH
  // =========================================

  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
  },

  {
    path: 'reset-password',
    component: ResetPasswordComponent,
  },

  // =========================================
  // WORKSPACE SELECTION
  // =========================================

  {
    path: 'workspace/select',
    component: WorkspaceSelectionComponent,
    canActivate: [authGuard],
  },

  // =========================================
  // APPLICATION
  // =========================================

  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],

    children: [
      // =====================================
      // DASHBOARD
      // =====================================

      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },

      // =====================================
      // PROJECTS
      // =====================================

      {
        path: 'projects',
        loadComponent: () =>
          import('./features/project/project.component').then(
            (m) => m.ProjectComponent,
          ),
      },

      // =====================================
      // TASKS
      //
      // Project is supplied through query params:
      //
      // /tasks?project=PROJECT_ID&workspace=WORKSPACE_ID
      // =====================================

      {
        path: 'tasks',
        loadComponent: () =>
          import('./features/task/task.component').then((m) => m.TaskComponent),
      },

      // =====================================
      // TASK DETAIL
      //
      // /tasks/TASK_ID?project=PROJECT_ID&workspace=WORKSPACE_ID
      // =====================================

      {
        path: 'tasks/:id',
        loadComponent: () =>
          import('./features/task/task-detail.component').then(
            (m) => m.TaskDetailComponent,
          ),
      },

      // =====================================
      // WORKSPACE MANAGEMENT
      // =====================================

      {
        path: 'workspace/manage',
        loadComponent: () =>
          import('./features/workspace/workspace.component').then(
            (m) => m.WorkspaceComponent,
          ),
      },

      // =====================================
      // NOTIFICATIONS
      // =====================================

      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notification/notification.component').then(
            (m) => m.NotificationComponent,
          ),
      },

      // =====================================
      // DEFAULT
      // =====================================

      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
    ],
  },

  // =========================================
  // FALLBACK
  // =========================================

  {
    path: '**',
    redirectTo: 'login',
  },
];
