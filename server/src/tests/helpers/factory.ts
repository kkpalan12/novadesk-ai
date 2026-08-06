// src/tests/helpers/factory.ts

import bcrypt from "bcryptjs";

import { User } from "../../models/user.model";
import { Workspace } from "../../models/workspace.model";
import { Project } from "../../models/project.model";
import { Task } from "../../models/task.model";

export class TestFactory {
  static async createUser(overrides = {}) {
    const password = await bcrypt.hash("Password@123", 10);

    return User.create({
      firstName: "John",
      lastName: "Doe",
      email: `john${Date.now()}@example.com`,
      password,
      role: "USER",
      ...overrides,
    });
  }

  static async createWorkspace(owner: any, overrides = {}) {
    return Workspace.create({
      name: "Nova Workspace",
      owner: owner._id,
      ...overrides,
    });
  }

  static async createProject(workspace: any, overrides = {}) {
    return Project.create({
      name: "Nova Project",
      workspace: workspace._id,
      ...overrides,
    });
  }

  static async createTask(project: any, createdBy: any, overrides = {}) {
    return Task.create({
      title: "Sample Task",
      description: "Testing task",
      status: "TODO",
      priority: "MEDIUM",
      project: project._id,
      createdBy: createdBy._id,
      ...overrides,
    });
  }
}
