export type MembershipRole = 'ADMIN' | 'MEMBER';

export type MembershipStatus = 'ACTIVE' | 'REMOVED';

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

export interface MembershipsResponse {
  success: boolean;

  message: string;

  data: Membership[];
}
