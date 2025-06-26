import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { EspecialistaService } from '../../service/especialista/especialista.service';
import { AsyncPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { LoadingService } from '../../service/loading/loading.service';
import { LoadingComponent } from '../loading/loading.component';
import * as XLSX from 'xlsx';
import { PacientesService } from '../../service/pacientes/pacientes.service'
import { AdminService } from '../../service/admin/admin.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [NgFor, NgClass,NgIf, LoadingComponent,AsyncPipe,FormsModule],
  templateUrl: './usuario.component.html',
  styleUrl: './usuario.component.scss'
})
export class UsuarioComponent implements OnInit{
  usuarios: any[] = [];
  tipoSeleccionado: string = 'especialista';

  constructor (private especialistaService: EspecialistaService, public loadingService: LoadingService, private cdr: ChangeDetectorRef,
     private pacienteService: PacientesService, private adminService: AdminService){}

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

  // async cambiarEstado(especialista: any) {
  //   const nuevoEstado = !especialista.habilitado;
  //   try {
  //     await this.especialistaService.toggleHabilitado(especialista.id, nuevoEstado);
  //     especialista.habilitado = nuevoEstado; // actualiza visualmente
  //   } catch (error) {
  //     console.error('Error al cambiar estado:', error);
  //   }
  // }

   exportarExcel() {
    const datos = this.usuarios.map(u => ({
      Nombre: u.nombre,
      Apellido: u.apellido,
      Email: u.email,
      Edad: u.edad,
      Rol: this.tipoSeleccionado,
      DNI: u.dni
    }));

    const worksheet = XLSX.utils.json_to_sheet(datos);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Usuarios");

    XLSX.writeFile(workbook, `usuarios_${this.tipoSeleccionado}.xlsx`);
  

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
