import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

import { ActivityResponse } from '../models/activity.model';

@Injectable({
  providedIn: 'root',
})
export class ActivityService {
  private readonly api = inject(ApiService);

  getProjectActivity(
    projectId: string,
    page = 1,
    limit = 20,
  ): Observable<ActivityResponse> {
    return this.api.get<ActivityResponse>(
      `/projects/${projectId}/activity?page=${page}&limit=${limit}`,
    );
  }
}
