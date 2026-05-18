import { Injectable, inject } from '@angular/core';
import { ApiClientService } from '../api/api-client.service';

export interface UtilisateurDTO {
  idUtilisateur: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
}

export interface UtilisateurRequest {
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  idRole: number;
}

@Injectable({ providedIn: 'root' })
export class UtilisateurService {
  private readonly api = inject(ApiClientService);

  getAll() {
    return this.api.get<UtilisateurDTO[]>('/utilisateurs');
  }

  create(request: UtilisateurRequest) {
    return this.api.post<UtilisateurDTO>('/utilisateurs', request);
  }

  updateRole(id: number, idRole: number) {
    return this.api.patch<UtilisateurDTO>(`/utilisateurs/${id}/role`, { idRole });
  }

  delete(id: number) {
    return this.api.delete<void>(`/utilisateurs/${id}`);
  }
}