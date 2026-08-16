import { Injectable, signal } from '@angular/core';

export type ConfirmDialogVariant = 'danger' | 'warning';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
}

@Injectable({
  providedIn: 'root',
})
export class ConfirmDialogService {
  readonly visible = signal(false);

  readonly title = signal('');
  readonly message = signal('');
  readonly confirmText = signal('Confirm');
  readonly cancelText = signal('Cancel');
  readonly variant = signal<ConfirmDialogVariant>('danger');

  private resolver: ((confirmed: boolean) => void) | null = null;

  confirm(options: ConfirmDialogOptions): Promise<boolean> {
    if (this.resolver) {
      this.resolver(false);
    }

    this.title.set(options.title);
    this.message.set(options.message);
    this.confirmText.set(options.confirmText ?? 'Confirm');
    this.cancelText.set(options.cancelText ?? 'Cancel');
    this.variant.set(options.variant ?? 'danger');

    this.visible.set(true);

    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
    });
  }

  confirmAction(): void {
    this.close(true);
  }

  cancel(): void {
    this.close(false);
  }

  private close(result: boolean): void {
    const resolver = this.resolver;

    this.resolver = null;
    this.visible.set(false);

    resolver?.(result);
  }
}
