import { Component, HostListener, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';
import {
  LucideAngularModule,
  Search,
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Sparkles,
  Settings,
  Building2,
} from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { ElementRef, QueryList, ViewChildren } from '@angular/core';

interface CommandItem {
  label: string;

  icon: any;

  action: () => void;
}

@Component({
  selector: 'app-command-palette',

  standalone: true,

  imports: [CommonModule, LucideAngularModule, FormsModule],

  templateUrl: './command-palette.component.html',

  styleUrl: './command-palette.component.scss',
})
export class CommandPaletteComponent {
  @Input() openDashboard!: () => void;

  @Input() openProjects!: () => void;

  @Input() openWorkspace!: () => void;

  @Input() openProfile!: () => void;
  @Input()
  openAi!: () => void;
  @ViewChildren('commandItem')
  commandItems!: QueryList<ElementRef>;
  private readonly router = inject(Router);

  open = false;

  searchText = '';
  selectedIndex = 0;

  readonly icons = {
    search: Search,

    dashboard: LayoutDashboard,

    projects: FolderKanban,

    task: CheckSquare,

    ai: Sparkles,
    workspace: Building2,

    settings: Settings,
  };

  get commands(): CommandItem[] {
    return [
      {
        label: 'Open Dashboard',
        icon: this.icons.dashboard,
        action: () => this.openDashboard(),
      },

      {
        label: 'Open Projects',
        icon: this.icons.projects,
        action: () => this.openProjects(),
      },

      {
        label: 'Open Workspace',
        icon: this.icons.workspace,
        action: () => this.openWorkspace(),
      },

      {
        label: 'Open Profile',
        icon: this.icons.settings,
        action: () => this.openProfile(),
      },

      {
        label: 'Ask AI Assistant',
        icon: this.icons.ai,
        action: () => this.openAi?.(),
      },
    ];
  }

  get filteredCommands(): CommandItem[] {
    const value = this.searchText.toLowerCase();

    if (!value) {
      return this.commands;
    }

    return this.commands.filter((command) =>
      command.label.toLowerCase().includes(value),
    );
  }
  @HostListener('document:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent): void {
    // OPEN

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();

      this.open = true;

      this.selectedIndex = 0;

      return;
    }

    if (!this.open) {
      return;
    }

    // DOWN

    if (event.key === 'ArrowDown') {
      event.preventDefault();

      if (this.filteredCommands.length > 0) {
        this.selectedIndex =
          (this.selectedIndex + 1) % this.filteredCommands.length;
        this.scrollSelected();
      }

      return;
    }

    // UP

    if (event.key === 'ArrowUp') {
      event.preventDefault();

      if (this.filteredCommands.length > 0) {
        this.selectedIndex =
          this.selectedIndex === 0
            ? this.filteredCommands.length - 1
            : this.selectedIndex - 1;
      }

      return;
    }

    // ENTER

    if (event.key === 'Enter') {
      event.preventDefault();

      const command = this.filteredCommands[this.selectedIndex];

      if (command) {
        this.execute(command);
      }

      return;
    }

    // ESC

    if (event.key === 'Escape') {
      this.close();
    }
  }
  execute(command: CommandItem) {
    command.action();

    this.close();

    this.selectedIndex = 0;
  }

  close() {
    this.open = false;

    this.searchText = '';

    this.selectedIndex = 0;
  }
  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.searchText = input.value;

    this.selectedIndex = 0;
  }

  private navigate(url: string) {
    void this.router.navigate([url]);
  }
  scrollSelected(): void {
    const element = this.commandItems?.get(this.selectedIndex)?.nativeElement;

    element?.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    });
  }
}
