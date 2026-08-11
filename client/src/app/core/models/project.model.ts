export interface Project {
  _id: string;

  workspace:
    | string
    | {
        _id: string;
        name: string;
      };

  owner:
    | string
    | {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
      };

  name: string;
  description?: string;

  status: 'ACTIVE' | 'ARCHIVED';

  isDeleted: boolean;

  createdAt?: string;
  updatedAt?: string;
}

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

export interface CreateProjectRequest {
  workspace: string;
  name: string;
  description?: string;
}
