import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';


interface Notification {
  message: string;
  type: 'INFO' | 'ALERTE' | 'SUCCES';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
private auth = inject(AuthService);
private http = inject(HttpClient);

user = this.auth.user;
isGestionnaire = this.auth.isGestionnaire;
notifications = signal<Notification[]>([]);
loading = signal(true);

constructor() {}

  ngOnInit(): void {
    this.http.get<Notification[]>('http://localhost:8080/api/notifications')
      .subscribe({
        next: (data) => {
          this.notifications.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  getNotifClass(type: string): string {
    switch(type) {
      case 'ALERTE': return 'border-l-4 border-yellow-400 bg-yellow-50 text-yellow-800';
      case 'SUCCES': return 'border-l-4 border-green-400 bg-green-50 text-green-800';
      default: return 'border-l-4 border-blue-400 bg-blue-50 text-blue-800';
    }
  }

  getNotifIcon(type: string): string {
    switch(type) {
      case 'ALERTE': return '⚠';
      case 'SUCCES': return '✓';
      default: return 'ℹ';
    }
  }
}