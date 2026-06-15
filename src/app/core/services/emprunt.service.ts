import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs/operators';

import { ApiClientService } from '../api/api-client.service';
import { normalizeEmpruntStatus } from './emprunt-status-normalizer';

export interface Emprunt {
  idEmprunt: number;

  // Identifiant du matériel associé à l'emprunt
  idMateriel: number;

  dateDebut: string;
  dateFinPrevue: string;
  dateFinReelle?: string;
  dateFinDemandee?: string;
  demandeProlongation?: boolean;
  validationProlongation?: boolean | null;
  compteurProlongations?: number;
  demandeRetourAnticipe?: boolean;

  statut: 'EN_ATTENTE' | 'REFUSE' | 'EN_COURS' | 'EN_RETARD' | 'RENDU';

  materiel: string;
  emprunteur: string;
}

/**
 * Structure brute renvoyée par l'API backend.
 *
 * Le statut peut arriver sous une forme non normalisée,
 * d'où l'utilisation du normalizer.
 */
interface ApiEmprunt extends Omit<Emprunt, 'statut'> {
  statut: string;
}

export interface DemandeEmprunt {
  idMateriel: number;
  dateDebut: string;
  dateFinPrevue: string;
}

@Injectable({ providedIn: 'root' })
export class EmpruntService {
  private readonly api = inject(ApiClientService);

  /**
   * Convertit un emprunt backend
   * vers le format frontend normalisé.
   */
  private normalizeEmprunt(emprunt: ApiEmprunt): Emprunt {
    return {
      ...emprunt,
      statut: normalizeEmpruntStatus(emprunt.statut) as Emprunt['statut'],
    };
  }

  /**
   * Récupère tous les emprunts.
   */
  getAll() {
    return this.api
      .get<ApiEmprunt[]>('/emprunts')
      .pipe(map((items) => items.map((item) => this.normalizeEmprunt(item))));
  }

  /**
   * Récupère les emprunts
   * de l'utilisateur connecté.
   */
  getMesEmprunts() {
    return this.api
      .get<ApiEmprunt[]>('/emprunts/mes-emprunts')
      .pipe(map((items) => items.map((item) => this.normalizeEmprunt(item))));
  }

  /**
   * Récupère les demandes
   * encore en attente.
   */
  getEnAttente() {
    return this.api
      .get<ApiEmprunt[]>('/emprunts/en-attente')
      .pipe(map((items) => items.map((item) => this.normalizeEmprunt(item))));
  }

  /**
   * Création d'une demande d'emprunt.
   */
  demandeEmprunt(demande: DemandeEmprunt) {
    return this.api
      .post<ApiEmprunt>('/emprunts/demande', demande)
      .pipe(map((item) => this.normalizeEmprunt(item)));
  }

  /**
   * Validation ou refus
   * d'une demande d'emprunt.
   */
  valider(id: number, decision: boolean) {
    return this.api
      .put<ApiEmprunt>(this.api.withQuery(`/emprunts/${id}/valider`, { decision }), {})
      .pipe(map((item) => this.normalizeEmprunt(item)));
  }

  /**
   * Annule une demande en attente.
   */
  annuler(id: number) {
    return this.api
      .patch<ApiEmprunt>(`/emprunts/${id}/annuler`, {})
      .pipe(map((item) => this.normalizeEmprunt(item)));
  }

  /**
   * Enregistre le retour d'un matériel.
   *
   * Cette route marque l'emprunt comme rendu
   * en renseignant la date de retour réelle.
   */
  retour(id: number) {
    return this.api
      .patch<ApiEmprunt>(`/emprunts/${id}/retour`, {})
      .pipe(map((item) => this.normalizeEmprunt(item)));
  }

  demanderProlongation(id: number, dateFinDemandee: string) {
    return this.api
      .patch<ApiEmprunt>(
        this.api.withQuery(`/emprunts/${id}/prolongation`, { dateFinDemandee }),
        {},
      )
      .pipe(map((item) => this.normalizeEmprunt(item)));
  }

  validerProlongation(id: number, decision: boolean) {
    return this.api
      .patch<ApiEmprunt>(
        this.api.withQuery(`/emprunts/${id}/prolongation/valider`, { decision }),
        {},
      )
      .pipe(map((item) => this.normalizeEmprunt(item)));
  }

  retourAnticipe(id: number) {
    return this.api
      .patch<ApiEmprunt>(`/emprunts/${id}/retour-anticipe`, {})
      .pipe(map((item) => this.normalizeEmprunt(item)));
  }
}