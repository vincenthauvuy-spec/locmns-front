import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../core/services/theme.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent implements OnInit {
  private auth = inject(AuthService);
  private notificationService = inject(NotificationService);
  private theme = inject(ThemeService);
  private router = inject(Router);

  user = computed(() => this.auth.user());
  isGestionnaire = computed(() => this.auth.isGestionnaire());
  isDark = this.theme.isDark;

  menuOpen = false;
  nbNotifications = signal(0);

  ngOnInit(): void {
    this.notificationService.getAll().subscribe({
      next: (data) => this.nbNotifications.set(data.length),
      error: () => {},
    });
  }

  toggleTheme() { this.theme.toggle(); }
  toggleMenu() { this.menuOpen = !this.menuOpen; }
  logout(): void { this.auth.logout(); }
}