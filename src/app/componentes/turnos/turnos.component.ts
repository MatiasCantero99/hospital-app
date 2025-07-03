import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { LoadingService } from '../../service/loading/loading.service';
import { LoadingComponent } from '../loading/loading.component';
import { EspecialistaService } from '../../service/especialista/especialista.service';
import { PacientesService } from '../../service/pacientes/pacientes.service';

const supabase: SupabaseClient = createClient(environment.supabaseUrl, environment.supabaseKey);
declare var bootstrap: any;

@Component({
  selector: 'app-turnos',
  standalone:true,
  imports: [CommonModule, FormsModule, LoadingComponent, NgIf, NgFor],
  templateUrl: './turnos.component.html',
  styleUrl: './turnos.component.scss'
})
export class TurnosComponent implements OnInit {
  turnos: any[] = [];
  filtro: string = '';

  comentarioModalTexto: string = '';
  turnoSeleccionado: any = null;

  constructor(
    private toastr: ToastrService,
    public loadingService: LoadingService,
    private especialistaService: EspecialistaService,
    private pacienteService: PacientesService
  ) {}

  async ngOnInit() {
    this.cargarTurnos();
  }

  async cargarTurnos() {
    this.loadingService.show();

    const { data, error } = await supabase.from('turnos').select('*');

    if (error) {
      this.toastr.error('Error al cargar turnos');
      this.loadingService.hide();
      return;
    }

    this.turnos = data || [];

    // Agregar nombres de especialista y paciente
    for (const turno of this.turnos) {
      const especialista = await this.especialistaService.getEspecialistaByEmail(turno.emailEspecialista);
      const paciente = await this.pacienteService.getPacienteByEmail(turno.emailPaciente);

      turno.especialista_nombre = `${especialista.nombre} ${especialista.apellido}`;
      turno.paciente_nombre = `${paciente.nombre} ${paciente.apellido}`;
    }
    console.log('hola2');

    this.loadingService.hide();
  }

  filtroCoincide(turno: any) {
    const texto = this.filtro.trim().toLowerCase();

    const coincideEspecialidad = turno.especialidad?.toLowerCase().includes(texto);
    const coincideEspecialista = turno.especialista_nombre?.toLowerCase().includes(texto);

    return coincideEspecialidad || coincideEspecialista;
  }

  get turnosFiltrados() {
    return this.turnos.filter(t => this.filtroCoincide(t));
  }


  abrirModalCancelar(turno: any) {
    this.turnoSeleccionado = turno;
    this.comentarioModalTexto = '';

    const modal = new bootstrap.Modal(document.getElementById('comentarioModal')!);
    modal.show();
  }

  async confirmarCancelar() {
    if (!this.comentarioModalTexto) {
      this.toastr.error('Debes escribir un comentario para cancelar.');
      return;
    }

    await supabase.from('turnos').update({
      estado: 'Cancelado',
      comentarioCancelado: this.comentarioModalTexto
    }).eq('id', this.turnoSeleccionado.id);

    this.toastr.success('Turno cancelado correctamente');
    this.cargarTurnos();

    const modal = bootstrap.Modal.getInstance(document.getElementById('comentarioModal')!);
    modal?.hide();
  }
}
