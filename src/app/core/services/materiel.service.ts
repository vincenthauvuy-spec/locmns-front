import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '../api/api-client.service';

export interface Materiel {
  idMateriel: number;
  nom: string;
  numeroSerie: string;
  modele: string;
  localisation: string;
  description?: string;
  estLouable: boolean;
  etat: string;
  categorie: string;
  statut?: 'DISPONIBLE' | 'EN_COURS' | 'EN_RETARD';
}

export interface Categorie {
  idCategorie: number;
  libelle: string;
}

export interface Etat {
  idEtat: number;
  libelle: string;
}

export interface Modele {
  idModele: number;
  nom: string;
}

export interface Localisation {
  idLocalisation: number;
  nom: string;
}

export interface MaterielRequest {
  nom: string;
  numeroSerie: string;
  idModele: number;
  idLocalisation: number;
  idEtat: number;
  idCategorie: number;
}

@Injectable({ providedIn: 'root' })
export class MaterielService {
  private readonly api = inject(ApiClientService);

  getAll() {
    return this.api.get<Materiel[]>('/materiels');
  }

  getDisponibles() {
    return this.api.get<Materiel[]>('/materiels/disponibles');
  }

  getById(id: number) {
    return this.api.get<Materiel>(`/materiels/${id}`);
  }

  create(request: MaterielRequest) {
    return this.api.post<Materiel>('/materiels', request);
  }

  update(id: number, request: MaterielRequest) {
    return this.api.put<Materiel>(`/materiels/${id}`, request);
  }

  delete(id: number) {
    return this.api.delete<void>(`/materiels/${id}`);
  }

  getCategories() {
    return this.api.get<Categorie[]>('/categories');
  }

  getEtats() {
    return this.api.get<Etat[]>('/etats');
  }

  getModeles() {
    return this.api.get<Modele[]>('/modeles');
  }

  getLocalisations() {
    return this.api.get<Localisation[]>('/localisations');
  }

  isDisponible(id: number, dateDebut: string, dateFin: string) {
    return this.api.get<boolean>(
      this.api.withQuery(`/materiels/${id}/disponible`, { dateDebut, dateFin }),
    );
  }
}
