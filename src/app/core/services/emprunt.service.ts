import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { ApiClientService } from '../api/api-client.service';
import { normalizeEmpruntStatus } from './emprunt-status-normalizer';

export interface Emprunt {
  idEmprunt: number;
  idMateriel: number;      // ← ajout
  dateDebut: string;
  dateFinPrevue: string;
  dateFinReelle?: string;
  statut: 'EN_ATTENTE' | 'REFUSE' | 'EN_COURS' | 'EN_RETARD' | 'RENDU';
  materiel: string;
  emprunteur: string;
}

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

  private normalizeEmprunt(emprunt: ApiEmprunt): Emprunt {
    return {
      ...emprunt,
      statut: normalizeEmpruntStatus(emprunt.statut) as Emprunt['statut'],
    };
  }

  getAll() {
    return this.api
      .get<ApiEmprunt[]>('/emprunts')
      .pipe(map((items) => items.map((item) => this.normalizeEmprunt(item))));
  }

  getMesEmprunts() {
    return this.api
      .get<ApiEmprunt[]>('/emprunts/mes-emprunts')
      .pipe(map((items) => items.map((item) => this.normalizeEmprunt(item))));
  }

  getEnAttente() {
    return this.api
      .get<ApiEmprunt[]>('/emprunts/en-attente')
      .pipe(map((items) => items.map((item) => this.normalizeEmprunt(item))));
  }

  demandeEmprunt(demande: DemandeEmprunt) {
    return this.api
      .post<ApiEmprunt>('/emprunts/demande', demande)
      .pipe(map((item) => this.normalizeEmprunt(item)));
  }

  valider(id: number, decision: boolean) {
    return this.api
      .put<ApiEmprunt>(this.api.withQuery(`/emprunts/${id}/valider`, { decision }), {})
      .pipe(map((item) => this.normalizeEmprunt(item)));
  }
  annuler(id: number) {
    return this.api
      .patch<ApiEmprunt>(`/emprunts/${id}/annuler`, {})
      .pipe(map((item) => this.normalizeEmprunt(item)));
  }
}
