export type TaskAiPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TaskAiAnalysis {
  summary: string;

  suggestedPriority: TaskAiPriority;

  suggestedSubtasks: string[];

  risks: string[];

  nextAction: string;
}

export interface TaskAiAnalysisResponse {
  success: boolean;

  message: string;

  data: TaskAiAnalysis;
}
