import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent {
  private readonly fb = inject(FormBuilder);

  private readonly authService = inject(AuthService);

  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  readonly loading = signal(false);

  readonly errorMessage = signal('');

  readonly successMessage = signal('');

  readonly token = signal('');

  readonly resetForm = this.fb.nonNullable.group({
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])/),
      ],
    ],

    confirmPassword: ['', [Validators.required]],
  });

  constructor() {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (token) {
      this.token.set(token);
    } else {
      this.errorMessage.set('Password reset token is missing.');
    }
  }

  get password() {
    return this.resetForm.controls.password;
  }

  get confirmPassword() {
    return this.resetForm.controls.confirmPassword;
  }

  submit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (!this.token()) {
      this.errorMessage.set('Password reset token is missing or invalid.');

      return;
    }

    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const { password, confirmPassword } = this.resetForm.getRawValue();

    if (password !== confirmPassword) {
      this.errorMessage.set('Passwords do not match.');

      this.confirmPassword.markAsTouched();

      return;
    }

    this.loading.set(true);

    this.authService.resetPassword(this.token(), password).subscribe({
      next: (response) => {
        this.loading.set(false);

        this.successMessage.set(
          response.message || 'Password reset successfully.',
        );

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1200);
      },

      error: (error) => {
        console.error('Password reset failed:', error);

        this.loading.set(false);

        this.errorMessage.set(
          error?.error?.message ?? 'Unable to reset your password.',
        );
      },
    });
  }
}
