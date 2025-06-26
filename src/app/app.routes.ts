import { Routes } from '@angular/router';
import { LoginComponent } from './componentes/login/login.component';
import { HomeComponent } from './componentes/home/home.component';
import { ErrorComponent } from './componentes/error/error.component';
import { UsuarioComponent } from './componentes/usuario/usuario.component';
import { adminGuard } from './guards/admin.guard';
import { MiPerfilComponent } from './componentes/mi-perfil/mi-perfil.component';
import { MisHorariosComponent } from './componentes/mis-horarios/mis-horarios.component';

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
        path: 'usuario',
        component: UsuarioComponent,
        canActivate:[adminGuard]
    },
    {
        path: 'miPerfil',
        component: MiPerfilComponent
    },
    {
        path: 'misHorarios',
        component: MisHorariosComponent
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
