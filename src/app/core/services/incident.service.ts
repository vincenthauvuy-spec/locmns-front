import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Incident {
  idIncident: number;
  description: string;
  dateSignalement: string;
  typeIncident: string;
  materiel: string;
  emprunteur: string;
  idEmprunt?: number;
}

export interface IncidentRequest {
  description: string;
  idTypeIncident: number;
  idMateriel: number;
  idEmprunt?: number | null;
}

@Injectable({ providedIn: 'root' })
export class IncidentService {
  private http = inject(HttpClient);
  private readonly API = 'http://localhost:8080/api';

  getAll() {
    return this.http.get<Incident[]>(`${this.API}/incidents`);
  }

  getById(id: number) {
    return this.http.get<Incident>(`${this.API}/incidents/${id}`);
  }

  signalerIncident(request: IncidentRequest) {
    return this.http.post<Incident>(`${this.API}/incidents/signaler`, request);
  }

  deleteById(id: number) {
    return this.http.delete<void>(`${this.API}/incidents/${id}`);
  }
}