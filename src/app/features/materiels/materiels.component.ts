import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MaterielService, Materiel } from '../../core/services/materiel.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-materiels',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './materiels.component.html',
})
export class MaterielsComponent implements OnInit {
  private materielService = inject(MaterielService);
  private auth = inject(AuthService);

  materiels = signal<Materiel[]>([]);
  loading = signal(true);
  isGestionnaire = this.auth.isGestionnaire;

  ngOnInit(): void {
    const req = this.isGestionnaire()
      ? this.materielService.getAll()
      : this.materielService.getDisponibles();

    req.subscribe({
      next: (data) => {
        this.materiels.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getStatutClass(etat: string): string {
    switch (etat) {
      case 'Disponible':
        return 'badge-success';
      case 'En cours':
        return 'badge-info';
      case 'En réparation':
        return 'badge-warning';
      case 'Hors service':
        return 'badge-error';
      default:
        return 'badge-ghost';
    }
  }
}
