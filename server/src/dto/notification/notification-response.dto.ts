export interface NotificationResponseDto {
  id: string;

  title: string;

  message: string;

  type: string;

  isRead: boolean;

  createdAt: Date;
}
