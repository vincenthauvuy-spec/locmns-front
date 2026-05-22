import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EmpruntService, Emprunt } from '../../../core/services/emprunt.service';

/**
 * Filtres de gestion des emprunts côté validation.
 */
type FiltreHistorique = 'TOUS' | 'EN_ATTENTE' | 'EN_COURS' | 'EN_RETARD' | 'TERMINE';

@Component({
  selector: 'app-validation-emprunts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './validation-emprunts.component.html',
})
export class ValidationEmpruntsComponent implements OnInit {
  private empruntService = inject(EmpruntService);

  emprunts = signal<Emprunt[]>([]);
  loading = signal(true);

  traitement = signal<number | null>(null);

  filtreActif = signal<FiltreHistorique>('TOUS');
  recherche = signal('');

  /**
   * Liste des filtres affichés dans l'UI.
   */
  filtres: { key: FiltreHistorique; label: string }[] = [
    { key: 'TOUS', label: 'Tous' },

    // Nouveau filtre EN_ATTENTE
    { key: 'EN_ATTENTE', label: 'En attente' },

    { key: 'EN_COURS', label: 'En cours' },
    { key: 'EN_RETARD', label: 'En retard' },
    { key: 'TERMINE', label: 'Terminés' },
  ];

  ngOnInit(): void {
    this.loadEmprunts();
  }

  /**
   * Charge tous les emprunts.
   */
  loadEmprunts(): void {
    this.empruntService.getAll().subscribe({
      next: (data) => {
        this.emprunts.set(
          [...data].sort((a, b) => {
            const aTime = a.dateDebut ? new Date(a.dateDebut).getTime() : 0;
            const bTime = b.dateDebut ? new Date(b.dateDebut).getTime() : 0;
            return bTime - aTime;
          }),
        );

        this.loading.set(false);
      },

      error: () => {
        this.loading.set(false);
      },
    });
  }

  /**
   * Liste filtrée des emprunts.
   */
  get empruntsFiltres(): Emprunt[] {
    let list = this.emprunts();

    const f = this.filtreActif();
    const q = this.recherche().toLowerCase().trim();

    if (f === 'EN_ATTENTE') {
      list = list.filter((e) => e.statut === 'EN_ATTENTE');
    }

    if (f === 'EN_COURS') {
      list = list.filter((e) => e.statut === 'EN_COURS');
    }

    if (f === 'EN_RETARD') {
      list = list.filter((e) => e.statut === 'EN_RETARD');
    }

    if (f === 'TERMINE') {
      list = list.filter((e) => e.statut === 'RENDU' || e.statut === 'REFUSE');
    }

    if (q) {
      list = list.filter(
        (e) => e.emprunteur.toLowerCase().includes(q) || e.materiel.toLowerCase().includes(q),
      );
    }

    return list;
  }

  setFiltre(f: FiltreHistorique): void {
    this.filtreActif.set(f);
  }

  /**
   * Compteur par filtre.
   */
  compter(f: FiltreHistorique): number {
    const list = this.emprunts();

    if (f === 'TOUS') {
      return list.length;
    }

    if (f === 'EN_ATTENTE') {
      return list.filter((e) => e.statut === 'EN_ATTENTE').length;
    }

    if (f === 'EN_COURS') {
      return list.filter((e) => e.statut === 'EN_COURS').length;
    }

    if (f === 'EN_RETARD') {
      return list.filter((e) => e.statut === 'EN_RETARD').length;
    }

    if (f === 'TERMINE') {
      return list.filter((e) => e.statut === 'RENDU' || e.statut === 'REFUSE').length;
    }

    return 0;
  }

  /**
   * Force le retour d'un matériel (gestionnaire).
   */
  forceRetour(id: number): void {
    this.traitement.set(id);

    this.empruntService.retour(id).subscribe({
      next: () => {
        this.traitement.set(null);
        this.loadEmprunts();
      },

      error: () => this.traitement.set(null),
    });
  }

  /**
   * Valide une demande d'emprunt.
   */
  valider(id: number): void {
    this.traitement.set(id);

    this.empruntService.valider(id, true).subscribe({
      next: () => {
        this.traitement.set(null);
        this.loadEmprunts();
      },

      error: () => this.traitement.set(null),
    });
  }

  /**
   * Refuse une demande d'emprunt.
   */
  refuser(id: number): void {
    this.traitement.set(id);

    this.empruntService.valider(id, false).subscribe({
      next: () => {
        this.traitement.set(null);
        this.loadEmprunts();
      },

      error: () => this.traitement.set(null),
    });
  }

  getStatutLabel(statut: string): string {
    const labels: Record<string, string> = {
      EN_ATTENTE: 'En attente',
      EN_COURS: 'En cours',
      EN_RETARD: 'En retard',
      RENDU: 'Rendu',
      REFUSE: 'Annulé',
    };

    return labels[statut] ?? statut;
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'EN_ATTENTE':
        return 'badge-warning';

      case 'EN_COURS':
        return 'badge-success';

      case 'EN_RETARD':
        return 'badge-error';

      case 'RENDU':
        return 'badge-ghost';

      case 'REFUSE':
        return 'badge-ghost';

      default:
        return 'badge-ghost';
    }
  }

  getStatutDot(statut: string): string {
    const dots: Record<string, string> = {
      EN_ATTENTE: '#F59E0B',
      EN_COURS: '#22C55E',
      EN_RETARD: '#EF4444',
      RENDU: '#9CA3AF',
      REFUSE: '#D1D5DB',
    };

    return dots[statut] ?? '#9CA3AF';
  }
}
