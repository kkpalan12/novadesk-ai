import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);

  private readonly authService = inject(AuthService);

  private readonly router = inject(Router);

  // =========================================
  // STATE
  // =========================================

  readonly loading = signal(false);

  readonly errorMessage = signal('');

  readonly successMessage = signal('');

  // =========================================
  // FORM
  // =========================================

  readonly registerForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],

    lastName: ['', [Validators.required, Validators.minLength(2)]],

    email: ['', [Validators.required, Validators.email]],

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

  // =========================================
  // CONTROLS
  // =========================================

  get firstName() {
    return this.registerForm.controls.firstName;
  }

  get lastName() {
    return this.registerForm.controls.lastName;
  }

  get email() {
    return this.registerForm.controls.email;
  }

  get password() {
    return this.registerForm.controls.password;
  }

  get confirmPassword() {
    return this.registerForm.controls.confirmPassword;
  }

  // =========================================
  // SUBMIT
  // =========================================

  submit(): void {
    this.errorMessage.set('');

    this.successMessage.set('');

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();

      return;
    }

    const { firstName, lastName, email, password, confirmPassword } =
      this.registerForm.getRawValue();

    if (password !== confirmPassword) {
      this.errorMessage.set('Passwords do not match.');

      this.confirmPassword.markAsTouched();

      return;
    }

    this.loading.set(true);

    this.authService
      .register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
      })
      .subscribe({
        next: (response) => {
          this.loading.set(false);

          this.successMessage.set(
            response.message ?? 'Registration successful.',
          );

          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1000);
        },

        error: (error) => {
          console.error('Registration failed:', error);

          this.loading.set(false);

          this.errorMessage.set(
            error?.error?.message ?? 'Unable to create your account.',
          );
        },
      });
  }

  // =========================================
  // LOGIN
  // =========================================

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
