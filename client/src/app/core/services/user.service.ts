import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

export interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfileResponse {
  success: boolean;
  message: string;
  data: UserProfile;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
  data?: {
    message: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly api = inject(ApiService);

  // =========================================
  // Get Current User
  // =========================================

  getMe(): Observable<UserProfileResponse> {
    return this.api.get<UserProfileResponse>('/auth/me');
  }

  // =========================================
  // Update Profile
  // =========================================

  updateProfile(data: {
    firstName?: string;
    lastName?: string;
  }): Observable<UserProfileResponse> {
    return this.api.put<UserProfileResponse>('/users/me', data);
  }

  // =========================================
  // Change Password
  // =========================================

  changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Observable<ChangePasswordResponse> {
    return this.api.put<ChangePasswordResponse>('/users/me/password', data);
  }
}
