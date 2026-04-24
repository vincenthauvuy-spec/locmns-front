import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { EmpruntService, Emprunt } from '../../core/services/emprunt.service';
import { MaterielService, Materiel } from '../../core/services/materiel.service';
import { AuthService } from '../../core/services/auth.service';

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

  emprunts = signal<Emprunt[]>([]);
  materiels = signal<Materiel[]>([]);
  loading = signal(true);
  showForm = signal(false);
  submitting = signal(false);
  annulationEnCours = signal<number | null>(null);
  successMessage = signal('');
  errorMessage = signal('');
  filtreActif = signal<StatutFilter>('TOUS');

  filtres: { key: StatutFilter; label: string }[] = [
    { key: 'TOUS', label: 'Tous' },
    { key: 'EN_ATTENTE', label: 'En attente' },
    { key: 'EN_COURS', label: 'En cours' },
    { key: 'TERMINE', label: 'Terminés' },
  ];
  isGestionnaire = this.auth.isGestionnaire;

  form: FormGroup = this.fb.group({
    idMateriel: ['', Validators.required],
    dateDebut: ['', Validators.required],
    dateFinPrevue: ['', Validators.required],
  });

  ngOnInit(): void {
    this.loadEmprunts();
    this.materielService.getDisponibles().subscribe({
      next: (data) => this.materiels.set(data),
    });

    this.route.queryParams.subscribe((params) => {
      if (params['materielId']) {
        this.form.patchValue({ idMateriel: params['materielId'] });
        this.showForm.set(true);
      }
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
    if (filtre === 'EN_ATTENTE') return this.emprunts().filter((e) => e.statut === 'EN_ATTENTE');
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
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.errorMessage.set('');

    this.empruntService.demandeEmprunt(this.form.value).subscribe({
      next: () => {
        this.submitting.set(false);
        this.showForm.set(false);
        this.successMessage.set('Demande envoyée avec succès !');
        this.form.reset();
        this.loadEmprunts();
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: () => {
        this.submitting.set(false);
        this.errorMessage.set('Erreur lors de la demande. Réessayez.');
      },
    });
  }

  annuler(id: number): void {
    this.annulationEnCours.set(id);
    this.empruntService.annuler(id).subscribe({
      next: () => {
        this.annulationEnCours.set(null);
        this.successMessage.set('Demande annulée.');
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

  peutAnnuler(emprunt: Emprunt): boolean {
    return emprunt.statut === 'EN_ATTENTE';
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
        return 'Refusé';
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

  compterParStatut(statut: StatutFilter): number {
    if (statut === 'TOUS') return this.emprunts().length;
    if (statut === 'EN_ATTENTE')
      return this.emprunts().filter((e) => e.statut === 'EN_ATTENTE').length;
    if (statut === 'EN_COURS')
      return this.emprunts().filter((e) => e.statut === 'EN_COURS' || e.statut === 'EN_RETARD')
        .length;
    if (statut === 'TERMINE')
      return this.emprunts().filter((e) => e.statut === 'RENDU' || e.statut === 'REFUSE').length;
    return 0;
  }
}
