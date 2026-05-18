import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmpruntService, Emprunt } from '../../../core/services/emprunt.service';

type FiltreHistorique = 'TOUS' | 'EN_COURS' | 'EN_RETARD' | 'TERMINE';

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

  filtres: { key: FiltreHistorique; label: string }[] = [
    { key: 'TOUS', label: 'Tous' },
    { key: 'EN_COURS', label: 'En cours' },
    { key: 'EN_RETARD', label: 'En retard' },
    { key: 'TERMINE', label: 'Terminés' },
  ];

  ngOnInit(): void {
    this.loadEmprunts();
  }

  loadEmprunts(): void {
    this.empruntService.getAll().subscribe({
      next: (data) => {
        // Trier : les plus récents en premier
        this.emprunts.set([...data].sort((a, b) => b.dateDebut.localeCompare(a.dateDebut)));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  get empruntsFiltres(): Emprunt[] {
    let list = this.emprunts();
    const f = this.filtreActif();
    const q = this.recherche().toLowerCase().trim();

    if (f === 'EN_COURS') list = list.filter((e) => e.statut === 'EN_COURS');
    if (f === 'EN_RETARD') list = list.filter((e) => e.statut === 'EN_RETARD');
    if (f === 'TERMINE') list = list.filter((e) => e.statut === 'RENDU' || e.statut === 'REFUSE');

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

  compter(f: FiltreHistorique): number {
    const list = this.emprunts();
    if (f === 'TOUS') return list.length;
    if (f === 'EN_COURS') return list.filter((e) => e.statut === 'EN_COURS').length;
    if (f === 'EN_RETARD') return list.filter((e) => e.statut === 'EN_RETARD').length;
    if (f === 'TERMINE')
      return list.filter((e) => e.statut === 'RENDU' || e.statut === 'REFUSE').length;
    return 0;
  }

  // Forcer le retour d'un matériel (cas exceptionnel gestionnaire)
  forceRetour(id: number): void {
    this.traitement.set(id);
    this.empruntService.annuler(id).subscribe({
      next: () => {
        this.traitement.set(null);
        this.loadEmprunts();
      },
      error: () => this.traitement.set(null),
    });
  }

  getStatutLabel(statut: string): string {
    const labels: Record<string, string> = {
      EN_COURS: 'En cours',
      EN_RETARD: 'En retard',
      RENDU: 'Rendu',
      REFUSE: 'Annulé',
    };
    return labels[statut] ?? statut;
  }

  getStatutClass(statut: string): string {
    switch (statut) {
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
      EN_COURS: '#22C55E',
      EN_RETARD: '#EF4444',
      RENDU: '#9CA3AF',
      REFUSE: '#D1D5DB',
    };
    return dots[statut] ?? '#9CA3AF';
  }
}
