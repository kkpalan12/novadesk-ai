import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import { ApiService } from './api.service';

import {
  TaskResponse,
  TasksResponse,
  TaskPriority,
  TaskStatus,
} from '../models/task.model';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly api = inject(ApiService);

  // =========================================
  // GET ALL TASKS
  // =========================================

  getTasks(
    projectId: string,
    page = 1,
    limit = 10,
    search?: string,
    status?: TaskStatus,
    priority?: TaskPriority,
  ): Observable<TasksResponse> {
    const params: string[] = [`page=${page}`, `limit=${limit}`];

    if (search) {
      params.push(`search=${encodeURIComponent(search)}`);
    }

    if (status) {
      params.push(`status=${status}`);
    }

    if (priority) {
      params.push(`priority=${priority}`);
    }

    return this.api.get<TasksResponse>(
      `/projects/${projectId}/tasks?${params.join('&')}`,
    );
  }

  // =========================================
  // GET TASK
  // =========================================

  getTask(projectId: string, taskId: string): Observable<TaskResponse> {
    return this.api.get<TaskResponse>(`/projects/${projectId}/tasks/${taskId}`);
  }

  // =========================================
  // GET TASK BY ID
  //
  // Kept for TaskDetailComponent compatibility.
  // =========================================

  getTaskById(projectId: string, taskId: string): Observable<TaskResponse> {
    return this.getTask(projectId, taskId);
  }

  // =========================================
  // CREATE TASK
  // =========================================

  createTask(
    projectId: string,
    data: {
      title: string;
      description?: string;
      priority?: TaskPriority;
      assignedTo?: string;
      dueDate?: string;
    },
  ): Observable<TaskResponse> {
    return this.api.post<TaskResponse>(`/projects/${projectId}/tasks`, data);
  }

  // =========================================
  // UPDATE TASK
  // =========================================

  updateTask(
    projectId: string,
    taskId: string,
    data: {
      title?: string;
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      assignedTo?: string;
      dueDate?: string;
    },
  ): Observable<TaskResponse> {
    return this.api.put<TaskResponse>(
      `/projects/${projectId}/tasks/${taskId}`,
      data,
    );
  }

  // =========================================
  // DELETE TASK
  // =========================================

  deleteTask(projectId: string, taskId: string): Observable<TaskResponse> {
    return this.api.delete<TaskResponse>(
      `/projects/${projectId}/tasks/${taskId}`,
    );
  }

  // =========================================
  // ASSIGN TASK
  // =========================================

  assignTask(
    projectId: string,
    taskId: string,
    assignedTo: string,
  ): Observable<TaskResponse> {
    return this.api.patch<TaskResponse>(
      `/projects/${projectId}/tasks/${taskId}/assign`,
      {
        assignedTo,
      },
    );
  }
}
