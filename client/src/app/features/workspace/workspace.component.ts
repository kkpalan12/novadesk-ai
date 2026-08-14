import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';

import { WorkspaceService } from '../../core/services/workspace.service';
import { Workspace } from '../../core/models/workspace.model';

import { MembershipService } from '../../core/services/membership.service';
import { Membership, MembershipRole } from '../../core/models/membership.model';

import { SearchService } from '../../core/services/search.service';
import { SearchUser } from '../../core/models/search.model';

import { AuthService } from '../../core/auth/auth.service';
import { SocketService } from '../../core/services/socket.service';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './workspace.component.html',
  styleUrl: './workspace.component.scss',
})
export class WorkspaceComponent implements OnInit, OnDestroy {
  private readonly workspaceService = inject(WorkspaceService);

  private readonly membershipService = inject(MembershipService);

  private readonly searchService = inject(SearchService);

  private readonly authService = inject(AuthService);
  private readonly socketService = inject(SocketService);

  private readonly fb = inject(FormBuilder);

  // =========================================
  // Current User
  // =========================================

  readonly currentUser = this.authService.getCurrentUser();

  // =========================================
  // Workspace State
  // =========================================

  readonly workspaces = signal<Workspace[]>([]);

  readonly loading = signal(true);

  readonly errorMessage = signal('');

  readonly selectedWorkspace = signal<Workspace | null>(null);

  // =========================================
  // Members State
  // =========================================

  readonly members = signal<Membership[]>([]);

  readonly membersLoading = signal(false);

  readonly memberActionLoading = signal(false);

  readonly memberError = signal('');

  readonly showAddMember = signal(false);

  // =========================================
  // Member Roles
  // =========================================

  readonly memberRoles: MembershipRole[] = ['ADMIN', 'MEMBER'];

  // =========================================
  // Add Member Search
  // =========================================

  userId = '';

  readonly memberRole = signal<MembershipRole>('MEMBER');

  readonly userSearchQuery = signal('');

  readonly userSearchResults = signal<SearchUser[]>([]);

  readonly userSearchLoading = signal(false);

  readonly selectedUser = signal<SearchUser | null>(null);

  // =========================================
  // Create Workspace
  // =========================================

  readonly showCreateWorkspace = signal(false);

  readonly createWorkspaceLoading = signal(false);

  readonly createWorkspaceError = signal('');

  readonly createWorkspaceSuccess = signal('');

  readonly createWorkspaceForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],

    description: [''],
  });

  // =========================================
  // Edit Workspace
  // =========================================

  readonly showEditWorkspace = signal(false);

  readonly editWorkspaceLoading = signal(false);

  readonly editWorkspaceError = signal('');

  readonly editWorkspaceForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],

    description: [''],
  });
  // =========================================
  // PRESENCE
  // =========================================

  readonly onlineUsers = signal<Set<string>>(new Set());

  // =========================================
  // Lifecycle
  // =========================================

  ngOnInit(): void {
    this.socketService.connect();

    this.initializeWorkspaceRealtime();

    this.initializePresenceRealtime();

    this.loadWorkspaces();
    this.socketService.requestOnlineUsers();
  }

  // =========================================
  // Load Workspaces
  // =========================================

  private loadWorkspaces(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.workspaceService.getWorkspaces().subscribe({
      next: (response) => {
        const workspaces = response?.data?.workspaces ?? [];

        this.workspaces.set(workspaces);
        workspaces.forEach((workspace) => {
          this.socketService.joinWorkspace(workspace._id);
        });

        this.loading.set(false);

        if (workspaces.length > 0) {
          this.selectWorkspace(workspaces[0]);
        } else {
          this.selectedWorkspace.set(null);
          this.members.set([]);
        }
      },

      error: (error) => {
        this.loading.set(false);

        this.errorMessage.set(
          error?.error?.message ?? 'Unable to load workspaces.',
        );
      },
    });
  }

  // =========================================
  // Select Workspace
  // =========================================

  selectWorkspace(workspace: Workspace): void {
    this.selectedWorkspace.set(workspace);

    this.resetAddMemberForm();

    this.loadMembers(workspace._id);
  }

  // =========================================
  // Load Members
  // =========================================

  private loadMembers(workspaceId: string): void {
    this.membersLoading.set(true);
    this.memberError.set('');

    this.membershipService.getWorkspaceMembers(workspaceId).subscribe({
      next: (response) => {
        const members = response?.data ?? [];

        this.members.set(members);

        this.membersLoading.set(false);
      },

      error: (error) => {
        this.members.set([]);

        this.membersLoading.set(false);

        this.memberError.set(
          error?.error?.message ?? 'Unable to load workspace members.',
        );
      },
    });
  }

  // =========================================
  // Current User Is Workspace Owner
  // =========================================

  isCurrentUserWorkspaceOwner(): boolean {
    const workspace = this.selectedWorkspace();

    const currentUser = this.currentUser;

    if (!workspace || !currentUser) {
      return false;
    }

    return workspace.owner._id === currentUser._id;
  }

  // =========================================
  // Check If Member Is Workspace Owner
  // =========================================

  isWorkspaceOwner(member: Membership): boolean {
    const workspace = this.selectedWorkspace();

    if (!workspace) {
      return false;
    }

    if (!member.user) {
      return false;
    }

    return workspace.owner._id === member.user._id;
  }

  // =========================================
  // Open Add Member
  // =========================================

  openAddMember(): void {
    if (!this.isCurrentUserWorkspaceOwner()) {
      return;
    }

    this.resetAddMemberForm();

    this.showAddMember.set(true);
  }

  // =========================================
  // Close Add Member
  // =========================================

  closeAddMember(): void {
    if (this.memberActionLoading()) {
      return;
    }

    this.showAddMember.set(false);

    this.resetAddMemberForm();
  }

  // =========================================
  // Reset Add Member
  // =========================================

  private resetAddMemberForm(): void {
    this.userId = '';

    this.memberRole.set('MEMBER');

    this.userSearchQuery.set('');

    this.userSearchResults.set([]);

    this.userSearchLoading.set(false);

    this.selectedUser.set(null);

    this.memberError.set('');
  }

  // =========================================
  // Search Users
  // =========================================

  searchUsers(): void {
    if (!this.isCurrentUserWorkspaceOwner()) {
      return;
    }

    const query = this.userSearchQuery().trim();

    this.selectedUser.set(null);

    this.userId = '';

    if (!query) {
      this.userSearchResults.set([]);
      return;
    }

    if (query.length < 2) {
      this.userSearchResults.set([]);
      return;
    }

    this.userSearchLoading.set(true);

    this.memberError.set('');

    this.searchService.search(query).subscribe({
      next: (response) => {
        const users = response?.data?.users?.items ?? [];

        this.userSearchResults.set(users);

        this.userSearchLoading.set(false);
      },

      error: (error) => {
        this.userSearchResults.set([]);

        this.userSearchLoading.set(false);

        this.memberError.set(
          error?.error?.message ?? 'Unable to search users.',
        );
      },
    });
  }

  // =========================================
  // Select User
  // =========================================

  selectUser(user: SearchUser): void {
    if (!this.isCurrentUserWorkspaceOwner()) {
      return;
    }

    this.selectedUser.set(user);

    this.userId = user._id;

    this.userSearchQuery.set(`${user.firstName} ${user.lastName}`);

    this.userSearchResults.set([]);
  }

  // =========================================
  // Add Member
  // =========================================

  addMember(): void {
    if (!this.isCurrentUserWorkspaceOwner()) {
      return;
    }

    const workspace = this.selectedWorkspace();

    const userId = this.selectedUser()?._id ?? this.userId.trim();

    if (!workspace) {
      this.memberError.set('Please select a workspace.');

      return;
    }

    if (!userId) {
      this.memberError.set('Please search and select a user.');

      return;
    }

    this.memberActionLoading.set(true);

    this.memberError.set('');

    this.membershipService
      .addMember(workspace._id, userId, this.memberRole())
      .subscribe({
        next: () => {
          this.memberActionLoading.set(false);

          this.showAddMember.set(false);

          this.resetAddMemberForm();

          this.loadMembers(workspace._id);
        },

        error: (error) => {
          this.memberActionLoading.set(false);

          this.memberError.set(
            error?.error?.message ?? 'Unable to add member.',
          );
        },
      });
  }

  // =========================================
  // Remove Member
  // =========================================

  removeMember(member: Membership): void {
    if (!this.isCurrentUserWorkspaceOwner()) {
      return;
    }

    const workspace = this.selectedWorkspace();

    if (!workspace) {
      return;
    }

    if (this.isWorkspaceOwner(member)) {
      this.memberError.set('Workspace owner cannot be removed.');

      return;
    }

    if (
      !confirm(
        `Remove ${member.user?.firstName ?? 'this member'} from the workspace?`,
      )
    ) {
      return;
    }

    this.memberActionLoading.set(true);

    this.memberError.set('');

    this.membershipService.removeMember(member._id).subscribe({
      next: () => {
        this.memberActionLoading.set(false);

        this.loadMembers(workspace._id);
      },

      error: (error) => {
        this.memberActionLoading.set(false);

        this.memberError.set(
          error?.error?.message ?? 'Unable to remove member.',
        );
      },
    });
  }

  // =========================================
  // Update Member Role
  // =========================================

  updateMemberRole(member: Membership, role: MembershipRole): void {
    if (!this.isCurrentUserWorkspaceOwner()) {
      return;
    }

    const workspace = this.selectedWorkspace();

    if (!workspace) {
      return;
    }

    if (this.isWorkspaceOwner(member)) {
      return;
    }

    if (member.role === role) {
      return;
    }

    this.memberActionLoading.set(true);

    this.memberError.set('');

    this.membershipService
      .updateMembership(member._id, {
        role,
      })
      .subscribe({
        next: (response) => {
          this.members.update((items) =>
            items.map((item) =>
              item._id === member._id
                ? {
                    ...item,
                    role: response?.data?.role ?? role,
                  }
                : item,
            ),
          );

          this.memberActionLoading.set(false);
        },

        error: (error) => {
          this.memberActionLoading.set(false);

          this.memberError.set(
            error?.error?.message ?? 'Unable to update member role.',
          );

          this.loadMembers(workspace._id);
        },
      });
  }

  // =========================================
  // Create Workspace
  // =========================================

  openCreateWorkspace(): void {
    this.createWorkspaceError.set('');

    this.createWorkspaceSuccess.set('');

    this.createWorkspaceForm.reset({
      name: '',
      description: '',
    });

    this.showCreateWorkspace.set(true);
  }

  closeCreateWorkspace(): void {
    if (this.createWorkspaceLoading()) {
      return;
    }

    this.showCreateWorkspace.set(false);

    this.createWorkspaceError.set('');
  }

  createWorkspace(): void {
    this.createWorkspaceError.set('');

    this.createWorkspaceSuccess.set('');

    if (this.createWorkspaceForm.invalid) {
      this.createWorkspaceForm.markAllAsTouched();

      return;
    }

    this.createWorkspaceLoading.set(true);

    const { name, description } = this.createWorkspaceForm.getRawValue();

    this.workspaceService
      .createWorkspace({
        name: name.trim(),
        description: description.trim() || undefined,
      })
      .subscribe({
        next: (response) => {
          this.createWorkspaceLoading.set(false);

          this.showCreateWorkspace.set(false);

          this.createWorkspaceForm.reset({
            name: '',
            description: '',
          });

          this.createWorkspaceSuccess.set('Workspace created successfully.');

          this.loadWorkspaces();
        },

        error: (error) => {
          this.createWorkspaceLoading.set(false);

          this.createWorkspaceError.set(
            error?.error?.message ?? 'Unable to create workspace.',
          );
        },
      });
  }

  // =========================================
  // Edit Workspace
  // =========================================

  openEditWorkspace(): void {
    if (!this.isCurrentUserWorkspaceOwner()) {
      return;
    }

    const workspace = this.selectedWorkspace();

    if (!workspace) {
      return;
    }

    this.editWorkspaceError.set('');

    this.editWorkspaceForm.reset({
      name: workspace.name,
      description: workspace.description ?? '',
    });

    this.showEditWorkspace.set(true);
  }

  closeEditWorkspace(): void {
    if (this.editWorkspaceLoading()) {
      return;
    }

    this.showEditWorkspace.set(false);

    this.editWorkspaceError.set('');
  }

  updateWorkspace(): void {
    this.editWorkspaceError.set('');

    if (this.editWorkspaceForm.invalid) {
      this.editWorkspaceForm.markAllAsTouched();

      return;
    }

    const workspace = this.selectedWorkspace();

    if (!workspace) {
      return;
    }

    if (!this.isCurrentUserWorkspaceOwner()) {
      this.editWorkspaceError.set(
        'Only the workspace owner can update this workspace.',
      );

      return;
    }

    this.editWorkspaceLoading.set(true);

    const { name, description } = this.editWorkspaceForm.getRawValue();

    this.workspaceService
      .updateWorkspace(workspace._id, {
        name: name.trim(),
        description: description.trim() || undefined,
      })
      .subscribe({
        next: (response) => {
          this.editWorkspaceLoading.set(false);

          this.showEditWorkspace.set(false);

          this.selectedWorkspace.set(response.data);

          this.loadWorkspaces();
        },

        error: (error) => {
          this.editWorkspaceLoading.set(false);

          this.editWorkspaceError.set(
            error?.error?.message ?? 'Unable to update workspace.',
          );
        },
      });
  }
  deleteWorkspace(): void {
    const workspace = this.selectedWorkspace();

    if (!workspace) {
      return;
    }

    if (!this.isCurrentUserWorkspaceOwner()) {
      return;
    }

    const confirmed = confirm(
      `Delete "${workspace.name}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    this.workspaceService.deleteWorkspace(workspace._id).subscribe({
      next: () => {
        this.selectedWorkspace.set(null);
        this.members.set([]);
        this.loadWorkspaces();
      },

      error: (error) => {
        this.errorMessage.set(
          error?.error?.message ?? 'Unable to delete workspace.',
        );
      },
    });
  }
  // =========================================
  // WORKSPACE REALTIME
  // =========================================

  private initializeWorkspaceRealtime(): void {
    this.socketService.onWorkspaceUpdated((updatedWorkspace) => {
      if (!updatedWorkspace?._id) {
        return;
      }

      this.workspaces.update((items) =>
        items.map((workspace) =>
          workspace._id === updatedWorkspace._id ? updatedWorkspace : workspace,
        ),
      );

      const selected = this.selectedWorkspace();

      if (selected?._id === updatedWorkspace._id) {
        this.selectedWorkspace.set(updatedWorkspace);
      }
    });
  }
  // =========================================
  // PRESENCE REALTIME
  // =========================================

  private initializePresenceRealtime(): void {
    // =========================================
    // CLEAN EXISTING LISTENERS
    // =========================================

    this.socketService.removePresenceListeners();
    // =========================================
    // Initial Online Users
    // =========================================

    this.socketService.onOnlineUsers((userIds) => {
      this.onlineUsers.set(new Set(userIds));
    });

    // =========================================
    // User Online
    // =========================================

    this.socketService.onUserOnline((data) => {
      if (!data?.userId) {
        return;
      }

      this.onlineUsers.update((users) => {
        const updated = new Set(users);

        updated.add(data.userId);

        return updated;
      });
    });

    // =========================================
    // User Offline
    // =========================================

    this.socketService.onUserOffline((data) => {
      if (!data?.userId) {
        return;
      }

      this.onlineUsers.update((users) => {
        const updated = new Set(users);

        updated.delete(data.userId);

        return updated;
      });
    });
  }
  // =========================================
  // CHECK USER ONLINE
  // =========================================

  isUserOnline(userId: string | undefined): boolean {
    if (!userId) {
      return false;
    }

    const online = this.onlineUsers().has(userId);

    return online;
  }
  // =========================================
  // DESTROY
  // =========================================

  ngOnDestroy(): void {
    this.socketService.removeWorkspaceListeners();

    this.socketService.removePresenceListeners();
  }
}
