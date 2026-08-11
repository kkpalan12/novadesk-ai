import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

import {
  CreateProjectRequest,
  ProjectResponse,
  ProjectsResponse,
} from '../models/project.model';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private readonly api = inject(ApiService);

  getProjects(
    workspaceId: string,
    page = 1,
    limit = 10,
  ): Observable<ProjectsResponse> {
    return this.api.get<ProjectsResponse>(
      `/projects?workspace=${workspaceId}&page=${page}&limit=${limit}`,
    );
  }

  createProject(data: CreateProjectRequest): Observable<ProjectResponse> {
    return this.api.post<ProjectResponse>('/projects', data);
  }
  getProject(projectId: string): Observable<ProjectResponse> {
    return this.api.get<ProjectResponse>(`/projects/${projectId}`);
  }
}
