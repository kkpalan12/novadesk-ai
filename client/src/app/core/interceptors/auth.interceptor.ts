import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';

import {
  Observable,
  catchError,
  finalize,
  shareReplay,
  switchMap,
  throwError,
} from 'rxjs';

import { AuthService } from '../auth/auth.service';

let refreshRequest$: Observable<unknown> | null = null;

interface ApiErrorBody {
  success?: boolean;
  message?: string;
  error?: {
    message?: string;
    code?: string;
    details?: unknown;
  };
  errors?: unknown;
}

interface NormalizedApiError {
  status: number;
  message: string;
  code?: string;
  details?: unknown;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // =========================================
  // AUTH ENDPOINTS
  // =========================================

  const isAuthRequest =
    req.url.endsWith('/auth/login') ||
    req.url.endsWith('/auth/register') ||
    req.url.endsWith('/auth/refresh') ||
    req.url.endsWith('/auth/forgot-password') ||
    req.url.endsWith('/auth/reset-password');

  // =========================================
  // ACCESS TOKEN
  // =========================================

  const token = authService.getToken();

  const requestWithToken = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  // =========================================
  // AUTH REQUEST
  // =========================================

  if (isAuthRequest) {
    return next(requestWithToken).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError(() => normalizeApiError(error));
      }),
    );
  }

  // =========================================
  // NORMAL REQUEST
  // =========================================

  return next(requestWithToken).pipe(
    catchError((error: HttpErrorResponse) => {
      // =========================================
      // NON-401 ERRORS
      // =========================================

      if (error.status !== 401) {
        return throwError(() => normalizeApiError(error));
      }

      // =========================================
      // NO REFRESH TOKEN
      // =========================================

      if (!authService.getRefreshToken()) {
        authService.clearSession();

        void router.navigate(['/login']);

        return throwError(() => normalizeApiError(error));
      }

      // =========================================
      // PREVENT MULTIPLE REFRESH REQUESTS
      // =========================================

      if (!refreshRequest$) {
        refreshRequest$ = authService.refreshAccessToken().pipe(
          shareReplay({
            bufferSize: 1,
            refCount: false,
          }),
          finalize(() => {
            refreshRequest$ = null;
          }),
        );
      }

      // =========================================
      // REFRESH + RETRY
      // =========================================

      return refreshRequest$.pipe(
        switchMap(() => {
          const newToken = authService.getToken();

          if (!newToken) {
            authService.clearSession();

            void router.navigate(['/login']);

            return throwError(() => normalizeApiError(error));
          }

          return next(
            req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`,
              },
            }),
          );
        }),

        catchError((refreshError: HttpErrorResponse) => {
          authService.clearSession();

          void router.navigate(['/login']);

          return throwError(() => normalizeApiError(refreshError));
        }),
      );
    }),
  );
};

// =========================================
// NORMALIZE API ERROR
// =========================================

function normalizeApiError(error: HttpErrorResponse): HttpErrorResponse {
  const body = extractErrorBody(error);

  const message = getErrorMessage(error, body);

  const code = getErrorCode(body);

  const details = getErrorDetails(body);

  const normalizedBody: NormalizedApiError = {
    status: error.status,
    message,
    ...(code ? { code } : {}),
    ...(details !== undefined ? { details } : {}),
  };

  return new HttpErrorResponse({
    error: normalizedBody,
    headers: error.headers,
    status: error.status,
    statusText: error.statusText,
    url: error.url ?? undefined,
  });
}

// =========================================
// EXTRACT ERROR BODY
// =========================================

function extractErrorBody(error: HttpErrorResponse): ApiErrorBody | null {
  if (!error.error) {
    return null;
  }

  if (typeof error.error === 'string') {
    return null;
  }

  if (typeof error.error !== 'object') {
    return null;
  }

  return error.error as ApiErrorBody;
}

// =========================================
// ERROR MESSAGE
// =========================================

function getErrorMessage(
  error: HttpErrorResponse,
  body: ApiErrorBody | null,
): string {
  if (body?.message) {
    return body.message;
  }

  if (body?.error?.message) {
    return body.error.message;
  }

  if (typeof error.error === 'string' && error.error.trim()) {
    return error.error;
  }

  switch (error.status) {
    case 0:
      return 'Unable to connect to the server. Please check your connection.';

    case 400:
      return 'The request could not be processed. Please check your input.';

    case 401:
      return 'Your session has expired. Please sign in again.';

    case 403:
      return 'You do not have permission to perform this action.';

    case 404:
      return 'The requested resource was not found.';

    case 409:
      return 'This action conflicts with existing data.';

    case 422:
      return 'Some of the provided information is invalid.';

    case 429:
      return 'Too many requests. Please try again later.';

    case 500:
      return 'Something went wrong on the server.';

    case 502:
    case 503:
    case 504:
      return 'The server is temporarily unavailable. Please try again later.';

    default:
      return 'Something went wrong. Please try again.';
  }
}

// =========================================
// ERROR CODE
// =========================================

function getErrorCode(body: ApiErrorBody | null): string | undefined {
  return body?.error?.code;
}

// =========================================
// ERROR DETAILS
// =========================================

function getErrorDetails(body: ApiErrorBody | null): unknown {
  if (body?.error?.details !== undefined) {
    return body.error.details;
  }

  return body?.errors;
}
