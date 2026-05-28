import { Injectable, signal, computed } from '@angular/core';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { ApiClientService } from '../api/api-client.service';

export interface User {
  email: string;
  role: 'GESTIONNAIRE' | 'STAGIAIRE' | 'INTERVENANT';
  nom: string;
  prenom: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiClientService);
  private readonly router = inject(Router);

  // Signal = état réactif moderne (Angular 16+)
  private _user = signal<User | null>(this.loadUser());
  private _token = signal<string | null>(localStorage.getItem('access_token'));

  // Computed = valeurs dérivées automatiquement recalculées
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._token() !== null);
  readonly isGestionnaire = computed(() => this._user()?.role === 'GESTIONNAIRE');
  readonly isSTAGIAIRE = computed(() => this._user()?.role === 'STAGIAIRE');
  readonly isIntervenant = computed(() => this._user()?.role === 'INTERVENANT');

  login(email: string, password: string) {
    return this.api.post<AuthResponse>('/auth/login', { email, password }).pipe(
      tap((response) => {
        localStorage.setItem('access_token', response.token);
        this._token.set(response.token);
        const user = this.decodeUser(response.token);
        localStorage.setItem('user', JSON.stringify(user));
        this._user.set(user);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this._token();
  }

  private loadUser(): User | null {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return {
      email: parsed.email ?? '',
      role: parsed.role ?? 'STAGIAIRE',
      nom: parsed.nom ?? '',
      prenom: parsed.prenom ?? '',
    };
  }

  private decodeUser(token: string): User {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        email: payload.sub,
        role: payload.role as 'GESTIONNAIRE' | 'STAGIAIRE' | 'INTERVENANT',
        nom: payload.nom ?? '',
        prenom: payload.prenom ?? '',
      };
    } catch {
      return { email: '', role: 'STAGIAIRE', nom: '', prenom: '' };
    }
  }
}
