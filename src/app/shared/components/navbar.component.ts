import {
  Component,
  computed,
  effect,
  inject,
  signal,
  OnInit,
  OnDestroy,
  HostListener,
  untracked,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../core/services/theme.service';
import { NotificationService } from '../../core/services/notification.service';
import { ApiClientService } from '../../core/api/api-client.service';
import { ChangeDetectorRef } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private notificationService = inject(NotificationService);
  private theme = inject(ThemeService);
  private router = inject(Router);
  private api = inject(ApiClientService);
  private cdr = inject(ChangeDetectorRef);

  user = computed(() => this.auth.user());
  isGestionnaire = computed(() => this.auth.isGestionnaire());
  isDark = this.theme.isDark;

  menuOpen = false;
  exportMenuOpen = false;
  nbNotifications = signal(0);

  private pollSub: Subscription | null = null;

  constructor() {
    effect(
      () => {
        const _ = this.notificationService.refresh();
        untracked(() => this.chargerNotifications());
      },
      { allowSignalWrites: true },
    );
  }

  ngOnInit(): void {
    this.chargerNotifications();
    this.pollSub = interval(30000)
      .pipe(switchMap(() => this.notificationService.getAll()))
      .subscribe({
        next: (data) => this.nbNotifications.set(data.length),
        error: () => {},
      });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  private refreshTimeout: ReturnType<typeof setTimeout> | null = null;

  chargerNotifications(): void {
    if (this.refreshTimeout) clearTimeout(this.refreshTimeout);
    this.refreshTimeout = setTimeout(() => {
      this.notificationService.getAll().subscribe({
        next: (data) => {
          this.nbNotifications.set(data.length);
          this.cdr.detectChanges();
        },
        error: () => {},
      });
    }, 150);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.export-dropdown')) {
      this.exportMenuOpen = false;
    }
  }

  exportXml(type: 'emprunts' | 'materiels' | 'incidents'): void {
    this.exportMenuOpen = false;
    this.menuOpen = false;
    this.api.getBlob(`/export/${type}/xml`).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}.xml`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => {},
    });
  }

  toggleTheme() {
    this.theme.toggle();
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  logout(): void {
    this.auth.logout();
  }
}
