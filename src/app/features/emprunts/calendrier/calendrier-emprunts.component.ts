import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmpruntService, Emprunt } from '../../../core/services/emprunt.service';
import { MaterielService, Materiel } from '../../../core/services/materiel.service';
import { AuthService } from '../../../core/services/auth.service';

type Vue = 'semaine' | 'mois';

@Component({
  selector: 'app-calendrier-emprunts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendrier-emprunts.component.html',
})
export class CalendrierEmpruntsComponent implements OnInit {
  private empruntService = inject(EmpruntService);
  private materielService = inject(MaterielService);
  private auth = inject(AuthService);

  isGestionnaire = this.auth.isGestionnaire;

  emprunts = signal<Emprunt[]>([]);
  materiels = signal<Materiel[]>([]);
  loading = signal(true);

  // Navigation
  vue = signal<Vue>('semaine');
  offsetSemaine = signal(0);

  // Filtres
  categoriesDisponibles = computed(() => [...new Set(this.emprunts().map((e) => e.materiel))]);
  filtreCategorie = signal<string>('TOUS');
  filtreMateriel = signal<string>('TOUS');

  // Détail sélectionné
  empruntSelectionne = signal<Emprunt | null>(null);

  // Date du jour (référence fixe)
  readonly today = new Date();

  ngOnInit(): void {
    const req = this.isGestionnaire()
      ? this.empruntService.getAll()
      : this.empruntService.getMesEmprunts();

    req.subscribe({
      next: (data) => {
        this.emprunts.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.materielService.getAll().subscribe({
      next: (data) => this.materiels.set(data),
    });
  }

  // ─── Navigation ────────────────────────────────────────────────

  prevSemaine(): void {
    this.offsetSemaine.update((n) => n - 1);
  }
  nextSemaine(): void {
    this.offsetSemaine.update((n) => n + 1);
  }
  resetSemaine(): void {
    this.offsetSemaine.set(0);
  }

  getDebutSemaine(): Date {
    const d = new Date(this.today);
    d.setDate(d.getDate() + this.offsetSemaine() * 7);
    const jour = d.getDay();
    const diff = jour === 0 ? -6 : 1 - jour;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  getJoursSemaine(): Date[] {
    const debut = this.getDebutSemaine();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(debut);
      d.setDate(d.getDate() + i);
      return d;
    });
  }

  getTitreSemaine(): string {
    const jours = this.getJoursSemaine();
    const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
    return `${jours[0].toLocaleDateString('fr-FR', opts)} – ${jours[6].toLocaleDateString('fr-FR', opts)}`;
  }

  isToday(d: Date): boolean {
    return d.toDateString() === this.today.toDateString();
  }

  // ─── Filtrage ──────────────────────────────────────────────────

  get categoriesUniques(): string[] {
    return [...new Set(this.materiels().map((m) => m.categorie))].sort();
  }

  get materielsParCategorie(): Materiel[] {
    if (this.filtreCategorie() === 'TOUS') return this.materiels();
    return this.materiels().filter((m) => m.categorie === this.filtreCategorie());
  }

  get materielsFiltres(): string[] {
    const empruntsMat = [...new Set(this.empruntsFiltres.map((e) => e.materiel))];
    if (this.filtreCategorie() === 'TOUS') return empruntsMat;
    const matCat = this.materielsParCategorie.map((m) => m.nom);
    return empruntsMat.filter((nom) => matCat.includes(nom));
  }

  get empruntsFiltres(): Emprunt[] {
    let list = this.emprunts();
    if (this.filtreMateriel() !== 'TOUS') {
      list = list.filter((e) => e.materiel === this.filtreMateriel());
    } else if (this.filtreCategorie() !== 'TOUS') {
      const matCat = this.materielsParCategorie.map((m) => m.nom);
      list = list.filter((e) => matCat.includes(e.materiel));
    }
    return list;
  }

  onCategorieChange(): void {
    this.filtreMateriel.set('TOUS');
  }

  // ─── Logique calendrier ────────────────────────────────────────

  getEmpruntsJour(materielNom: string, jour: Date): Emprunt[] {
    return this.empruntsFiltres.filter((e) => {
      if (e.materiel !== materielNom) return false;
      const debut = this.parseDate(e.dateDebut);
      const fin = e.dateFinReelle
        ? this.parseDate(e.dateFinReelle)
        : this.parseDate(e.dateFinPrevue);
      return jour >= debut && jour <= fin;
    });
  }

  private parseDate(s: string | null | undefined): Date {
    if (!s) return new Date(0);
    const [y, m, d] = s.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  // ─── Stats ─────────────────────────────────────────────────────

  get stats() {
    const list = this.empruntsFiltres;
    return {
      total: list.length,
      enCours: list.filter((e) => e.statut === 'EN_COURS').length,
      enRetard: list.filter((e) => e.statut === 'EN_RETARD').length,
      aVenir: list.filter((e) => {
        const debut = this.parseDate(e.dateDebut);
        return debut > this.today && e.statut !== 'REFUSE';
      }).length,
    };
  }

  // ─── Détail ────────────────────────────────────────────────────

  selectionner(e: Emprunt): void {
    this.empruntSelectionne.set(this.empruntSelectionne()?.idEmprunt === e.idEmprunt ? null : e);
  }

  // ─── Styles ────────────────────────────────────────────────────

  getStatutClasses(statut: string): string {
    switch (statut) {
      case 'EN_COURS':
        return 'bg-green-50 text-green-700 border-l-2 border-green-500';
      case 'EN_RETARD':
        return 'bg-red-50 text-red-700 border-l-2 border-red-500';
      case 'RENDU':
        return 'bg-gray-100 text-gray-500 border-l-2 border-gray-300 opacity-60';
      case 'REFUSE':
        return 'bg-gray-100 text-gray-400 border-l-2 border-gray-200 opacity-50';
      default:
        return 'bg-gray-50 text-gray-500 border-l-2 border-gray-300';
    }
  }

  getStatutLabel(statut: string): string {
    const labels: Record<string, string> = {
      EN_COURS: 'En cours',
      EN_RETARD: 'En retard',
      RENDU: 'Rendu',
      REFUSE: 'Annulé',
      EN_ATTENTE: 'En attente',
    };
    return labels[statut] ?? statut;
  }

  getStatutDot(statut: string): string {
    const dots: Record<string, string> = {
      EN_COURS: '#22C55E',
      EN_RETARD: '#EF4444',
      RENDU: '#9CA3AF',
      REFUSE: '#D1D5DB',
      EN_ATTENTE: '#F59E0B',
    };
    return dots[statut] ?? '#9CA3AF';
  }

  // Tous les emprunts actifs sur un jour donné (vue mobile — toutes matériels)
  getEmpruntsJour_tous(jour: Date): Emprunt[] {
    return this.empruntsFiltres.filter((e) => {
      if (!e.dateDebut) return false;
      const debut = this.parseDate(e.dateDebut);
      const fin = e.dateFinReelle
        ? this.parseDate(e.dateFinReelle)
        : this.parseDate(e.dateFinPrevue);
      return jour >= debut && jour <= fin;
    });
  }

  // Au moins un emprunt sur la semaine visible (pour message vide mobile)
  getEmpruntsJour_tous_semaine(): Emprunt[] {
    return this.getJoursSemaine().flatMap((j) => this.getEmpruntsJour_tous(j));
  }

  jourNoms = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
}
