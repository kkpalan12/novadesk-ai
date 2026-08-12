import { MembershipRole, MembershipStatus } from './membership.model';

export interface WorkspaceOwner {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Workspace {
  _id: string;
  name: string;
  description?: string;

  owner: WorkspaceOwner;

  members?: WorkspaceOwner[];

  logo?: string;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkspaceListResponse {
  success: boolean;
  message: string;

  data: {
    workspaces: Workspace[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface WorkspaceResponse {
  success: boolean;
  message: string;
  data: Workspace;
}
// membership.model.ts

export interface MembershipUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Membership {
  _id: string;
  workspace: string;
  user: MembershipUser;
  role: MembershipRole;
  status: MembershipStatus;
  joinedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}
