export interface UpdateProjectDto {
  name?: string;

  description?: string;

  status?: "ACTIVE" | "ARCHIVED";

  startDate?: Date;

  endDate?: Date;
}
