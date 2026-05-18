import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, NotificationDTO } from '../../core/services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
})
export class NotificationsComponent implements OnInit {
  private notificationService = inject(NotificationService);

  notifications = signal<NotificationDTO[]>([]);
  loading = signal(true);
  erreur = signal('');

  ngOnInit(): void {
    this.notificationService.getAll().subscribe({
      next: (data) => { this.notifications.set(data); this.loading.set(false); },
      error: () => { this.erreur.set('Impossible de charger les notifications.'); this.loading.set(false); },
    });
  }

  getBadge(type: string): { bg: string; color: string; label: string } {
    switch (type) {
      case 'ALERTE': return { bg: '#FEE2E2', color: '#991B1B', label: 'Alerte' };
      case 'SUCCES': return { bg: '#DCFCE7', color: '#166534', label: 'Succès' };
      default:       return { bg: '#DBEAFE', color: '#1E40AF', label: 'Info' };
    }
  }

  getIcone(type: string): string {
    switch (type) {
      case 'ALERTE': return '⚠️';
      case 'SUCCES': return '✅';
      default:       return 'ℹ️';
    }
  }
}