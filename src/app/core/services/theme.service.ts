import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _dark = signal<boolean>(localStorage.getItem('theme') === 'dark');

  readonly isDark = this._dark.asReadonly();

  constructor() {
    this.apply();
  }

  toggle(): void {
    this._dark.set(!this._dark());
    localStorage.setItem('theme', this._dark() ? 'dark' : 'light');
    this.apply();
  }

  private apply(): void {
    document.documentElement.setAttribute('data-theme', this._dark() ? 'dark' : 'light');
  }
}
