export interface CreateProjectDto {
  workspace: string;

  name: string;

  description?: string;

  startDate?: Date;

  endDate?: Date;
}
