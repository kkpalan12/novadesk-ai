import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

import {
  CreateTaskRequest,
  TaskResponse,
  TasksResponse,
  UpdateTaskRequest,
} from '../models/task.model';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly api = inject(ApiService);

  getTasks(projectId: string, page = 1, limit = 20): Observable<TasksResponse> {
    return this.api.get<TasksResponse>(
      `/projects/${projectId}/tasks?page=${page}&limit=${limit}`,
    );
  }

  getTask(projectId: string, taskId: string): Observable<TaskResponse> {
    return this.api.get<TaskResponse>(`/projects/${projectId}/tasks/${taskId}`);
  }

  createTask(
    projectId: string,
    data: CreateTaskRequest,
  ): Observable<TaskResponse> {
    return this.api.post<TaskResponse>(`/projects/${projectId}/tasks`, data);
  }
  updateTask(
    projectId: string,
    taskId: string,
    data: UpdateTaskRequest,
  ): Observable<TaskResponse> {
    return this.api.put<TaskResponse>(
      `/projects/${projectId}/tasks/${taskId}`,
      data,
    );
  }

  deleteTask(projectId: string, taskId: string): Observable<unknown> {
    return this.api.delete(`/projects/${projectId}/tasks/${taskId}`);
  }

  assignTask(
    projectId: string,
    taskId: string,
    assignedTo: string,
  ): Observable<TaskResponse> {
    return this.api.patch<TaskResponse>(
      `/projects/${projectId}/tasks/${taskId}/assign`,
      { assignedTo },
    );
  }
  getTaskById(projectId: string, taskId: string): Observable<TaskResponse> {
    return this.api.get<TaskResponse>(`/projects/${projectId}/tasks/${taskId}`);
  }
}
