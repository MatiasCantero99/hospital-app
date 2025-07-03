import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

const supabase: SupabaseClient = createClient(environment.supabaseUrl, environment.supabaseKey);

@Component({
  selector: 'app-pacientes',
  imports: [NgIf,NgFor],
  standalone:true,
  templateUrl: './pacientes.component.html',
  styleUrl: './pacientes.component.scss'
})
export class PacientesComponent implements OnInit{
  emailEspecialista: string = '';
  pacientes: any[] = [];
  pacienteSeleccionado: any = null;
  turnosDelPaciente: any[] = [];
  historialClinico: any[] = [];

  async ngOnInit() {
    // Obtener email del especialista logueado
    const { data } = await supabase.auth.getUser();
    this.emailEspecialista = data?.user?.email || '';

    // Buscar turnos para encontrar pacientes únicos
    const { data: turnos, error } = await supabase
      .from('turnos')
      .select('emailPaciente')
      .eq('emailEspecialista', this.emailEspecialista)
      .eq('estado', 'Realizado');

    if (error) {
      console.error('Error al traer turnos:', error);
      return;
    }

    // Extraer emails únicos
    const emailsUnicos = Array.from(new Set(turnos?.map(t => t.emailPaciente)));

    if (emailsUnicos.length === 0) {
      this.pacientes = [];
      return;
    }

    // Traer info de cada paciente por email
    const { data: pacientesData, error: errorPacientes } = await supabase
      .from('paciente')
      .select('email, nombre, apellido, fotoURL')
      .in('email', emailsUnicos);

      if (errorPacientes) {
      console.error('Error al traer pacientes:', errorPacientes);
      return;
    }

    this.pacientes = pacientesData || [];
  }

  async seleccionarPaciente(paciente: any) {
    this.pacienteSeleccionado = paciente;

    // Traer turnos de ese paciente con este especialista
    const { data: turnosPaciente } = await supabase
      .from('turnos')
      .select('*')
      .eq('emailEspecialista', this.emailEspecialista)
      .eq('emailPaciente', paciente.email)
      .eq('estado', 'Realizado');

    this.turnosDelPaciente = turnosPaciente || [];

    const idsTurnos = this.turnosDelPaciente.map(t => t.id);

    // Traer historial clínico
    const { data: historial } = await supabase
      .from('historialClinico')
      .select('*')
      .in('idTurno', idsTurnos);

    this.historialClinico = historial || [];
  }

  volver() {
    this.pacienteSeleccionado = null;
    this.turnosDelPaciente = [];
    this.historialClinico = [];
  }

}
