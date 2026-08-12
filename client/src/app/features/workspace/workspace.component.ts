import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { WorkspaceService } from '../../core/services/workspace.service';
import { Workspace } from '../../core/models/workspace.model';

import { MembershipService } from '../../core/services/membership.service';
import { Membership, MembershipRole } from '../../core/models/membership.model';

import { SearchService } from '../../core/services/search.service';
import { SearchUser } from '../../core/models/search.model';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workspace.component.html',
  styleUrl: './workspace.component.scss',
})
export class WorkspaceComponent implements OnInit {
  private readonly workspaceService = inject(WorkspaceService);

  private readonly membershipService = inject(MembershipService);

  private readonly searchService = inject(SearchService);

  private readonly authService = inject(AuthService);

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
  // Add Member Search
  // =========================================

  userId = '';

  readonly memberRole = signal<MembershipRole>('MEMBER');

  readonly userSearchQuery = signal('');

  readonly userSearchResults = signal<SearchUser[]>([]);

  readonly userSearchLoading = signal(false);

  readonly selectedUser = signal<SearchUser | null>(null);

  // =========================================
  // Lifecycle
  // =========================================

  ngOnInit(): void {
    this.loadWorkspaces();
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

        this.loading.set(false);

        if (workspaces.length > 0) {
          this.selectWorkspace(workspaces[0]);
        }
      },

      error: (error) => {
        console.error('Load workspaces error:', error);

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
        console.error('Load members error:', error);

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
        console.error('User search error:', error);

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
          console.error('Add member error:', error);

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
        console.error('Remove member error:', error);

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
          console.error('Update member role error:', error);

          this.memberActionLoading.set(false);

          this.memberError.set(
            error?.error?.message ?? 'Unable to update member role.',
          );

          this.loadMembers(workspace._id);
        },
      });
  }

  // =========================================
  // Workspace Owner Check
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
}
