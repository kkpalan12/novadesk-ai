import { Component, OnDestroy, OnInit, inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';

import {
  LucideAngularModule,
  Sparkles,
  Send,
  X,
  BarChart3,
  FolderKanban,
  FileText,
  Code2,
  Bot,
  User,
  LucideIconData,
} from 'lucide-angular';

import { marked } from 'marked';

import {
  AiAssistantService,
  AiProjectMetrics,
  AiFocusTask,
} from '../../../core/services/ai-assistant.service';

import { WorkspaceContextService } from '../../../core/services/workspace-context.service';

import { Subject } from 'rxjs';

import { distinctUntilChanged, takeUntil } from 'rxjs/operators';

interface AiAction {
  title: string;
  description: string;
  icon: LucideIconData;
  prompt: string;
}

interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

@Component({
  selector: 'app-ai-assistant',

  standalone: true,

  imports: [CommonModule, FormsModule, LucideAngularModule],

  templateUrl: './ai-assistant.component.html',

  styleUrl: './ai-assistant.component.scss',
})
export class AiAssistantComponent implements OnInit, OnDestroy {
  // =====================================================
  // SERVICES
  // =====================================================

  private readonly aiService = inject(AiAssistantService);

  private readonly workspaceContext = inject(WorkspaceContextService);

  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly destroy$ = new Subject<void>();

  // =====================================================
  // CONTEXT
  // =====================================================

  projectId = '';

  workspaceId = '';

  // =====================================================
  // AI STATE
  // =====================================================

  metrics: AiProjectMetrics | null = null;

  focusTasks: AiFocusTask[] = [];

  open = false;

  message = '';

  showWelcome = true;

  isThinking = false;

  messages: AiMessage[] = [];

  // =====================================================
  // ICONS
  // =====================================================

  readonly icons = {
    ai: Sparkles,
    send: Send,
    close: X,
    workspace: BarChart3,
    project: FolderKanban,
    docs: FileText,
    developer: Code2,
    bot: Bot,
    user: User,
  };

  // =====================================================
  // QUICK ACTIONS
  // =====================================================

  readonly actions: AiAction[] = [
    {
      title: 'Summarize Workspace',

      description: 'Get workspace overview and insights',

      icon: this.icons.workspace,

      prompt: 'Summarize my workspace',
    },

    {
      title: 'Project Health',

      description: 'Understand the current project health',

      icon: this.icons.project,

      prompt: 'Give me a health report for this project',
    },

    {
      title: 'Focus Next',

      description: 'Find the most important work to focus on',

      icon: this.icons.project,

      prompt:
        'Focus Next: What should I work on first in this project? Give me the top 3 actual tasks from this project and explain why each should be prioritized.',
    },

    {
      title: 'Project Brief',

      description: 'Get a concise AI summary of this project',

      icon: this.icons.project,

      prompt: 'Give me a project brief for this project',
    },

    {
      title: 'Generate Documentation',

      description: 'Create technical project documents',

      icon: this.icons.docs,

      prompt: 'Generate project documentation',
    },

    {
      title: 'Developer Assistant',

      description: 'Architecture and coding help',

      icon: this.icons.developer,

      prompt: 'Help me with a development question',
    },
  ];

  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(
        distinctUntilChanged(
          (previous, current) =>
            previous.get('project') === current.get('project') &&
            previous.get('workspace') === current.get('workspace'),
        ),

        takeUntil(this.destroy$),
      )
      .subscribe((params) => {
        this.projectId = params.get('project') ?? '';

        this.workspaceId = params.get('workspace') ?? '';

        console.log('NovaDesk AI context:', {
          projectId: this.projectId,
          workspaceId: this.workspaceId,
        });
      });
  }

  // =====================================================
  // PANEL
  // =====================================================

  openPanel(): void {
    this.open = true;
  }

  closePanel(): void {
    this.open = false;
  }

  // =====================================================
  // QUICK ACTION
  // =====================================================

  selectAction(action: AiAction): void {
    this.showWelcome = false;

    this.message = action.prompt;

    this.sendMessage();
  }

  // =====================================================
  // SEND MESSAGE
  // =====================================================

  sendMessage(): void {
    const text = this.message.trim();

    if (!text || this.isThinking) {
      return;
    }

    // ===================================================
    // WORKSPACE
    // ===================================================

    const activeWorkspaceId = this.workspaceContext.activeWorkspace()?._id;

    const finalWorkspaceId = this.workspaceId || activeWorkspaceId || '';

    if (!finalWorkspaceId) {
      this.messages.push({
        role: 'assistant',

        content: 'Please select a workspace before using NovaDesk AI.',

        time: this.getCurrentTime(),
      });

      return;
    }

    // ===================================================
    // PROJECT REQUEST DETECTION
    // ===================================================

    const lowerText = text.toLowerCase();

    const isProjectRequest =
      lowerText.includes('this project') ||
      lowerText.includes('focus next') ||
      lowerText.includes('project health') ||
      lowerText.includes('project brief');

    if (isProjectRequest && !this.projectId) {
      this.messages.push({
        role: 'assistant',

        content:
          'I could not determine the current project. Please open a project first.',

        time: this.getCurrentTime(),
      });

      return;
    }

    // ===================================================
    // USER MESSAGE
    // ===================================================

    this.showWelcome = false;

    this.messages.push({
      role: 'user',

      content: text,

      time: this.getCurrentTime(),
    });

    this.message = '';

    this.isThinking = true;

    // ===================================================
    // REQUEST
    // ===================================================

    const request: {
      message: string;
      workspaceId: string;
      projectId?: string;
    } = {
      message: text,

      workspaceId: finalWorkspaceId,
    };

    if (this.projectId) {
      request.projectId = this.projectId;
    }

    console.log('NovaDesk AI REQUEST:', request);

    // ===================================================
    // API
    // ===================================================

    this.aiService
      .chat(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const formattedMessage = this.formatAiResponse(response.data.message);

          // ---------------------------------------------
          // AI MESSAGE
          // ---------------------------------------------

          this.messages.push({
            role: 'assistant',

            content: formattedMessage,

            time: this.getCurrentTime(),
          });

          // ---------------------------------------------
          // METRICS
          // ---------------------------------------------

          this.metrics = response.data.metrics ?? null;

          // ---------------------------------------------
          // FOCUS TASKS
          // ---------------------------------------------

          this.focusTasks = response.data.focusTasks ?? [];

          console.log('NovaDesk AI metrics:', this.metrics);

          console.log('NovaDesk AI focus tasks:', this.focusTasks);

          this.isThinking = false;
        },

        error: (error) => {
          console.error('NovaDesk AI error:', error);

          this.messages.push({
            role: 'assistant',

            content:
              'I’m unable to process your request right now. Please try again.',

            time: this.getCurrentTime(),
          });

          this.metrics = null;

          this.focusTasks = [];

          this.isThinking = false;
        },
      });
  }

  // =====================================================
  // OPEN FOCUS TASK
  // =====================================================
  openFocusTask(taskId: string): void {
    if (!taskId) {
      return;
    }

    void this.router
      .navigate(['/tasks', taskId], {
        queryParams: {
          project: this.projectId,
          workspace: this.workspaceId,
        },
      })
      .then((navigated) => {
        if (navigated) {
          this.closePanel();
        }
      })
      .catch((error) => {
        console.error('Failed to open AI focus task:', error);
      });
  }

  // =====================================================
  // MARKDOWN
  // =====================================================

  private formatAiResponse(content: string): string {
    return marked.parse(content) as string;
  }

  async renderMarkdown(content: string): Promise<string> {
    return await marked.parse(content);
  }

  // =====================================================
  // TIME
  // =====================================================

  private getCurrentTime(): string {
    return new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // =====================================================
  // CLEAR
  // =====================================================

  clearConversation(): void {
    this.messages = [];

    this.showWelcome = true;

    this.message = '';

    this.isThinking = false;

    this.metrics = null;

    this.focusTasks = [];
  }

  // =====================================================
  // DESTROY
  // =====================================================

  ngOnDestroy(): void {
    this.destroy$.next();

    this.destroy$.complete();
  }
}
