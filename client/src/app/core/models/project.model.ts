export interface ProjectWorkspace {
  _id: string;
  name: string;
}

export interface ProjectOwner {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Project {
  _id: string;

  workspace: string | ProjectWorkspace;

  owner: string | ProjectOwner;

  name: string;

  description?: string;

  status: 'ACTIVE' | 'ARCHIVED';

  isDeleted: boolean;

  createdAt?: string;

  updatedAt?: string;
}

// =========================================
// Create
// =========================================

export interface CreateProjectRequest {
  workspace: string;
  name: string;
  description?: string;
}

// =========================================
// Update
// =========================================

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: 'ACTIVE' | 'ARCHIVED';
}

// =========================================
// Responses
// =========================================

export interface ProjectResponse {
  success: boolean;
  message: string;
  data: Project;
}

export interface ProjectsResponse {
  success: boolean;
  message: string;

  data: {
    projects: Project[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
