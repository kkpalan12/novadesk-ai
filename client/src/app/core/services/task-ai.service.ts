import { Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import { ApiService } from './api.service';

import { TaskAiAnalysisResponse } from '../models/task-ai.model';

@Injectable({
  providedIn: 'root',
})
export class TaskAiService {
  private readonly api = inject(ApiService);

  // =========================================
  // ANALYZE TASK
  // =========================================

  analyzeTask(
    projectId: string,
    taskId: string,
  ): Observable<TaskAiAnalysisResponse> {
    return this.api.post<TaskAiAnalysisResponse>(
      `/projects/${projectId}/tasks/${taskId}/ai/analyze`,
      {},
    );
  }
}
