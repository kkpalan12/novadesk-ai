import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class CommandActionService {
  private readonly router = inject(Router);

  openDashboard(): void {
    void this.router.navigate(['/dashboard']);
  }

  openProjects(): void {
    void this.router.navigate(['/projects']);
  }

  openTasks(): void {
    void this.router.navigate(['/tasks']);
  }
  openWorskspaces(): void {
    void this.router.navigate(['/workspaces']);
  }

  createTask(): void {
    console.log('Open create task modal');

    // Later connect Task Dialog
  }

  askAI(): void {
    console.log('Open AI Assistant');

    // Later connect AI module
  }

  generateReport(): void {
    console.log('Generate AI Report');
  }
}
