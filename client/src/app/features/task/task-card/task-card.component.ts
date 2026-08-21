import { Component, input, output } from '@angular/core';

import { CommonModule } from '@angular/common';

import { Task } from '../../../core/models/task.model';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.scss',
})
export class TaskCardComponent {
  readonly task = input.required<Task>();

  readonly selected = output<Task>();

  openTask(): void {
    this.selected.emit(this.task());
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      TODO: 'To Do',

      IN_PROGRESS: 'In Progress',

      REVIEW: 'Review',

      DONE: 'Done',
    };

    return labels[status] ?? status;
  }

  getAssigneeName(): string {
    const assigned = this.task().assignedTo;

    if (!assigned || typeof assigned === 'string') {
      return '';
    }

    return `${assigned.firstName} ${assigned.lastName}`;
  }

  getAssigneeInitials(): string {
    const assigned = this.task().assignedTo;

    if (!assigned || typeof assigned === 'string') {
      return '';
    }

    return (
      assigned.firstName.charAt(0) + assigned.lastName.charAt(0)
    ).toUpperCase();
  }

  formatDueDate(): string {
    const dueDate = this.task().dueDate;

    if (!dueDate) {
      return '';
    }

    const date = new Date(dueDate);

    const today = new Date();

    if (date.toDateString() === today.toDateString()) {
      return 'Due Today';
    }

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
  }
}
