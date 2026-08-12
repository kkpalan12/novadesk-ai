import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);

  private readonly authService = inject(AuthService);

  private readonly router = inject(Router);

  readonly loading = signal(false);

  readonly errorMessage = signal('');

  readonly successMessage = signal('');

  readonly resetToken = signal('');

  readonly forgotForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  get email() {
    return this.forgotForm.controls.email;
  }

  submit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.resetToken.set('');

    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const email = this.email.value.trim().toLowerCase();

    this.authService.forgotPassword(email).subscribe({
      next: (response) => {
        this.loading.set(false);

        this.successMessage.set(
          response.message ||
            'If an account exists with this email, a reset token has been generated.',
        );

        /*
         * Development-only.
         *
         * Production will receive the token
         * through email instead.
         */
        if (response.data?.resetToken) {
          this.resetToken.set(response.data.resetToken);
        }
      },

      error: (error) => {
        console.error('Forgot password failed:', error);

        this.loading.set(false);

        this.errorMessage.set(
          error?.error?.message ?? 'Unable to process your request.',
        );
      },
    });
  }

  goToReset(): void {
    const token = this.resetToken();

    if (!token) {
      return;
    }

    this.router.navigate(['/reset-password'], {
      queryParams: {
        token,
      },
    });
  }
}
