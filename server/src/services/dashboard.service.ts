import { DashboardRepository } from "../repositories/dashboard.repository";

export class DashboardService {
  private readonly repository = new DashboardRepository();

  async getDashboard(userId: string) {
    return this.repository.getDashboard(userId);
  }
}
