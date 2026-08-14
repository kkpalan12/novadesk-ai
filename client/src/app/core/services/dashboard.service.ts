import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import { ApiService } from './api.service';

export interface DashboardTaskStats {
  total: number;
  TODO: number;
  IN_PROGRESS: number;
  REVIEW: number;
  DONE: number;
}

export interface DashboardPriorityStats {
  LOW: number;
  MEDIUM: number;
  HIGH: number;
  CRITICAL: number;
}

export interface DashboardData {
  tasks: DashboardTaskStats;

  priorities: DashboardPriorityStats;

  myTasks: unknown[];

  recentActivities: unknown[];

  unreadNotifications: number;
}

export interface DashboardResponse {
  success: boolean;

  message: string;

  data: DashboardData;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly api = inject(ApiService);

  getDashboard(): Observable<DashboardResponse> {
    return this.api.get<DashboardResponse>('/dashboard');
  }
}
