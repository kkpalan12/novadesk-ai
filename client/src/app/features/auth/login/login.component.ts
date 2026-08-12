import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { WorkspaceContextService } from '../../../core/services/workspace-context.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);

  private readonly authService = inject(AuthService);

  private readonly router = inject(Router);

  private readonly workspaceContext = inject(WorkspaceContextService);

  // =========================================
  // State
  // =========================================

  readonly loading = signal(false);

  readonly errorMessage = signal('');

  // =========================================
  // Login Form
  // =========================================

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],

    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  // =========================================
  // Form Controls
  // =========================================

  get email() {
    return this.loginForm.controls.email;
  }

  get password() {
    return this.loginForm.controls.password;
  }

  // =========================================
  // Login
  // =========================================

  submit(): void {
    this.errorMessage.set('');

    // -----------------------------------------
    // Validate form
    // -----------------------------------------

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();

      return;
    }

    // -----------------------------------------
    // Start loading
    // -----------------------------------------

    this.loading.set(true);

    // -----------------------------------------
    // Login
    // -----------------------------------------

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      // =====================================
      // SUCCESS
      // =====================================

      next: () => {
        this.loading.set(false);

        /*
         * IMPORTANT
         *
         * Clear the workspace selected by the
         * previous login/session.
         *
         * This prevents Deepak from inheriting
         * Karthik's previous workspace selection.
         */

        this.workspaceContext.clearWorkspace();

        /*
         * Do NOT go directly to dashboard.
         *
         * Every login must first select a
         * workspace.
         */

        this.router.navigate(['/workspace/select']);
      },

      // =====================================
      // ERROR
      // =====================================

      error: (error) => {
        console.error('Login failed:', error);

        this.loading.set(false);

        this.errorMessage.set(
          error?.error?.message ?? 'Invalid email or password.',
        );
      },
    });
  }
}
