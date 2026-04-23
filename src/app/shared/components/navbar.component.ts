import { Component, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  user = computed(() => this.auth.user());
  isGestionnaire = computed(() => this.auth.isGestionnaire());

  constructor(private auth: AuthService, private router: Router) {}

  logout(): void {
    this.auth.logout();
  }
}