import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UtilisateurService, UtilisateurDTO } from '../../core/services/utilisateur.service';

const ROLES = [
  { idRole: 1, nom: 'GESTIONNAIRE' },
  { idRole: 2, nom: 'STAGIAIRE' },
  { idRole: 3, nom: 'INTERVENANT' },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MDP_MIN = 8;

@Component({
  selector: 'app-utilisateurs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './utilisateurs.component.html',
})
export class UtilisateursComponent implements OnInit {
  private utilisateurService = inject(UtilisateurService);

  utilisateurs = signal<UtilisateurDTO[]>([]);
  loading = signal(true);
  erreur = signal('');

  // Modale création
  modalCreation = signal(false);
  formNom = signal('');
  formPrenom = signal('');
  formEmail = signal('');
  formMotDePasse = signal('');
  formIdRole = signal(2);
  formErreur = signal('');
  formEnCours = signal(false);
  afficherMotDePasse = signal(false);

  // Validation inline
  emailTouched = signal(false);
  mdpTouched = signal(false);

  get emailInvalide(): boolean {
    return this.emailTouched() && !EMAIL_REGEX.test(this.formEmail());
  }

  get mdpTropCourt(): boolean {
    return this.mdpTouched() && this.formMotDePasse().length < MDP_MIN;
  }

  // Modale suppression
  modalSuppression = signal<UtilisateurDTO | null>(null);
  suppressionEnCours = signal(false);

  // Modale changement de rôle
  modalRole = signal<UtilisateurDTO | null>(null);
  nouveauRole = signal(1);
  roleEnCours = signal(false);

  roles = ROLES;

  ngOnInit(): void {
    this.chargerUtilisateurs();
  }

  chargerUtilisateurs(): void {
    this.loading.set(true);

    this.utilisateurService.getAll().subscribe({
      next: (data) => {
        this.utilisateurs.set(
          [...data].sort((a, b) =>
            a.nom.localeCompare(b.nom, 'fr')
          )
        );
        this.loading.set(false);
      },
      error: () => {
        this.erreur.set('Impossible de charger les utilisateurs.');
        this.loading.set(false);
      },
    });
  }

  ouvrirCreation(): void {
    this.formNom.set('');
    this.formPrenom.set('');
    this.formEmail.set('');
    this.formMotDePasse.set('');
    this.formIdRole.set(2);
    this.formErreur.set('');
    this.emailTouched.set(false);
    this.mdpTouched.set(false);
    this.afficherMotDePasse.set(false);
    this.modalCreation.set(true);
  }

  creerUtilisateur(): void {
    this.emailTouched.set(true);
    this.mdpTouched.set(true);

    if (!this.formNom().trim() || !this.formPrenom().trim()) {
      this.formErreur.set('Le nom et le prénom sont obligatoires.');
      return;
    }

    if (!EMAIL_REGEX.test(this.formEmail())) {
      this.formErreur.set("L'adresse email n'est pas valide.");
      return;
    }

    if (this.formMotDePasse().length < MDP_MIN) {
      this.formErreur.set(
        `Le mot de passe doit contenir au moins ${MDP_MIN} caractères.`
      );
      return;
    }

    this.formErreur.set('');
    this.formEnCours.set(true);

    this.utilisateurService.create({
      nom: this.formNom().trim(),
      prenom: this.formPrenom().trim(),
      email: this.formEmail().trim(),
      motDePasse: this.formMotDePasse(),
      idRole: this.formIdRole(),
    }).subscribe({
      next: (u) => {
        this.utilisateurs.update(list =>
          [...list, u].sort((a, b) =>
            a.nom.localeCompare(b.nom, 'fr')
          )
        );

        this.modalCreation.set(false);
        this.formEnCours.set(false);
      },
      error: () => {
        this.formErreur.set(
          'Erreur lors de la création. Cet email est peut-être déjà utilisé.'
        );
        this.formEnCours.set(false);
      },
    });
  }

  ouvrirRole(u: UtilisateurDTO): void {
    this.modalRole.set(u);

    const role = ROLES.find(r => r.nom === u.role);
    this.nouveauRole.set(role?.idRole ?? 2);
  }

  changerRole(): void {
    const u = this.modalRole();

    if (!u) {
      return;
    }

    this.roleEnCours.set(true);

    this.utilisateurService
      .updateRole(u.idUtilisateur, this.nouveauRole())
      .subscribe({
        next: (updated) => {
          this.utilisateurs.update(list =>
            list.map(x =>
              x.idUtilisateur === updated.idUtilisateur ? updated : x
            )
          );

          this.modalRole.set(null);
          this.roleEnCours.set(false);
        },
        error: () => {
          this.roleEnCours.set(false);
        },
      });
  }

  ouvrirSuppression(u: UtilisateurDTO): void {
    this.modalSuppression.set(u);
  }

  confirmerSuppression(): void {
    const u = this.modalSuppression();

    if (!u) {
      return;
    }

    this.suppressionEnCours.set(true);

    this.utilisateurService.delete(u.idUtilisateur).subscribe({
      next: () => {
        this.utilisateurs.update(list =>
          list.filter(x => x.idUtilisateur !== u.idUtilisateur)
        );

        this.modalSuppression.set(null);
        this.suppressionEnCours.set(false);
      },
      error: () => {
        this.suppressionEnCours.set(false);
      },
    });
  }

  getRoleBadge(role: string): { bg: string; color: string } {
    switch (role) {
      case 'GESTIONNAIRE':
        return {
          bg: '#EEF2FF',
          color: '#4338CA',
        };

      case 'INTERVENANT':
        return {
          bg: '#FFF7ED',
          color: '#C2410C',
        };

      case 'STAGIAIRE':
        return {
          bg: '#F0FDF4',
          color: '#166534',
        };

      default:
        return {
          bg: '#F3F4F6',
          color: '#374151',
        };
    }
  }

  getInitiales(nom: string, prenom: string): string {
    return ((prenom?.[0] ?? '') + (nom?.[0] ?? '')).toUpperCase();
  }
}