import { Component, inject, OnInit } from '@angular/core';
import { LayoutService } from '../../../core/layout/services/layout.service';

@Component({
  standalone: true,
  imports: [],
  template: `
    <div class="space-y-5">
      <h2 class="text-xl font-bold text-gray-800">Control de Morosidad</h2>
      <div class="card p-16 flex flex-col items-center justify-center text-center">
        <span class="icon icon-2xl text-indigo-300 mb-4">construction</span>
        <h3 class="text-lg font-semibold text-gray-700 mb-2">Control de Morosidad</h3>
        <p class="text-gray-500 text-sm">Modulo en desarrollo.</p>
      </div>
    </div>
  `
})
export class MorosidadComponent implements OnInit {
  private readonly layout = inject(LayoutService);
  ngOnInit(): void { this.layout.setTitle('Control de Morosidad'); }
}


