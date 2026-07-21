import { Component, inject, OnInit, signal } from '@angular/core';
import { LayoutService } from '../../../core/layout/services/layout.service';
import { AsignarTareasDocenteComponent } from './asignar-tareas-docente.component';
import { TareasDocenteComponent } from './tareas-docente.component';

@Component({
  selector: 'app-tareas-shell',
  standalone: true,
  imports: [AsignarTareasDocenteComponent, TareasDocenteComponent],
  template: `
<div class="space-y-5 animate-fade-in">
  <div class="tabs">
    <button type="button" class="tab" [class.tab-active]="tab() === 'asignar'" (click)="tab.set('asignar')">
      <span class="icon icon-sm">assignment</span> Asignar tareas
    </button>
    <button type="button" class="tab" [class.tab-active]="tab() === 'entregas'" (click)="tab.set('entregas')">
      <span class="icon icon-sm">assignment_turned_in</span> Revisar entregas
    </button>
  </div>

  @if (tab() === 'asignar') {
    <app-asignar-tareas-docente />
  } @else {
    <app-tareas-docente-entregas />
  }
</div>
  `,
})
export class TareasShellComponent implements OnInit {
  private readonly layout = inject(LayoutService);
  readonly tab = signal<'asignar' | 'entregas'>('asignar');

  ngOnInit(): void {
    this.layout.setTitle('Tareas');
  }
}
