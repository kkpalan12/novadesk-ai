import { DashboardRepository } from "../repositories/dashboard.repository";

export class DashboardService {
  private readonly dashboardRepository = new DashboardRepository();

  async getDashboard() {
    return this.dashboardRepository.getDashboardStats();
  }
}
