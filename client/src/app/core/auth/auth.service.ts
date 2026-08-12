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

          localStorage.setItem(this.tokenKey, response.data.accessToken);

          localStorage.setItem(
            this.refreshTokenKey,
            response.data.refreshToken,
          );

          localStorage.setItem(
            this.userKey,
            JSON.stringify(response.data.user),
          );
        }),
      );
  }

  // =========================================
  // LOGOUT
  // =========================================

  logout(): void {
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
      return null;
    }
  }

  // =========================================
  // AUTH STATE
  // =========================================

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
