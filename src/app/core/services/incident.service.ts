import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '../api/api-client.service';

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
  private readonly api = inject(ApiClientService);

  getAll() {
    return this.api.get<Incident[]>('/incidents');
  }

  getById(id: number) {
    return this.api.get<Incident>(`/incidents/${id}`);
  }

  signalerIncident(request: IncidentRequest) {
    return this.api.post<Incident>('/incidents/signaler', request);
  }

  deleteById(id: number) {
    return this.api.delete<void>(`/incidents/${id}`);
  }
}