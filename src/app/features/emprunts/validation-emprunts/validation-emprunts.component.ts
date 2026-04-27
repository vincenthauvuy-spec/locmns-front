import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmpruntService, Emprunt } from '../../../core/services/emprunt.service';

@Component({
  selector: 'app-validation-emprunts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './validation-emprunts.component.html'
})
export class ValidationEmpruntsComponent implements OnInit {
  private empruntService = inject(EmpruntService);

  emprunts = signal<Emprunt[]>([]);
  loading = signal(true);
  traitement = signal<number | null>(null);

  ngOnInit(): void {
    this.loadEmprunts();
  }

  loadEmprunts(): void {
    this.empruntService.getEnAttente().subscribe({
      next: (data) => {
        this.emprunts.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  valider(id: number, decision: boolean): void {
    this.traitement.set(id);
    this.empruntService.valider(id, decision).subscribe({
      next: () => {
        this.traitement.set(null);
        this.loadEmprunts();
      },
      error: () => this.traitement.set(null)
    });
  }
}