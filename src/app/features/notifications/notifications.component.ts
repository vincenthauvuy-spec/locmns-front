import {
  Component,
  OnInit,
  signal,
  inject,
  effect,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
  NotificationService,
  NotificationDTO,
} from '../../core/services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
})
export class NotificationsComponent implements OnInit {

  private notificationService = inject(NotificationService);
  private router = inject(Router);

  notifications = signal<NotificationDTO[]>([]);
  loading = signal(true);
  erreur = signal('');

  constructor() {

    /**
     * Recharge automatiquement
     * les notifications lorsqu'une action
     * déclenche triggerRefresh().
     */
    effect(() => {

      this.notificationService.refresh();

      this.loadNotifications();
    });
  }

  ngOnInit(): void {
    this.loadNotifications();
  }

  /**
   * Charge les notifications.
   */
  loadNotifications(): void {

    this.loading.set(true);

    this.notificationService.getAll().subscribe({

      next: (data) => {

        this.notifications.set(data);

        this.loading.set(false);
      },

      error: () => {

        this.erreur.set(
          'Impossible de charger les notifications.'
        );

        this.loading.set(false);
      },
    });
  }

  /**
   * Navigation intelligente
   * selon le contenu de la notification.
   */
  ouvrirNotification(notification: NotificationDTO): void {

    const message = notification.message.toLowerCase();

    /**
     * Demande d'emprunt à valider.
     */
    if (
      message.includes('emprunt')
      || message.includes('validation')
      || message.includes('demande')
    ) {

      this.router.navigate(['/emprunts']);

      return;
    }

    /**
     * Incident matériel.
     */
    if (
      message.includes('incident')
    ) {

      this.router.navigate(['/incidents']);

      return;
    }

    /**
     * Fallback dashboard.
     */
    this.router.navigate(['/dashboard']);
  }

  getBadge(type: string): {
    bg: string;
    color: string;
    label: string;
  } {

    switch (type) {

      case 'ALERTE':
        return {
          bg: '#FEE2E2',
          color: '#991B1B',
          label: 'Alerte',
        };

      case 'SUCCES':
        return {
          bg: '#DCFCE7',
          color: '#166534',
          label: 'Succès',
        };

      default:
        return {
          bg: '#DBEAFE',
          color: '#1E40AF',
          label: 'Info',
        };
    }
  }

  getIcone(type: string): string {

    switch (type) {

      case 'ALERTE':
        return '⚠️';

      case 'SUCCES':
        return '✅';

      default:
        return 'ℹ️';
    }
  }
}
