import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RegistroComponent } from '../../componentes/registro/registro.component';
import { RegistroPacienteComponent } from '../../componentes/registro-paciente/registro-paciente.component';
import { RegistroEspecialistaComponent } from '../../componentes/registro-especialista/registro-especialista.component';

const routes: Routes = [
  {path: '',loadComponent: () => import('../../componentes/registro/registro.component').then(m => m.RegistroComponent)},
  {path: 'paciente',loadComponent: () => import('../../componentes/registro-paciente/registro-paciente.component').then(m => m.RegistroPacienteComponent)
  },
  {path: 'especialista',loadComponent: () => import('../../componentes/registro-especialista/registro-especialista.component').then(m => m.RegistroEspecialistaComponent)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RegistroRoutingModule { }
