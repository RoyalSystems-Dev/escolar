import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-sin-permiso',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div class="text-center max-w-sm">
        <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span class="icon text-red-500" style="font-size:40px;width:40px;height:40px">lock</span>
        </div>
        <h1 class="text-3xl font-bold text-gray-800 mb-2">403</h1>
        <h2 class="text-xl font-semibold text-gray-700 mb-3">Acceso Denegado</h2>
        <p class="text-gray-500 mb-6 text-sm">
          No tienes permisos para acceder a esta secciÃ³n.<br>
          Contacta al administrador si crees que es un error.
        </p>
        <div class="flex gap-3 justify-center">
          <button class="btn btn-secondary" routerLink="/dashboard">
            <span class="icon">home</span> Ir al Dashboard
          </button>
        </div>
      </div>
    </div>
  `
})
export class SinPermisoComponent {}



