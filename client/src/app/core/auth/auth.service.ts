import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  LoginRequest,
  LoginResponse,
  AuthUser,
  RegisterRequest,
  RegisterResponse,
} from './auth.model';

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl;

  private readonly tokenKey = 'accessToken';
  private readonly refreshTokenKey = 'refreshToken';
  private readonly userKey = 'currentUser';

  constructor(private readonly http: HttpClient) {}

  // =========================================
  // REGISTER
  // =========================================

  register(userData: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(
      `${this.apiUrl}/auth/register`,
      userData,
    );
  }

  // =========================================
  // LOGIN
  // =========================================

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((response) => {
          if (!response.success || !response.data) {
            return;
          }

          this.storeSession(
            response.data.accessToken,
            response.data.refreshToken,
            response.data.user,
          );
        }),
      );
  }

  // =========================================
  // REFRESH TOKEN
  // =========================================

  refreshAccessToken(): Observable<RefreshTokenResponse> {
    const refreshToken = this.getRefreshToken();

    return this.http
      .post<RefreshTokenResponse>(`${this.apiUrl}/auth/refresh`, {
        refreshToken,
      })
      .pipe(
        tap((response) => {
          if (!response.success || !response.data) {
            return;
          }

          localStorage.setItem(this.tokenKey, response.data.accessToken);

          localStorage.setItem(
            this.refreshTokenKey,
            response.data.refreshToken,
          );
        }),
      );
  }

  // =========================================
  // LOGOUT
  // =========================================

  logout(): void {
    this.clearSession();
  }

  // =========================================
  // CLEAR SESSION
  // =========================================

  clearSession(): void {
    localStorage.removeItem(this.tokenKey);

    localStorage.removeItem(this.refreshTokenKey);

    localStorage.removeItem(this.userKey);
  }

  // =========================================
  // TOKEN
  // =========================================

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  // =========================================
  // CURRENT USER
  // =========================================

  getCurrentUser(): AuthUser | null {
    const user = localStorage.getItem(this.userKey);

    if (!user) {
      return null;
    }

    try {
      return JSON.parse(user) as AuthUser;
    } catch {
      this.clearSession();

      return null;
    }
  }

  // =========================================
  // AUTH STATE
  // =========================================

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // =========================================
  // FORGOT PASSWORD
  // =========================================

  forgotPassword(email: string): Observable<{
    success: boolean;
    message: string;
    data?: {
      message: string;
      resetToken?: string;
    };
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      data?: {
        message: string;
        resetToken?: string;
      };
    }>(`${this.apiUrl}/auth/forgot-password`, {
      email,
    });
  }

  // =========================================
  // RESET PASSWORD
  // =========================================

  resetPassword(
    token: string,
    password: string,
  ): Observable<{
    success: boolean;
    message: string;
    data?: {
      message: string;
    };
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      data?: {
        message: string;
      };
    }>(`${this.apiUrl}/auth/reset-password`, {
      token,
      password,
    });
  }

  // =========================================
  // PRIVATE SESSION STORAGE
  // =========================================

  private storeSession(
    accessToken: string,
    refreshToken: string,
    user: AuthUser,
  ): void {
    localStorage.setItem(this.tokenKey, accessToken);

    localStorage.setItem(this.refreshTokenKey, refreshToken);

    localStorage.setItem(this.userKey, JSON.stringify(user));
  }
}
