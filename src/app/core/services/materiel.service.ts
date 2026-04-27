import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

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

  create(request: MaterielRequest) {
    return this.http.post<Materiel>(`${this.API}/materiels`, request);
  }

  update(id: number, request: MaterielRequest) {
    return this.http.put<Materiel>(`${this.API}/materiels/${id}`, request);
  }

  delete(id: number) {
    return this.http.delete(`${this.API}/materiels/${id}`);
  }

  getCategories() {
    return this.http.get<Categorie[]>(`${this.API}/categories`);
  }

  getEtats() {
    return this.http.get<Etat[]>(`${this.API}/etats`);
  }

  getModeles() {
    return this.http.get<Modele[]>(`${this.API}/modeles`);
  }

  getLocalisations() {
    return this.http.get<Localisation[]>(`${this.API}/localisations`);
  }
}