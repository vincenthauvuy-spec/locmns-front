import { Injectable, inject, signal } from '@angular/core';
import { ApiClientService } from '../api/api-client.service';

export interface NotificationDTO {
  message: string;
  type: 'INFO' | 'ALERTE' | 'SUCCES';
}

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private readonly api = inject(ApiClientService);

  /**
   * Signal de refresh global.
   * Chaque action métier déclenche une mise à jour.
   */
  refresh = signal(0);

  /**
   * Récupère les notifications.
   */
  getAll() {
    return this.api.get<NotificationDTO[]>('/notifications');
  }

  /**
   * Déclenche un refresh global.
   */
  triggerRefresh(): void {
    this.refresh.update((v) => v + 1);
  }
}
