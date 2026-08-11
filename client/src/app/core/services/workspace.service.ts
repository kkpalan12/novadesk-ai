import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import { ApiService } from './api.service';

import {
  WorkspaceListResponse,
  WorkspaceResponse,
} from '../models/workspace.model';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceService {
  private readonly api = inject(ApiService);

  // =========================================
  // Get Workspaces
  // =========================================

  getWorkspaces(): Observable<WorkspaceListResponse> {
    return this.api.get<WorkspaceListResponse>('/workspaces');
  }

  // =========================================
  // Get Single Workspace
  // =========================================

  getWorkspace(workspaceId: string): Observable<WorkspaceResponse> {
    return this.api.get<WorkspaceResponse>(`/workspaces/${workspaceId}`);
  }
}
