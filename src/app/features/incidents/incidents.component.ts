import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IncidentService, Incident } from '../../core/services/incident.service';
import { MaterielService, Materiel } from '../../core/services/materiel.service';
import { EmpruntService, Emprunt } from '../../core/services/emprunt.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

interface TypeIncident {
  id: number;
  libelle: string;
}

@Component({
  selector: 'app-incidents',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './incidents.component.html',
})
export class IncidentsComponent implements OnInit {
  private incidentService = inject(IncidentService);
  private materielService = inject(MaterielService);
  private empruntService = inject(EmpruntService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private notificationService = inject(NotificationService);

  incidents = signal<Incident[]>([]);
  materiels = signal<Materiel[]>([]);
  mesEmprunts = signal<Emprunt[]>([]);

  empruntsFiltres = signal<Emprunt[]>([]);

  loading = signal(true);
  submitting = signal(false);
  showForm = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  isGestionnaire = this.auth.isGestionnaire;

  // Types d'incidents statiques (correspondent aux données en base)
  typesIncident: TypeIncident[] = [
    { id: 1, libelle: 'Panne' },
    { id: 2, libelle: 'Retour anticipé' },
    { id: 3, libelle: 'Prolongation' },
    { id: 4, libelle: 'Dysfonctionnement' },
  ];

  form: FormGroup = this.fb.group({
    idMateriel: ['', Validators.required],
    idTypeIncident: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(10)]],
    idEmprunt: [null],
  });

  ngOnInit(): void {
    this.loadIncidents();

    this.form.get('idMateriel')?.valueChanges.subscribe((idMateriel) => {
      const id = Number(idMateriel);
      this.form.patchValue({ idEmprunt: null });
      if (!id) {
        this.empruntsFiltres.set([]);
      } else {
        this.empruntsFiltres.set(this.mesEmprunts().filter((e) => e.idMateriel === id));
      }
    });

    // Charger tous les matériels (pas seulement disponibles)
    this.materielService.getAll().subscribe({
      next: (data) => this.materiels.set(data),
    });

    // Charger les emprunts en cours de l'utilisateur (pour lier l'incident)
    if (!this.isGestionnaire()) {
      this.empruntService.getMesEmprunts().subscribe({
        next: (data) =>
          this.mesEmprunts.set(
            data.filter((e) => e.statut === 'EN_COURS' || e.statut === 'EN_RETARD'),
          ),
      });
    }
  }

  loadIncidents(): void {
    // Gestionnaire voit tous les incidents, emprunteur ne signale que
    this.incidentService.getAll().subscribe({
      next: (data) => {
        const sorted = [...data].sort(
          (a, b) => new Date(b.dateSignalement).getTime() - new Date(a.dateSignalement).getTime(),
        );
        this.incidents.set(sorted);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.errorMessage.set('');

    const payload = {
      ...this.form.value,
      idEmprunt: this.form.value.idEmprunt || null,
    };

    this.incidentService.signalerIncident(payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.showForm.set(false);
        this.successMessage.set('Incident signalé avec succès !');
        this.form.reset();
        this.loadIncidents();
        this.notificationService.triggerRefresh();
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: () => {
        this.submitting.set(false);
        this.errorMessage.set('Erreur lors du signalement. Réessayez.');
        setTimeout(() => this.errorMessage.set(''), 3000);
      },
    });
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'Panne':
        return '⚡';
      case 'Retour anticipé':
        return '↩️';
      case 'Prolongation':
        return '⏳';
      case 'Dysfonctionnement':
        return '🔧';
      default:
        return '⚠️';
    }
  }

  getTypeLabel(type: string): string {
    return type; // déjà lisible, pas besoin de transformer
  }
}
