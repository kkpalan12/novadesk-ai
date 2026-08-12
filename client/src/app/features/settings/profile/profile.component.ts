import { CommonModule } from '@angular/common';

import { Component, inject, OnInit, signal } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { UserProfile, UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  private readonly userService = inject(UserService);

  // =========================================
  // State
  // =========================================

  readonly loading = signal(false);

  readonly saving = signal(false);

  readonly changingPassword = signal(false);

  readonly errorMessage = signal('');

  readonly successMessage = signal('');

  readonly passwordErrorMessage = signal('');

  readonly passwordSuccessMessage = signal('');

  readonly user = signal<UserProfile | null>(null);

  // =========================================
  // Profile Form
  // =========================================

  readonly profileForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],

    lastName: ['', [Validators.required, Validators.minLength(2)]],

    email: [
      {
        value: '',
        disabled: true,
      },
    ],
  });

  // =========================================
  // Change Password Form
  // =========================================

  readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],

    newPassword: [
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
  // Lifecycle
  // =========================================

  ngOnInit(): void {
    this.loadProfile();
  }

  // =========================================
  // Profile Controls
  // =========================================

  get firstName() {
    return this.profileForm.controls.firstName;
  }

  get lastName() {
    return this.profileForm.controls.lastName;
  }

  get email() {
    return this.profileForm.controls.email;
  }

  // =========================================
  // Password Controls
  // =========================================

  get currentPassword() {
    return this.passwordForm.controls.currentPassword;
  }

  get newPassword() {
    return this.passwordForm.controls.newPassword;
  }

  get confirmPassword() {
    return this.passwordForm.controls.confirmPassword;
  }

  // =========================================
  // Load Profile
  // =========================================

  loadProfile(): void {
    this.loading.set(true);

    this.errorMessage.set('');

    this.successMessage.set('');

    this.userService.getMe().subscribe({
      next: (response) => {
        this.loading.set(false);

        const profile = response.data;

        this.user.set(profile);

        this.profileForm.patchValue({
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
        });
      },

      error: (error) => {
        console.error('Failed to load profile:', error);

        this.loading.set(false);

        this.errorMessage.set(
          error?.error?.message ?? 'Unable to load your profile.',
        );
      },
    });
  }

  // =========================================
  // Update Profile
  // =========================================

  submit(): void {
    this.errorMessage.set('');

    this.successMessage.set('');

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();

      return;
    }

    this.saving.set(true);

    const { firstName, lastName } = this.profileForm.getRawValue();

    this.userService
      .updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      })
      .subscribe({
        next: (response) => {
          this.saving.set(false);

          this.user.set(response.data);

          this.profileForm.patchValue({
            firstName: response.data.firstName,

            lastName: response.data.lastName,

            email: response.data.email,
          });

          this.successMessage.set('Profile updated successfully.');
        },

        error: (error) => {
          console.error('Profile update failed:', error);

          this.saving.set(false);

          this.errorMessage.set(
            error?.error?.message ?? 'Unable to update your profile.',
          );
        },
      });
  }

  // =========================================
  // Change Password
  // =========================================

  changePassword(): void {
    this.passwordErrorMessage.set('');

    this.passwordSuccessMessage.set('');

    // -----------------------------------------
    // Validate
    // -----------------------------------------

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();

      return;
    }

    const { currentPassword, newPassword, confirmPassword } =
      this.passwordForm.getRawValue();

    // -----------------------------------------
    // Confirm Password
    // -----------------------------------------

    if (newPassword !== confirmPassword) {
      this.passwordErrorMessage.set('Passwords do not match.');

      this.confirmPassword.markAsTouched();

      return;
    }

    // -----------------------------------------
    // Start Loading
    // -----------------------------------------

    this.changingPassword.set(true);

    // -----------------------------------------
    // API
    // -----------------------------------------

    this.userService
      .changePassword({
        currentPassword,
        newPassword,
      })
      .subscribe({
        // =====================================
        // SUCCESS
        // =====================================

        next: (response) => {
          this.changingPassword.set(false);

          /*
           * Clear password fields after
           * successful password change.
           */

          this.passwordForm.reset();

          this.passwordSuccessMessage.set(
            response.message || 'Password changed successfully.',
          );
        },

        // =====================================
        // ERROR
        // =====================================

        error: (error) => {
          console.error('Password change failed:', error);

          this.changingPassword.set(false);

          this.passwordErrorMessage.set(
            error?.error?.message ?? 'Unable to change password.',
          );
        },
      });
  }
}
