import { Component, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { AuthService } from '../../service/auth/auth.service';
import { Router } from '@angular/router';
import { ResaltarRolDirective } from '../../directiva/resaltar-rol.directive';
import { RoliconoPipe } from '../../pipes/rolicono.pipe';
import { HistorialClinicoService } from '../../service/historialClinico/historial-clinico.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [NgIf, ResaltarRolDirective,RoliconoPipe,NgFor],
  templateUrl: './mi-perfil.component.html',
  styleUrl: './mi-perfil.component.scss'
})
export class MiPerfilComponent implements OnInit {
  usuario: any = null;
  especialistas: any[] = [];
  historiasClinicas: any[] = [];

  constructor(private authService: AuthService, private router: Router, private historialClinicoService: HistorialClinicoService, private toastr: ToastrService) {}


  // ngOnInit(): void {
  //   this.authService.getUserData().subscribe(data => {
  //     this.usuario = data;

  //     if (this.usuario?.rol === 'paciente') {
  //       this.historialClinicoService.getAllHistoriasClinicas().then(historias => {
  //         const soloMios = historias.filter(h => h.turno.emailPaciente === this.usuario.email);
  //         const unicos = Array.from(new Set(soloMios.map(h => h.turno.emailEspecialista)));
  //         this.especialistas = [];

  //         unicos.forEach(async mail => {
  //           const especialista = await this.historialClinicoService.getEspecialistaByEmail(mail);
  //           this.especialistas.push({ ...especialista, email: mail });
  //         });
  //       });
  //     }
  //   });
  // }
  ngOnInit(): void {
    this.authService.getUserData().subscribe(data => {
      this.usuario = data;

      if (this.usuario?.rol === 'paciente') {
        this.cargarHistoriasYEspecialistas();
      }
    });
  }

  async cargarHistoriasYEspecialistas() {
    const historias = await this.historialClinicoService.getAllHistoriasClinicas();

    this.historiasClinicas = historias.filter(h => h.turno.emailPaciente === this.usuario.email);

    const unicos = Array.from(new Set(this.historiasClinicas.map(h => h.turno.emailEspecialista)));
    this.especialistas = [];

    for (const mail of unicos) {
      const especialista = await this.historialClinicoService.getEspecialistaByEmail(mail);
      this.especialistas.push({ ...especialista, email: mail });
    }
  }


  logout() {
    this.authService.logout();
    this.router.navigate(['/home']);
  }

  irAMisHorarios() {
    this.router.navigate(['/misHorarios']);
  }

  async descargarPDF(emailEspecialista: string) {
    const historias = await this.historialClinicoService.getAllHistoriasClinicas();
    const filtradas = historias.filter(
      h => h.turno.emailPaciente === this.usuario.email && h.turno.emailEspecialista === emailEspecialista
    );

    if (filtradas.length === 0) {
      this.toastr.warning('No hay historias para este especialista');
      return;
    }

    // Llamar servicio PDF
    this.historialClinicoService.generarPDF(filtradas, this.usuario, filtradas[0].turno, emailEspecialista);
  }
}
