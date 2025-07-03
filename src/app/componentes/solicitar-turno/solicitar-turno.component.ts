import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { EspecialistaService } from '../../service/especialista/especialista.service';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { HorarioAmPmPipe } from '../../pipes/horarioampmpipe/horario-am-pm-pipe.pipe';

const supabase: SupabaseClient = createClient(environment.supabaseUrl, environment.supabaseKey);

@Component({
  selector: 'app-solicitar-turno',
  standalone: true,
  imports: [NgIf,NgFor,NgClass, HorarioAmPmPipe],
  templateUrl: './solicitar-turno.component.html',
  styleUrl: './solicitar-turno.component.scss'
})
export class SolicitarTurnoComponent implements OnInit{
  especialistas: any[] = [];
   pacientes: any[] = [];
  pacienteSeleccionado: any = null;

  especialistaSeleccionado: any = null;
  especialidades: string[] = [];
  especialidadSeleccionada: string = '';
  turnosDisponibles: { fecha: string, horario: string; disponible: boolean }[] = [];
  turnoSeleccionado: { fecha: string, horario: string } | null = null;

  emailUsuario: string = ''
  rol: string = '';

  constructor(private especialistaService: EspecialistaService, private router: Router, private toastr: ToastrService) {}

  async ngOnInit() {
    this.inicializarUsuario();
    try {
      this.especialistas = await this.especialistaService.getEspecialistas();
      console.log('Especialistas cargados:', this.especialistas);
    } catch (error) {
      console.error('Error al cargar especialistas:', error);
    }
  }

  async inicializarUsuario() {
    const { data } = await supabase.auth.getUser();
    this.emailUsuario = data?.user?.email || '';

    // 🔑 Leer rol
    const { data: admin } = await supabase
      .from('admin')
      .select('email')
      .eq('email', this.emailUsuario)
      .single();

    this.rol = admin ? 'administrador' : 'paciente';

    if (this.rol === 'administrador') {
      const { data: pacientes, error } = await supabase.from('paciente').select('*');
      if (error) {
        console.error(error);
        return;
      }
      this.pacientes = pacientes;
    }
  }

  async seleccionarPaciente(paciente: any) {
    this.pacienteSeleccionado = paciente;
  }

  async seleccionarEspecialista(especialista: any) {
    this.especialistaSeleccionado = especialista;
    try {
      this.especialidades = await this.especialistaService.getEspecialidadesByEmail(especialista.email);
    } catch (error) {
      console.error('Error al cargar especialidades:', error);
    }
  }

  async seleccionarEspecialidad(esp: string) {
    this.especialidadSeleccionada = esp;
    await this.cargarTurnosDisponibles();
  }

  async cargarTurnosDisponibles() {
    this.turnosDisponibles = [];

    const horarios = await this.especialistaService.getHorariosByEspecialistaYEspecialidad(
      this.especialistaSeleccionado.email,
      this.especialidadSeleccionada
    );


    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
    const hoy = new Date();

    // Preparar fechas posibles
    const posiblesTurnos: { fecha: string, horario: string }[] = [];

    for (let i = 0; i < 21; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() + i);
      const nombreDia = diasSemana[fecha.getDay()];

      horarios.forEach(horario => {
        if (horario.dia === nombreDia) {
          const yyyy = fecha.getFullYear();
          const mm = String(fecha.getMonth() + 1).padStart(2, '0');
          const dd = String(fecha.getDate()).padStart(2, '0');
          const fechaStr = `${yyyy}-${mm}-${dd}`;

          const hora = horario.hora.split(' - ')[0];
          posiblesTurnos.push({ fecha: fechaStr, horario: hora });
        }
      });
    }


    // Consultar turnos ocupados de una sola vez
    const { data: turnosOcupados, error } = await supabase
      .from('turnos')
      .select('fecha, horario, estado')
      .eq('emailEspecialista', this.especialistaSeleccionado.email);

    if (error) {
      console.error('Error al verificar turnos ocupados:', error.message);
      this.toastr.error('Error al verificar disponibilidad de turnos', 'Error');
      return;
    }



    const ocupadosSet = new Set(
    turnosOcupados?.filter(t => t.estado !== 'Cancelado' && t.estado !== 'Rechazado')
      .map(t => `${t.fecha}_${t.horario}`)
  );

    // Completar turnosDisponibles con flag de disponibilidad
    this.turnosDisponibles = posiblesTurnos.map(turno => ({
      ...turno,
      disponible: !ocupadosSet.has(`${turno.fecha}_${turno.horario}`)
    }));
  }


  seleccionarTurno(turno: { fecha: string, horario: string }) {
    this.turnoSeleccionado = turno;
  }

  async confirmarTurno() {
    if (!this.turnoSeleccionado) return;

    // Verifica si el turno ya existe
    const { data: turnosExistentes, error: consultaError } = await supabase
      .from('turnos')
      .select('*')
      .eq('emailEspecialista', this.especialistaSeleccionado.email)
      .eq('fecha', this.turnoSeleccionado.fecha)
      .eq('horario', this.turnoSeleccionado.horario);

    if (consultaError) {
      console.error('Error consultando turnos:', consultaError.message);
      this.toastr.error('Error verificando disponibilidad', 'Error');
      return;
    }

    if (turnosExistentes && turnosExistentes.length > 0) {
      this.toastr.warning('Ese turno ya está ocupado', 'Turno no disponible');
      return;
    }

    const turno = {
      emailPaciente: this.rol === 'administrador' ? this.pacienteSeleccionado.email : this.emailUsuario,
      emailEspecialista: this.especialistaSeleccionado.email,
      fecha: this.turnoSeleccionado.fecha,
      horario: this.turnoSeleccionado.horario,
      especialidad: this.especialidadSeleccionada
    };

    const { error } = await supabase.from('turnos').insert([turno]);

    if (error) {
      console.error('Error al guardar turno:', error.message);
      this.toastr.error('No se pudo confirmar el turno', 'Error');
    } else {
      this.toastr.success('¡Turno confirmado con éxito!', 'Éxito');
      this.router.navigate(['/solicitarTurnos']); 
    }
  }


  volver() {
    if (this.rol === 'administrador' && this.turnoSeleccionado) {
      this.turnoSeleccionado = null;
      return;
    }
    if (this.rol === 'administrador' && this.especialistaSeleccionado) {
      this.especialistaSeleccionado = null;
      return;
    }
    if (this.rol === 'administrador' && this.pacienteSeleccionado) {
      this.pacienteSeleccionado = null;
      return;
    }
    this.especialistaSeleccionado = null;
    this.especialidades = [];
    this.especialidadSeleccionada = '';
    this.turnosDisponibles = [];
  }

}
