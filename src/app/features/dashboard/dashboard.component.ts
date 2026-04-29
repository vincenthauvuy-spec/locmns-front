import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MaterielService, Materiel } from '../../core/services/materiel.service';
import { EmpruntService, Emprunt } from '../../core/services/emprunt.service';

interface StatsParcVM {
  total: number;
  disponibles: number;
  enCours: number;
  enRetard: number;
}

interface EmpruntRetard {
  idEmprunt: number;
  materiel: string;
  emprunteur: string;
  dateFinPrevue: string;
  joursRetard: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private materielService = inject(MaterielService);
  private empruntService = inject(EmpruntService);

  user = this.auth.user;
  isGestionnaire = this.auth.isGestionnaire;

  loading = signal(true);

  stats = signal<StatsParcVM>({ total: 0, disponibles: 0, enCours: 0, enRetard: 0 });
  enRetard = signal<EmpruntRetard[]>([]);
  enAttente = signal<Emprunt[]>([]);

  chartInitialized = false;

  ngOnInit(): void {
    if (this.isGestionnaire()) {
      this.loadGestionnaireData();
    } else {
      this.loading.set(false);
    }
  }

  private loadGestionnaireData(): void {
    let materielsDone = false;
    let empruntsDone = false;

    this.materielService.getAll().subscribe({
      next: (materiels) => {
        const disponibles = materiels.filter((m) => m.estLouable).length;
        const enCours = materiels.filter((m) => !m.estLouable).length;
        this.stats.update((s) => ({ ...s, total: materiels.length, disponibles, enCours }));
        materielsDone = true;
        if (empruntsDone) {
          this.loading.set(false);
          this.initChart();
        }
      },
      error: () => {
        materielsDone = true;
        if (empruntsDone) this.loading.set(false);
      },
    });

    this.empruntService.getAll().subscribe({
      next: (emprunts) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const retards: EmpruntRetard[] = emprunts
          .filter((e) => e.statut === 'EN_RETARD')
          .map((e) => {
            const fin = new Date(e.dateFinPrevue);
            fin.setHours(0, 0, 0, 0);
            const joursRetard = Math.round((today.getTime() - fin.getTime()) / 86400000);
            return { idEmprunt: e.idEmprunt, materiel: e.materiel, emprunteur: e.emprunteur, dateFinPrevue: e.dateFinPrevue, joursRetard };
          })
          .sort((a, b) => b.joursRetard - a.joursRetard);

        this.enRetard.set(retards);
        this.stats.update((s) => ({ ...s, enRetard: retards.length }));

        const attente = emprunts.filter((e) => e.statut === 'EN_ATTENTE');
        this.enAttente.set(attente);

        empruntsDone = true;
        if (materielsDone) {
          this.loading.set(false);
          this.initChart();
        }
      },
      error: () => {
        empruntsDone = true;
        if (materielsDone) this.loading.set(false);
      },
    });
  }

  private initChart(): void {
    if (this.chartInitialized) return;
    this.chartInitialized = true;
    setTimeout(() => {
      const canvas = document.getElementById('parc-donut') as HTMLCanvasElement;
      if (!canvas || !(window as any).Chart) return;
      const s = this.stats();
      new (window as any).Chart(canvas, {
        type: 'doughnut',
        data: {
          datasets: [{
            data: [s.disponibles, s.enCours - s.enRetard, s.enRetard],
            backgroundColor: ['#22C55E', '#3B82F6', '#EF4444'],
            borderWidth: 0,
            hoverOffset: 4,
          }],
        },
        options: {
          cutout: '72%',
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          animation: { duration: 500 },
        },
      });
    }, 100);
  }

  getInitiales(nom: string): string {
    return nom.split(' ').map((p) => p[0]).join('').substring(0, 2).toUpperCase();
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  pct(val: number): string {
    const t = this.stats().total;
    if (!t) return '0%';
    return Math.round((val / t) * 100) + '%';
  }
}