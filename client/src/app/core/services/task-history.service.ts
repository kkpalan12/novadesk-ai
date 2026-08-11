import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

import { TaskHistoryResponse } from '../models/task-history.model';

@Injectable({
  providedIn: 'root',
})
export class TaskHistoryService {
  private readonly api = inject(ApiService);

  getTaskHistory(taskId: string): Observable<TaskHistoryResponse> {
    return this.api.get<TaskHistoryResponse>(`/tasks/${taskId}/history`);
  }
}
