import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Materiel {
  idMateriel: number;
  nom: string;
  description: string;
  estLouable: boolean;
  categorie: { nom: string };
  statut: 'DISPONIBLE' | 'LOUE' | 'EN_REPARATION' | 'HORS_SERVICE';
}

@Injectable({ providedIn: 'root' })
export class MaterielService {
  private http = inject(HttpClient);
  private readonly API = 'http://localhost:8080/api';

  getAll() {
    return this.http.get<Materiel[]>(`${this.API}/materiels`);
  }

  getDisponibles() {
    return this.http.get<Materiel[]>(`${this.API}/materiels/disponibles`);
  }

  getById(id: number) {
    return this.http.get<Materiel>(`${this.API}/materiels/${id}`);
  }

  create(materiel: Partial<Materiel>) {
    return this.http.post<Materiel>(`${this.API}/materiels`, materiel);
  }

  update(id: number, materiel: Partial<Materiel>) {
    return this.http.put<Materiel>(`${this.API}/materiels/${id}`, materiel);
  }

  delete(id: number) {
    return this.http.delete(`${this.API}/materiels/${id}`);
  }
}