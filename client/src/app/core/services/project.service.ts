import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

import {
  CreateProjectRequest,
  ProjectResponse,
  ProjectsResponse,
  UpdateProjectRequest,
} from '../models/project.model';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private readonly api = inject(ApiService);

  // =========================================
  // Get Projects
  // =========================================

  getProjects(
    workspaceId: string,
    page = 1,
    limit = 10,
  ): Observable<ProjectsResponse> {
    return this.api.get<ProjectsResponse>(
      `/projects?workspace=${workspaceId}&page=${page}&limit=${limit}`,
    );
  }

  // =========================================
  // Create Project
  // =========================================

  createProject(data: CreateProjectRequest): Observable<ProjectResponse> {
    return this.api.post<ProjectResponse>('/projects', data);
  }

  // =========================================
  // Get Single Project
  // =========================================

  getProject(projectId: string): Observable<ProjectResponse> {
    return this.api.get<ProjectResponse>(`/projects/${projectId}`);
  }

  // =========================================
  // Update Project
  // =========================================

  updateProject(
    projectId: string,
    data: UpdateProjectRequest,
  ): Observable<ProjectResponse> {
    return this.api.put<ProjectResponse>(`/projects/${projectId}`, data);
  }

  // =========================================
  // Delete Project
  // =========================================

  deleteProject(projectId: string): Observable<ProjectResponse> {
    return this.api.delete<ProjectResponse>(`/projects/${projectId}`);
  }
}
