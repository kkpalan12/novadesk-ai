export interface CreateWorkspaceDto {
  name: string;
  description?: string;
  logo?: string;
  members?: string[];
}
