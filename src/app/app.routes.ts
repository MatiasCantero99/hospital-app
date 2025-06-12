import { Routes } from '@angular/router';
import { LoginComponent } from './componentes/login/login.component';
import { HomeComponent } from './componentes/home/home.component';
import { ErrorComponent } from './componentes/error/error.component';
import { RegistroComponent } from './componentes/registro/registro.component';
import { RegistroPacienteComponent } from './componentes/registro-paciente/registro-paciente.component';
import { RegistroEspecialistaComponent } from './componentes/registro-especialista/registro-especialista.component';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'home',
    },
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'home',
        component: HomeComponent
    },
    {
        path: 'registro/paciente',
        component: RegistroPacienteComponent
    },
    {
        path: 'registro/especialista',
        component: RegistroEspecialistaComponent
    },
    {
        path:'registro',
        loadChildren: () =>
        import('./modulos/registro/registro.module').then(m => m.RegistroModule)
    },
    {
        path: '**',
        component: ErrorComponent
    },
];
