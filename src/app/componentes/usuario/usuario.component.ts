import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { EspecialistaService } from '../../service/especialista/especialista.service';
import { AsyncPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { LoadingService } from '../../service/loading/loading.service';
import { LoadingComponent } from '../loading/loading.component';
import * as XLSX from 'xlsx';
import { PacientesService } from '../../service/pacientes/pacientes.service'
import { AdminService } from '../../service/admin/admin.service';
import { FormsModule } from '@angular/forms';
import { RegistroEspecialistaComponent } from '../registro-especialista/registro-especialista.component';
import { RegistroPacienteComponent } from '../registro-paciente/registro-paciente.component';
import { RegistroAdminComponent } from '../registro-admin/registro-admin.component';
import { HistorialClinicoService } from '../../service/historialClinico/historial-clinico.service';
import { HorarioAmPmPipe } from '../../pipes/horarioampmpipe/horario-am-pm-pipe.pipe';

@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [NgFor, NgClass,NgIf, LoadingComponent,AsyncPipe,FormsModule, RegistroEspecialistaComponent, RegistroPacienteComponent, RegistroAdminComponent, HorarioAmPmPipe],
  templateUrl: './usuario.component.html',
  styleUrl: './usuario.component.scss'
})
export class UsuarioComponent implements OnInit{
  usuarios: any[] = [];
  tipoSeleccionado: string = 'especialista';

  vista: string = 'usuarios';
  registroTipo: string | null = null

  historiasClinicas: any[] = [];

  constructor (private especialistaService: EspecialistaService, public loadingService: LoadingService,
     private pacienteService: PacientesService, private adminService: AdminService, private historialClinicoService: HistorialClinicoService){}

  async ngOnInit() {
    await this.cargarUsuarios();
  }

  async cargarUsuarios() {
     this.loadingService.show();
    try {
      if (this.tipoSeleccionado === 'especialista') {
        this.usuarios = await this.especialistaService.getEspecialistas();
      } else if (this.tipoSeleccionado === 'paciente') {
        this.usuarios = await this.pacienteService.getPacientes();
      } else {
        this.usuarios = await this.adminService.getAdministradores();
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      this.loadingService.hide();
    }
  }
  
  async cargarHistoriasClinicas() {
    this.loadingService.show();
    try {
      this.historiasClinicas = [];
      const historias = await this.historialClinicoService.getAllHistoriasClinicas();

      for (const historia of historias) {
      const paciente = await this.historialClinicoService.getPacienteByEmail(historia.turno.emailPaciente);
      const especialista = await this.historialClinicoService.getEspecialistaByEmail(historia.turno.emailEspecialista);

      this.historiasClinicas.push({
        ...historia,
        fecha: this.formatearFecha(historia.turno.fecha),
        horario: historia.turno.horario,
        paciente,
        especialista
      });
    }
    } catch (error) {
      console.error('Error al cargar historias clínicas:', error);
    } finally {
      this.loadingService.hide();
    }
  }

  formatearFecha(fecha: string): string {
    const [yyyy, mm, dd] = fecha.split('-');
    return `${dd}/${mm}/${yyyy}`;
  }

   async exportarExcel() {
    if (this.tipoSeleccionado === 'especialista') {
      // Si es especialista, traigo las especialidades para cada uno
      this.loadingService.show();
      for (const especialista of this.usuarios) {
        const especialidades = await this.especialistaService.getEspecialidadesByEmail(especialista.email);
        especialista.especialidades = especialidades.join(', ');
      }
      this.loadingService.hide();
    }

    const datos = this.usuarios.map(u => {
      const base: { [key: string]: any } = {
        Nombre: u.nombre,
        Apellido: u.apellido,
        Email: u.email,
        Edad: u.edad,
        Rol: this.tipoSeleccionado,
        DNI: u.dni
      };
      if (this.tipoSeleccionado === 'especialista') {
        base['Especialidades'] = u.especialidades || '';
      }
      return base;
    });

    const worksheet = XLSX.utils.json_to_sheet(datos);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios");

    XLSX.writeFile(workbook, `usuarios_${this.tipoSeleccionado}.xlsx`);
  }

  async exportarExcelGeneral() {
    this.loadingService.show();

    try {
      const especialistas = await this.especialistaService.getEspecialistas();
      const pacientes = await this.pacienteService.getPacientes();
      const admins = await this.adminService.getAdministradores();

      // Para cada especialista traigo sus especialidades
      for (const esp of especialistas) {
        const especialidades = await this.especialistaService.getEspecialidadesByEmail(esp.email);
        esp.especialidades = especialidades.join(', ');
      }

      const datos: any[] = [];

      especialistas.forEach(e => {
        datos.push({
          Nombre: e.nombre,
          Apellido: e.apellido,
          Email: e.email,
          Edad: e.edad,
          Rol: 'especialista',
          DNI: e.dni,
          Especialidades: e.especialidades,
          'Obra Social': ''
        });
      });

      pacientes.forEach(p => {
        datos.push({
          Nombre: p.nombre,
          Apellido: p.apellido,
          Email: p.email,
          Edad: p.edad,
          Rol: 'paciente',
          DNI: p.dni,
          Especialidades: '',
          'Obra Social': p.obraSocial || ''
        });
      });

      admins.forEach(a => {
        datos.push({
          Nombre: a.nombre,
          Apellido: a.apellido,
          Email: a.email,
          Edad: a.edad,
          Rol: 'administrador',
          DNI: a.dni,
          Especialidades: '',
          'Obra Social': ''
        });
      });

      const worksheet = XLSX.utils.json_to_sheet(datos);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "UsuariosGeneral");

      XLSX.writeFile(workbook, `usuarios_general.xlsx`);
    } catch (error) {
      console.error('Error exportando Excel general:', error);
    } finally {
      this.loadingService.hide();
    }
  }

  async exportarHistorialPaciente(paciente: any) {
    this.loadingService.show();
    try {
      const historias = await this.historialClinicoService.getAllHistoriasClinicas();
      const historiasDelPaciente = historias.filter(h => h.turno.emailPaciente === paciente.email);

      const datos = [];

      for (const h of historiasDelPaciente) {
        const especialista = await this.historialClinicoService.getEspecialistaByEmail(h.turno.emailEspecialista);

        datos.push({
          Fecha: this.formatearFecha(h.turno.fecha),
          Horario: h.turno.horario,
          Especialista: `${especialista.nombre} ${especialista.apellido}`
        });
      }

      const worksheet = XLSX.utils.json_to_sheet(datos);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `Historial_${paciente.nombre}`);

      XLSX.writeFile(workbook, `historial_${paciente.nombre}_${paciente.apellido}.xlsx`);
    } catch (error) {
      console.error('Error exportando historial paciente:', error);
    } finally {
      this.loadingService.hide();
    }
  }




  async cambiarEstado(especialista: any) {
    const nuevoEstado = !especialista.habilitado;
    try {
      await this.especialistaService.toggleHabilitado(especialista.id, nuevoEstado);
      especialista.habilitado = nuevoEstado;
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  }

}
