import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

import {
  Membership,
  MembershipRole,
  MembershipStatus,
  MembershipsResponse,
} from '../models/membership.model';

export interface MembershipResponse {
  success: boolean;
  message: string;
  data: Membership;
}

@Injectable({
  providedIn: 'root',
})
export class MembershipService {
  private readonly api = inject(ApiService);

  // =========================================
  // Get Workspace Members
  // =========================================

  getWorkspaceMembers(workspaceId: string): Observable<MembershipsResponse> {
    return this.api.get<MembershipsResponse>(
      `/memberships/workspace/${workspaceId}`,
    );
  }

  // =========================================
  // Add Member
  // =========================================

  addMember(
    workspaceId: string,
    userId: string,
    role: MembershipRole = 'MEMBER',
  ): Observable<MembershipResponse> {
    return this.api.post<MembershipResponse>('/memberships', {
      workspace: workspaceId,
      user: userId,
      role,
    });
  }

  // =========================================
  // Update Member Role
  // IMPORTANT: Backend uses PUT
  // =========================================

  updateMembership(
    membershipId: string,
    data: {
      role?: MembershipRole;
      status?: MembershipStatus;
    },
  ): Observable<MembershipResponse> {
    return this.api.put<MembershipResponse>(
      `/memberships/${membershipId}`,
      data,
    );
  }

  // =========================================
  // Remove Member
  // =========================================

  removeMember(membershipId: string): Observable<MembershipResponse> {
    return this.api.delete<MembershipResponse>(`/memberships/${membershipId}`);
  }
}
