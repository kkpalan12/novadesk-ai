import { ActivityAction } from "../common/constants/activity.constants";

export interface ActivityEntity {
  project: string;

  user: string;

  action: ActivityAction;

  entityType: string;

  entityId: string;

  description: string;

  metadata?: Record<string, unknown>;
}
