import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaterielService, Materiel } from '../../core/services/materiel.service';
import { AuthService } from '../../core/services/auth.service';
import { forkJoin } from 'rxjs';

type MaterielStats = {
  categorie: string;
  total: number;
  disponible: number;
  enCours: number;
  enRetard: number;
};

type GroupeMateriel = {
  categorie: string;
  items: Materiel[];
};

@Component({
  selector: 'app-materiels',
  standalone: true,
  imports: [CommonModule, FormsModule ],
  templateUrl: './materiels.component.html',
})
export class MaterielsComponent implements OnInit {
  private materielService = inject(MaterielService);
  private auth = inject(AuthService);
  private router = inject(Router);

  materiels = signal<Materiel[]>([]);
  materielsGroupes = signal<GroupeMateriel[]>([]);
  materielsStats = signal<MaterielStats[]>([]);
  loading = signal(true);

  isGestionnaire = this.auth.isGestionnaire;

  modalOuverte = signal(false);
  categorieSelectionnee = signal<GroupeMateriel | null>(null);
  dateDebut = signal('');
  dateFin = signal('');
  rechercheEnCours = signal(false);
  resultatsDisponibles = signal<Materiel[]>([]);
  rechercheEffectuee = signal(false);
  erreurDates = signal('');

  get aujourdhui(): string {
    return new Date().toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.materielService.getAll().subscribe({
      next: (data: Materiel[]) => {
        this.materiels.set(data);

        const map = new Map<string, Materiel[]>();

        data.forEach((m) => {
          if (!map.has(m.categorie)) {
            map.set(m.categorie, []);
          }

          map.get(m.categorie)!.push(m);
        });

        this.materielsGroupes.set(
          Array.from(map.entries()).map(([categorie, items]) => ({
            categorie,
            items,
          })),
        );

        this.materielsStats.set(this.groupStats(data));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goToCreateMateriel(): void {
    this.router.navigate(['/materiels/gestion'], {
      queryParams: { mode: 'create' },
    });
  }

  ouvrirModal(groupe: GroupeMateriel): void {
    if (this.isGestionnaire()) return;

    this.categorieSelectionnee.set(groupe);
    this.dateDebut.set('');
    this.dateFin.set('');
    this.resultatsDisponibles.set([]);
    this.rechercheEffectuee.set(false);
    this.erreurDates.set('');
    this.modalOuverte.set(true);
  }

  fermerModal(): void {
    this.modalOuverte.set(false);
  }

  chercherDisponibles(): void {
    const debut = this.dateDebut();
    const fin = this.dateFin();
    const groupe = this.categorieSelectionnee();

    if (!debut || !fin) {
      this.erreurDates.set('Veuillez sélectionner une date de début et de fin.');
      return;
    }

    if (fin <= debut) {
      this.erreurDates.set('La date de fin doit être après la date de début.');
      return;
    }

    this.erreurDates.set('');

    if (!groupe) return;

    this.rechercheEnCours.set(true);
    this.rechercheEffectuee.set(false);

    const checks = groupe.items.map((m) =>
      this.materielService.isDisponible(m.idMateriel, debut, fin),
    );

    forkJoin(checks).subscribe({
      next: (results) => {
        const dispos = groupe.items.filter((_, i) => results[i]);

        this.resultatsDisponibles.set(dispos);
        this.rechercheEffectuee.set(true);
        this.rechercheEnCours.set(false);
      },
      error: () => {
        this.rechercheEnCours.set(false);
        this.erreurDates.set('Erreur lors de la vérification. Réessayez.');
      },
    });
  }

  faireDemande(materiel: Materiel): void {
    this.fermerModal();

    this.router.navigate(['/emprunts'], {
      queryParams: {
        materielId: materiel.idMateriel,
        dateDebut: this.dateDebut(),
        dateFin: this.dateFin(),
      },
    });
  }

  private normalizeCategorie(cat: string): string {
    return cat
      ?.toLowerCase()
      ?.normalize('NFD')
      ?.replace(/[\u0300-\u036f]/g, '')
      ?.replace(/\s+/g, ' ')
      ?.trim();
  }

  private groupStats(data: Materiel[]): MaterielStats[] {
    const map = new Map<string, MaterielStats>();

    data.forEach((item) => {
      const key = this.normalizeCategorie(item.categorie);

      if (!map.has(key)) {
        map.set(key, {
          categorie: key,
          total: 0,
          disponible: 0,
          enCours: 0,
          enRetard: 0,
        });
      }

      const group = map.get(key)!;

      group.total++;

      if (item.statut === 'DISPONIBLE') group.disponible++;
      else if (item.statut === 'EN_COURS') group.enCours++;
      else if (item.statut === 'EN_RETARD') group.enRetard++;
    });

    return Array.from(map.values());
  }

  getCategorieIcon(categorie: string): string {
    const cat = this.normalizeCategorie(categorie);

    const icons: Record<string, string> = {
      ecran: 'M3 4h18v12H3V4zm0 12h18M8 20h8M10 16v4M14 16v4',
      videoprojecteur: 'M3 6h18v10H3V6zm14 5a2 2 0 11-4 0 2 2 0 014 0z',
      'casque vr':
        'M2 7h20v10H2V7zm6 5a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0z',
      pc: 'M4 3h16v12H4V3zM2 17h20M8 21h8',
    };

    return icons[cat] ?? 'M12 4a8 8 0 100 16A8 8 0 0012 4z';
  }
}
