import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { ActivatedRoute } from '@angular/router';

import { EmpruntService, Emprunt } from '../../core/services/emprunt.service';

import { MaterielService, Materiel } from '../../core/services/materiel.service';

import { AuthService } from '../../core/services/auth.service';

import { NotificationService } from '../../core/services/notification.service';

import { debounceTime } from 'rxjs/operators';

type StatutFilter = 'TOUS' | 'EN_ATTENTE' | 'EN_COURS' | 'TERMINE';

@Component({
  selector: 'app-emprunts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './emprunts.component.html',
})
export class EmpruntsComponent implements OnInit {
  private empruntService = inject(EmpruntService);
  private materielService = inject(MaterielService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private notificationService = inject(NotificationService);

  emprunts = signal<Emprunt[]>([]);
  materiels = signal<Materiel[]>([]);

  loading = signal(true);

  showForm = signal(false);
  submitting = signal(false);

  annulationEnCours = signal<number | null>(null);

  prolongationEnCours = signal<number | null>(null);
  retourAnticipeEnCours = signal<number | null>(null);
  showProlongationForm = signal<number | null>(null);
  dateFinDemandee = signal<string>('');

  successMessage = signal('');
  errorMessage = signal('');

  filtreActif = signal<StatutFilter>('TOUS');

  disponibilite = signal<boolean | null>(null);
  checkingDispo = signal(false);

  filtres: { key: StatutFilter; label: string }[] = [
    { key: 'TOUS', label: 'Tous' },
    { key: 'EN_ATTENTE', label: 'En attente' },
    { key: 'EN_COURS', label: 'En cours' },
    { key: 'TERMINE', label: 'Terminés / Annulés' },
  ];

  isGestionnaire = this.auth.isGestionnaire;

  form: FormGroup = this.fb.group({
    idMateriel: ['', Validators.required],
    dateDebut: ['', Validators.required],
    dateFinPrevue: ['', Validators.required],
  });

  ngOnInit(): void {
    this.loadEmprunts();

    this.materielService.getAll().subscribe({
      next: (data) => this.materiels.set(data),
    });

    this.route.queryParams.subscribe((params) => {
      const patch: Record<string, string> = {};

      if (params['materielId']) {
        patch['idMateriel'] = params['materielId'];
      }

      if (params['dateDebut']) {
        patch['dateDebut'] = params['dateDebut'];
      }

      if (params['dateFin']) {
        patch['dateFinPrevue'] = params['dateFin'];
      }

      if (Object.keys(patch).length > 0) {
        this.form.patchValue(patch);
        this.showForm.set(true);
      }
    });

    this.form.valueChanges.pipe(debounceTime(300)).subscribe(() => {
      const { idMateriel, dateDebut, dateFinPrevue } = this.form.value;
      if (idMateriel && dateDebut && dateFinPrevue) {
        this.checkDisponibilite();
      } else {
        this.disponibilite.set(null);
      }
    });
  }

  checkDisponibilite(): void {
    const { idMateriel, dateDebut, dateFinPrevue } = this.form.value;

    this.checkingDispo.set(true);

    this.materielService.isDisponible(Number(idMateriel), dateDebut, dateFinPrevue).subscribe({
      next: (dispo) => {
        this.disponibilite.set(dispo);
        this.checkingDispo.set(false);
      },

      error: () => this.checkingDispo.set(false),
    });
  }

  loadEmprunts(): void {
    const req = this.isGestionnaire()
      ? this.empruntService.getAll()
      : this.empruntService.getMesEmprunts();

    req.subscribe({
      next: (data) => {
        const sorted = [...data].sort(
          (a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime(),
        );
        this.emprunts.set(sorted);
        this.loading.set(false);
      },

      error: () => this.loading.set(false),
    });
  }

  get empruntsFiltres(): Emprunt[] {
    const filtre = this.filtreActif();

    if (filtre === 'TOUS') {
      return this.emprunts();
    }

    if (filtre === 'EN_ATTENTE') {
      return this.emprunts().filter((e) => e.statut === 'EN_ATTENTE');
    }

    if (filtre === 'EN_COURS') {
      return this.emprunts().filter((e) => e.statut === 'EN_COURS' || e.statut === 'EN_RETARD');
    }

    if (filtre === 'TERMINE') {
      return this.emprunts().filter((e) => e.statut === 'RENDU' || e.statut === 'REFUSE');
    }

    return this.emprunts();
  }

  setFiltre(f: StatutFilter): void {
    this.filtreActif.set(f);
  }

  onSubmit(): void {
    if (this.form.invalid || this.disponibilite() === false) {
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    this.empruntService.demandeEmprunt(this.form.value).subscribe({
      next: () => {
        this.submitting.set(false);

        this.showForm.set(false);

        this.successMessage.set("Demande d'emprunt envoyée !");

        this.notificationService.triggerRefresh();

        this.form.reset();

        this.disponibilite.set(null);

        this.loadEmprunts();

        setTimeout(() => this.successMessage.set(''), 3000);
      },

      error: (err) => {
        this.submitting.set(false);

        this.errorMessage.set(err?.error || 'Erreur lors de la demande. Réessayez.');

        setTimeout(() => this.errorMessage.set(''), 5000);
      },
    });
  }

  valider(id: number, decision: boolean): void {
    this.empruntService.valider(id, decision).subscribe({
      next: () => {
        this.successMessage.set(decision ? 'Demande validée.' : 'Demande refusée.');

        this.loadEmprunts();

        this.notificationService.triggerRefresh();

        setTimeout(() => this.successMessage.set(''), 3000);
      },

      error: () => {
        this.errorMessage.set('Erreur lors du traitement.');

        setTimeout(() => this.errorMessage.set(''), 3000);
      },
    });
  }

  annuler(id: number): void {
    this.annulationEnCours.set(id);

    this.empruntService.annuler(id).subscribe({
      next: () => {
        this.annulationEnCours.set(null);

        this.successMessage.set('Emprunt annulé.');

        this.loadEmprunts();

        this.notificationService.triggerRefresh();

        setTimeout(() => this.successMessage.set(''), 3000);
      },

      error: () => {
        this.annulationEnCours.set(null);

        this.errorMessage.set("Impossible d'annuler cet emprunt.");

        setTimeout(() => this.errorMessage.set(''), 3000);
      },
    });
  }

  peutAnnuler(emprunt: Emprunt): boolean {
    return emprunt.statut === 'EN_ATTENTE';
  }

  compterParStatut(statut: StatutFilter): number {
    if (statut === 'TOUS') {
      return this.emprunts().length;
    }

    if (statut === 'EN_ATTENTE') {
      return this.emprunts().filter((e) => e.statut === 'EN_ATTENTE').length;
    }

    if (statut === 'EN_COURS') {
      return this.emprunts().filter((e) => e.statut === 'EN_COURS' || e.statut === 'EN_RETARD')
        .length;
    }

    if (statut === 'TERMINE') {
      return this.emprunts().filter((e) => e.statut === 'RENDU' || e.statut === 'REFUSE').length;
    }

    return 0;
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'EN_ATTENTE':
        return 'badge-warning';

      case 'REFUSE':
        return 'badge-error';

      case 'EN_COURS':
        return 'badge-success';

      case 'EN_RETARD':
        return 'badge-error';

      case 'RENDU':
        return 'badge-ghost';

      default:
        return 'badge-ghost';
    }
  }

  getStatutLabel(statut: string): string {
    switch (statut) {
      case 'EN_ATTENTE':
        return 'En attente';

      case 'REFUSE':
        return 'Annulé';

      case 'EN_COURS':
        return 'En cours';

      case 'EN_RETARD':
        return 'En retard';

      case 'RENDU':
        return 'Rendu';

      default:
        return statut;
    }
  }

  getStatutDot(statut: string): string {
    switch (statut) {
      case 'EN_ATTENTE':
        return '#F59E0B';

      case 'REFUSE':
        return '#EF4444';

      case 'EN_COURS':
        return '#22C55E';

      case 'EN_RETARD':
        return '#EF4444';

      case 'RENDU':
        return '#9CA3AF';

      default:
        return '#9CA3AF';
    }
  }

  demanderProlongation(id: number): void {
    if (!this.dateFinDemandee()) return;

    this.prolongationEnCours.set(id);

    this.empruntService.demanderProlongation(id, this.dateFinDemandee()).subscribe({
      next: () => {
        this.prolongationEnCours.set(null);
        this.showProlongationForm.set(null);
        this.dateFinDemandee.set('');
        this.successMessage.set('Demande de prolongation envoyée.');
        this.loadEmprunts();
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (err) => {
        this.prolongationEnCours.set(null);
        this.errorMessage.set(err?.error || 'Erreur lors de la demande de prolongation.');
        setTimeout(() => this.errorMessage.set(''), 5000);
      },
    });
  }

  validerProlongation(id: number, decision: boolean): void {
    this.empruntService.validerProlongation(id, decision).subscribe({
      next: () => {
        this.successMessage.set(decision ? 'Prolongation acceptée.' : 'Prolongation refusée.');
        this.loadEmprunts();
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: () => {
        this.errorMessage.set('Erreur lors du traitement.');
        setTimeout(() => this.errorMessage.set(''), 3000);
      },
    });
  }

  confirmerRetour(id: number): void {
    this.empruntService.retour(id).subscribe({
      next: () => {
        this.successMessage.set('Retour confirmé.');
        this.loadEmprunts();
        this.notificationService.triggerRefresh();
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: () => {
        this.errorMessage.set('Erreur lors de la confirmation du retour.');
        setTimeout(() => this.errorMessage.set(''), 3000);
      },
    });
  }

  retourAnticipe(id: number): void {
    this.retourAnticipeEnCours.set(id);

    this.empruntService.retourAnticipe(id).subscribe({
      next: () => {
        this.retourAnticipeEnCours.set(null);
        this.successMessage.set('Retour anticipé enregistré.');
        this.loadEmprunts();
        this.notificationService.triggerRefresh();
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: () => {
        this.retourAnticipeEnCours.set(null);
        this.errorMessage.set('Erreur lors du retour anticipé.');
        setTimeout(() => this.errorMessage.set(''), 3000);
      },
    });
  }
}
