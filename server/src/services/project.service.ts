import { ProjectRepository } from "../repositories/project.repository";
import { ProjectMapper } from "../mappers/project.mapper";

import { CreateProjectDto } from "../dto/project/create-project.dto";
import { UpdateProjectDto } from "../dto/project/update-project.dto";

import { NotFoundError } from "../common/errors/NotFoundError";

export class ProjectService {
  private readonly projectRepository = new ProjectRepository();

  async createProject(dto: CreateProjectDto, owner: string) {
    const entity = ProjectMapper.toEntity(dto, owner);

    return this.projectRepository.create(entity);
  }

  async getAllProjects(query: any) {
    return this.projectRepository.findAll({
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 10,
      search: query.search,
      workspace: query.workspace,
      status: query.status,
    });
  }

  async getProjectById(id: string) {
    const project = await this.projectRepository.findById(id);

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    return project;
  }

  async updateProject(id: string, dto: UpdateProjectDto) {
    const project = await this.projectRepository.update(id, dto);

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    return project;
  }

  async deleteProject(id: string) {
    const project = await this.projectRepository.softDelete(id);

    if (!project) {
      throw new NotFoundError("Project not found");
    }

    return project;
  }
}
