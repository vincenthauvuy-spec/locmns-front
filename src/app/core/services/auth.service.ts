import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

export interface User {
  email: string;
  role: 'GESTIONNAIRE' | 'EMPRUNTEUR';
}

export interface AuthResponse {
  access_token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = 'http://localhost:8080/api';

  // Signal = état réactif moderne (Angular 16+)
  private _user = signal<User | null>(this.loadUser());
  private _token = signal<string | null>(localStorage.getItem('access_token'));

  // Computed = valeurs dérivées automatiquement recalculées
  readonly user = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._token() !== null);
  readonly isGestionnaire = computed(() => this._user()?.role === 'GESTIONNAIRE');
  readonly isEmprunteur = computed(() => this._user()?.role === 'EMPRUNTEUR');

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.API}/auth/login`, { email, password }).pipe(
      tap((response) => {
        localStorage.setItem('access_token', response.access_token);
        this._token.set(response.access_token);
        const user = this.decodeUser(response.access_token);
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

  private decodeUser(token: string): User {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        email: payload.sub,
        role: payload.role,
      };
    } catch {
      return { email: '', role: 'EMPRUNTEUR' };
    }
  }

  private loadUser(): User | null {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  }
}
