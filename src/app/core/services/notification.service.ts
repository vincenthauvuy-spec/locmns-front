import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '../api/api-client.service';

export interface NotificationDTO {
  message: string;
  type: 'INFO' | 'ALERTE' | 'SUCCES';
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly api = inject(ApiClientService);

  getAll() {
    return this.api.get<NotificationDTO[]>('/notifications');
  }
}