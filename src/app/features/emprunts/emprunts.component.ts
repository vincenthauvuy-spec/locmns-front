import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { EmpruntService, Emprunt } from '../../core/services/emprunt.service';
import { MaterielService, Materiel } from '../../core/services/materiel.service';
import { AuthService } from '../../core/services/auth.service';

type StatutFilter = 'TOUS' | 'EN_COURS' | 'TERMINE';

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

  emprunts = signal<Emprunt[]>([]);
  materiels = signal<Materiel[]>([]);
  loading = signal(true);
  showForm = signal(false);
  submitting = signal(false);
  annulationEnCours = signal<number | null>(null);
  successMessage = signal('');
  errorMessage = signal('');
  filtreActif = signal<StatutFilter>('TOUS');
  disponibilite = signal<boolean | null>(null);
  checkingDispo = signal(false);

  // EN_ATTENTE supprimé du flux nominal (validation automatique)
  filtres: { key: StatutFilter; label: string }[] = [
    { key: 'TOUS', label: 'Tous' },
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

    // Correction du bug : récupération des 3 query params
    this.route.queryParams.subscribe((params) => {
      const patch: Record<string, string> = {};
      if (params['materielId'])  patch['idMateriel']   = params['materielId'];
      if (params['dateDebut'])   patch['dateDebut']    = params['dateDebut'];
      if (params['dateFin'])     patch['dateFinPrevue'] = params['dateFin'];

      if (Object.keys(patch).length > 0) {
        this.form.patchValue(patch);
        this.showForm.set(true);
      }
    });

    this.form.valueChanges.subscribe(() => {
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
        this.emprunts.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  get empruntsFiltres(): Emprunt[] {
    const filtre = this.filtreActif();
    if (filtre === 'TOUS') return this.emprunts();
    if (filtre === 'EN_COURS')
      return this.emprunts().filter((e) => e.statut === 'EN_COURS' || e.statut === 'EN_RETARD');
    if (filtre === 'TERMINE')
      return this.emprunts().filter((e) => e.statut === 'RENDU' || e.statut === 'REFUSE');
    return this.emprunts();
  }

  setFiltre(f: StatutFilter): void {
    this.filtreActif.set(f);
  }

  onSubmit(): void {
    if (this.form.invalid || this.disponibilite() === false) return;
    this.submitting.set(true);
    this.errorMessage.set('');

    this.empruntService.demandeEmprunt(this.form.value).subscribe({
      next: () => {
        this.submitting.set(false);
        this.showForm.set(false);
        this.successMessage.set('Emprunt confirmé !');
        this.form.reset();
        this.disponibilite.set(null);
        this.loadEmprunts();
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: (err) => {
        this.submitting.set(false);
        // Le back renvoie le message métier directement (droits, indisponible...)
        this.errorMessage.set(err?.error || 'Erreur lors de la demande. Réessayez.');
        setTimeout(() => this.errorMessage.set(''), 5000);
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
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: () => {
        this.annulationEnCours.set(null);
        this.errorMessage.set("Impossible d'annuler cet emprunt.");
        setTimeout(() => this.errorMessage.set(''), 3000);
      },
    });
  }

  // Avec validation auto, on peut annuler un emprunt EN_COURS ou EN_RETARD
  // tant qu'il n'est pas déjà terminé
  peutAnnuler(emprunt: Emprunt): boolean {
    return emprunt.statut === 'EN_COURS' || emprunt.statut === 'EN_RETARD';
  }

  compterParStatut(statut: StatutFilter): number {
    if (statut === 'TOUS') return this.emprunts().length;
    if (statut === 'EN_COURS')
      return this.emprunts().filter((e) => e.statut === 'EN_COURS' || e.statut === 'EN_RETARD').length;
    if (statut === 'TERMINE')
      return this.emprunts().filter((e) => e.statut === 'RENDU' || e.statut === 'REFUSE').length;
    return 0;
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'REFUSE':    return 'badge-error';
      case 'EN_COURS':  return 'badge-success';
      case 'EN_RETARD': return 'badge-error';
      case 'RENDU':     return 'badge-ghost';
      default:          return 'badge-ghost';
    }
  }

  getStatutLabel(statut: string): string {
    switch (statut) {
      case 'REFUSE':    return 'Annulé';
      case 'EN_COURS':  return 'En cours';
      case 'EN_RETARD': return 'En retard';
      case 'RENDU':     return 'Rendu';
      default:          return statut;
    }
  }

  getStatutDot(statut: string): string {
    switch (statut) {
      case 'REFUSE':    return '#EF4444';
      case 'EN_COURS':  return '#22C55E';
      case 'EN_RETARD': return '#EF4444';
      case 'RENDU':     return '#9CA3AF';
      default:          return '#9CA3AF';
    }
  }
}