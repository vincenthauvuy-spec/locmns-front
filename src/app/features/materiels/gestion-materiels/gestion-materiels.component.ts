import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import {
  MaterielService,
  Materiel,
  Categorie,
  Etat,
  Modele,
  Localisation,
  MaterielRequest,
} from '../../../core/services/materiel.service';

@Component({
  selector: 'app-gestion-materiels',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gestion-materiels.component.html',
})
export class GestionMaterielsComponent implements OnInit {
  private materielService = inject(MaterielService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);

  materiels = signal<Materiel[]>([]);
  categories = signal<Categorie[]>([]);
  etats = signal<Etat[]>([]);
  modeles = signal<Modele[]>([]);
  localisations = signal<Localisation[]>([]);

  loading = signal(true);
  submitting = signal(false);
  showForm = signal(false);

  materielEnEdition = signal<Materiel | null>(null);

  successMessage = signal('');
  errorMessage = signal('');

  form: FormGroup = this.fb.group({
    nom: ['', Validators.required],
    numeroSerie: ['', Validators.required],
    idModele: ['', Validators.required],
    idLocalisation: ['', Validators.required],
    idEtat: ['', Validators.required],
    idCategorie: ['', Validators.required],
  });

  ngOnInit(): void {
    this.loadMateriels();

    this.materielService.getCategories().subscribe((d) => this.categories.set(d));
    this.materielService.getEtats().subscribe((d) => this.etats.set(d));
    this.materielService.getModeles().subscribe((d) => this.modeles.set(d));
    this.materielService.getLocalisations().subscribe((d) => this.localisations.set(d));

    this.route.queryParams.subscribe((params) => {
      if (params['mode'] === 'create') {
        this.ouvrirFormulaire();
      }
    });
  }

  loadMateriels(): void {
    this.materielService.getAll().subscribe({
      next: (data) => {
        this.materiels.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  ouvrirFormulaire(materiel?: Materiel): void {
    this.materielEnEdition.set(materiel ?? null);
    this.showForm.set(true);

    if (materiel) {
      this.form.patchValue({
        nom: materiel.nom,
        numeroSerie: materiel.numeroSerie,
        idModele: '',
        idLocalisation: '',
        idEtat: '',
        idCategorie: '',
      });
    } else {
      this.form.reset();
    }
  }

  fermerFormulaire(): void {
    this.showForm.set(false);
    this.materielEnEdition.set(null);
    this.form.reset();
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.submitting.set(true);
    this.errorMessage.set('');

    const payload: MaterielRequest = {
      nom: this.form.value.nom,
      numeroSerie: this.form.value.numeroSerie,
      idModele: Number(this.form.value.idModele),
      idLocalisation: Number(this.form.value.idLocalisation),
      idEtat: Number(this.form.value.idEtat),
      idCategorie: Number(this.form.value.idCategorie),
    };

    const operation = this.materielEnEdition()
      ? this.materielService.update(this.materielEnEdition()!.idMateriel, payload)
      : this.materielService.create(payload);

    operation.subscribe({
      next: () => {
        this.submitting.set(false);

        this.fermerFormulaire();

        this.successMessage.set(
          this.materielEnEdition() ? 'Matériel modifié !' : 'Matériel créé !',
        );

        this.loadMateriels();

        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: () => {
        this.submitting.set(false);

        this.errorMessage.set('Une erreur est survenue.');

        setTimeout(() => this.errorMessage.set(''), 3000);
      },
    });
  }

  supprimer(id: number): void {
    if (!confirm('Supprimer ce matériel ?')) return;

    this.materielService.delete(id).subscribe({
      next: () => {
        this.successMessage.set('Matériel supprimé.');

        this.loadMateriels();

        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: () => {
        this.errorMessage.set('Erreur lors de la suppression.');
      },
    });
  }

  getEtatClass(etat: string): string {
    switch (etat) {
      case 'Disponible':
        return 'bg-blue-100 text-blue-700';

      case 'En cours':
        return 'bg-yellow-100 text-yellow-700';

      case 'En réparation':
        return 'bg-orange-100 text-orange-700';

      case 'Hors service':
        return 'bg-red-100 text-red-700';

      default:
        return 'bg-base-200 text-base-content/70';
    }
  }
}
