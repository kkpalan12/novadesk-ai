import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

import { MembershipsResponse } from '../models/membership.model';

@Injectable({
  providedIn: 'root',
})
export class MembershipService {
  private readonly api = inject(ApiService);

  getWorkspaceMembers(workspaceId: string): Observable<MembershipsResponse> {
    return this.api.get<MembershipsResponse>(
      `/memberships/workspace/${workspaceId}`,
    );
  }
}
