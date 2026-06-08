import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UtilisateurService, UtilisateurDTO } from '../../core/services/utilisateur.service';

// Rôles disponibles — ids à adapter si différents en base
const ROLES = [
  { idRole: 1, nom: 'GESTIONNAIRE' },
  { idRole: 2, nom: 'EMPRUNTEUR' },
];

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
  formIdRole = signal(1);
  formErreur = signal('');
  formEnCours = signal(false);

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
      next: (data) => { this.utilisateurs.set([...data].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))); this.loading.set(false); },
      error: () => { this.erreur.set('Impossible de charger les utilisateurs.'); this.loading.set(false); },
    });
  }

  ouvrirCreation(): void {
    this.formNom.set(''); this.formPrenom.set('');
    this.formEmail.set(''); this.formMotDePasse.set('');
    this.formIdRole.set(1); this.formErreur.set('');
    this.modalCreation.set(true);
  }

  creerUtilisateur(): void {
    if (!this.formNom() || !this.formPrenom() || !this.formEmail() || !this.formMotDePasse()) {
      this.formErreur.set('Tous les champs sont obligatoires.');
      return;
    }
    this.formEnCours.set(true);
    this.utilisateurService.create({
      nom: this.formNom(), prenom: this.formPrenom(),
      email: this.formEmail(), motDePasse: this.formMotDePasse(),
      idRole: this.formIdRole(),
    }).subscribe({
      next: (u) => {
        this.utilisateurs.update(list => [...list, u]);
        this.modalCreation.set(false);
        this.formEnCours.set(false);
      },
      error: () => {
        this.formErreur.set('Erreur lors de la création. Email déjà utilisé ?');
        this.formEnCours.set(false);
      },
    });
  }

  ouvrirRole(u: UtilisateurDTO): void {
    this.modalRole.set(u);
    const role = ROLES.find(r => r.nom === u.role);
    this.nouveauRole.set(role?.idRole ?? 1);
  }

  changerRole(): void {
    const u = this.modalRole();
    if (!u) return;
    this.roleEnCours.set(true);
    this.utilisateurService.updateRole(u.idUtilisateur, this.nouveauRole()).subscribe({
      next: (updated) => {
        this.utilisateurs.update(list => list.map(x => x.idUtilisateur === updated.idUtilisateur ? updated : x));
        this.modalRole.set(null);
        this.roleEnCours.set(false);
      },
      error: () => this.roleEnCours.set(false),
    });
  }

  ouvrirSuppression(u: UtilisateurDTO): void {
    this.modalSuppression.set(u);
  }

  confirmerSuppression(): void {
    const u = this.modalSuppression();
    if (!u) return;
    this.suppressionEnCours.set(true);
    this.utilisateurService.delete(u.idUtilisateur).subscribe({
      next: () => {
        this.utilisateurs.update(list => list.filter(x => x.idUtilisateur !== u.idUtilisateur));
        this.modalSuppression.set(null);
        this.suppressionEnCours.set(false);
      },
      error: () => this.suppressionEnCours.set(false),
    });
  }

  getRoleBadge(role: string): { bg: string; color: string } {
    return role === 'GESTIONNAIRE'
      ? { bg: '#EEF2FF', color: '#4338CA' }
      : { bg: '#F0FDF4', color: '#166534' };
  }

  getInitiales(nom: string, prenom: string): string {
    return ((prenom?.[0] ?? '') + (nom?.[0] ?? '')).toUpperCase();
  }
}