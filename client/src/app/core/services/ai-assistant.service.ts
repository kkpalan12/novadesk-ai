import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import { ApiService } from './api.service';

export interface AiChatRequest {
  message: string;
  workspaceId: string;
  projectId?: string;
}

export interface AiProjectMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  reviewTasks: number;
  highPriorityTasks: number;
  criticalTasks: number;
  unassignedTasks: number;
  overdueTasks: number;
  dueSoonTasks: number;
}

export interface AiChatResponse {
  success: boolean;
  message: string;

  data: {
    message: string;

    metrics?: AiProjectMetrics;

    project?: {
      id: string;
      name: string;
    };
  };
}

@Injectable({
  providedIn: 'root',
})
export class AiAssistantService {
  private readonly api = inject(ApiService);

  chat(request: AiChatRequest): Observable<AiChatResponse> {
    return this.api.post<AiChatResponse>('/ai/chat', request);
  }
}
