import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

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

export interface DemandeEmprunt {
  idMateriel: number;
  dateDebut: string;
  dateFinPrevue: string;
}

@Injectable({ providedIn: 'root' })
export class EmpruntService {
  private http = inject(HttpClient);
  private readonly API = 'http://localhost:8080/api';

  getAll() {
    return this.http.get<Emprunt[]>(`${this.API}/emprunts`);
  }

  getMesEmprunts() {
    return this.http.get<Emprunt[]>(`${this.API}/emprunts/mes-emprunts`);
  }

  getEnAttente() {
    return this.http.get<Emprunt[]>(`${this.API}/emprunts/en-attente`);
  }

  demandeEmprunt(demande: DemandeEmprunt) {
    return this.http.post<Emprunt>(`${this.API}/emprunts/demande`, demande);
  }

  valider(id: number, decision: boolean) {
    return this.http.put<Emprunt>(`${this.API}/emprunts/${id}/valider?decision=${decision}`, {});
  }
  annuler(id: number) {
    return this.http.patch<Emprunt>(`${this.API}/emprunts/${id}/annuler`, {});
  }
}
