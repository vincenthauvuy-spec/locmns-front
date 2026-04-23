import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MaterielService, Materiel } from '../../core/services/materiel.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-materiels',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './materiels.component.html'
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
      error: () => this.loading.set(false)
    });
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'DISPONIBLE': return 'badge-success';
      case 'LOUE': return 'badge-warning';
      case 'EN_REPARATION': return 'badge-info';
      case 'HORS_SERVICE': return 'badge-error';
      default: return 'badge-ghost';
    }
  }

  getStatutLabel(statut: string): string {
    switch (statut) {
      case 'DISPONIBLE': return 'Disponible';
      case 'LOUE': return 'En cours';
      case 'EN_REPARATION': return 'En réparation';
      case 'HORS_SERVICE': return 'Hors service';
      default: return statut;
    }
  }
}