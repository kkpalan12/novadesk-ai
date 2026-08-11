import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Router } from '@angular/router';

import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);

  private readonly authService = inject(AuthService);

  private readonly router = inject(Router);

  // =========================================
  // State
  // =========================================

  readonly loading = signal(false);

  readonly errorMessage = signal('');

  // =========================================
  // Form
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

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();

      return;
    }

    this.loading.set(true);

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);

        /*
         * Do NOT go directly to Dashboard.
         *
         * User must select a workspace first.
         */

        this.router.navigate(['/workspaces']);
      },

      error: (error) => {
        this.loading.set(false);

        this.errorMessage.set(
          error?.error?.message ?? 'Invalid email or password.',
        );
      },
    });
  }
}
