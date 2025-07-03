import { Routes } from '@angular/router';
import { LoginComponent } from './componentes/login/login.component';
import { HomeComponent } from './componentes/home/home.component';
import { ErrorComponent } from './componentes/error/error.component';
import { UsuarioComponent } from './componentes/usuario/usuario.component';
import { adminGuard } from './guards/admin.guard';
import { MiPerfilComponent } from './componentes/mi-perfil/mi-perfil.component';
import { MisHorariosComponent } from './componentes/mis-horarios/mis-horarios.component';
import { MisTurnosComponent } from './componentes/mis-turnos/mis-turnos.component';
import { SolicitarTurnoComponent } from './componentes/solicitar-turno/solicitar-turno.component';
import { TurnosComponent } from './componentes/turnos/turnos.component';
import { PacientesComponent } from './componentes/pacientes/pacientes.component';
import { InformeComponent } from './componentes/informe/informe.component';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'home',
    },
    {
        path: 'login',
        component: LoginComponent,
        data: {animation: 'login'}
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
        path: 'turnos',
        component: TurnosComponent,
        canActivate:[adminGuard]
    },
    {
        path: 'solicitarTurnos',
        component: SolicitarTurnoComponent,
        canActivate:[adminGuard]
    },
    {
        path: 'misTurnos',
        component: MisTurnosComponent,
        // canActivate:[adminGuard]
    },
    {
        path: 'pacientes',
        component: PacientesComponent,
    },
    {
        path: 'solicitarTurno',
        component: SolicitarTurnoComponent
    },
    {
        path: 'miPerfil',
        component: MiPerfilComponent,
        data: { animation: 'perfil' }
    },
    {
        path: 'misHorarios',
        component: MisHorariosComponent,
        data: { animation: 'horarios' }
    },
    {
        path:'registro',
        loadChildren: () =>
        import('./modulos/registro/registro.module').then(m => m.RegistroModule)
    },
    {
        path: 'informes',
        component: InformeComponent,
        canActivate:[adminGuard]
    },
    {
        path: '**',
        component: ErrorComponent
    },
];
