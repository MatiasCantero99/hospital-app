import { Routes } from '@angular/router';
import { LoginComponent } from './componentes/login/login.component';
import { HomeComponent } from './componentes/home/home.component';
import { ErrorComponent } from './componentes/error/error.component';

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
    // {
    //     path:'juegos',
    // loadChildren: () =>
    // import('./modulos/juegos/juegos.module').then(m => m.JuegosModule)
    // },
    {
        path: '**',
        component: ErrorComponent
    },
];
