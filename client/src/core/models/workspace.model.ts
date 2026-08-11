export interface WorkspaceOwner {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface WorkspaceMember {
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

  members?: WorkspaceMember[];

  logo?: string;

  isDeleted?: boolean;

  createdAt?: string;
  updatedAt?: string;

  __v?: number;
}

export interface WorkspaceListData {
  workspaces: Workspace[];

  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WorkspaceListResponse {
  success: boolean;
  message: string;
  data: WorkspaceListData;
}

export interface WorkspaceResponse {
  success: boolean;
  message: string;
  data: Workspace;
}
