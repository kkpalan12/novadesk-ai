import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

import {
  WorkspaceListResponse,
  WorkspaceResponse,
} from '../models/workspace.model';

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
  logo?: string;
  members?: string[];
}

export interface UpdateWorkspaceRequest {
  name?: string;
  description?: string;
  logo?: string;
}

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

  // =========================================
  // Create Workspace
  // =========================================

  createWorkspace(data: CreateWorkspaceRequest): Observable<WorkspaceResponse> {
    return this.api.post<WorkspaceResponse>('/workspaces', data);
  }

  // =========================================
  // Update Workspace
  // =========================================

  updateWorkspace(
    workspaceId: string,
    data: UpdateWorkspaceRequest,
  ): Observable<WorkspaceResponse> {
    return this.api.put<WorkspaceResponse>(`/workspaces/${workspaceId}`, data);
  }
  deleteWorkspace(workspaceId: string): Observable<WorkspaceResponse> {
    return this.api.delete<WorkspaceResponse>(`/workspaces/${workspaceId}`);
  }
}
