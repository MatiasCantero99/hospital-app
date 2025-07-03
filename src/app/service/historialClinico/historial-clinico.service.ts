import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class HistorialClinicoService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
   }

  async getAllHistoriasClinicas() {
    // Traer solo la tabla base:
    const { data: historias, error } = await this.supabase
      .from('historialClinico')
      .select('*');

    if (error) throw error;

    const historiasCompletas = [];

    for (const historia of historias) {
      // Buscar el turno relacionado:
      const { data: turno, error: turnoError } = await this.supabase
        .from('turnos')
        .select('fecha, horario, emailPaciente, emailEspecialista')
        .eq('id', historia.idTurno)
        .single();

      if (turnoError) throw turnoError;

      // Agregar turno al objeto
      historiasCompletas.push({
        ...historia,
        turno: turno
      });
    }

    return historiasCompletas;
  }


  async getPacienteByEmail(email: string) {
    const { data, error } = await this.supabase
      .from('paciente')
      .select('nombre, apellido')
      .eq('email', email)
      .single();

    if (error) throw error;

    return data;
  }

  async getEspecialistaByEmail(email: string) {
    const { data, error } = await this.supabase
      .from('especialista')
      .select('nombre, apellido')
      .eq('email', email)
      .single();

    if (error) throw error;

    return data;
  }

  async generarPDF(historias: any[], paciente: any, turno: any, emailEspecialista: string) {
    const doc = new jsPDF();

    // Logo
    const img = new Image();
    img.src = 'assets/img/logo.png';
    doc.addImage(img, 'PNG', 10, 10, 30, 30);

    doc.setFontSize(18);
    doc.text('Informe de Historia Clínica', 50, 20);
    doc.setFontSize(10);
    doc.text(`Emitido: ${new Date().toLocaleDateString()}`, 50, 28);

    doc.setFontSize(12);
    doc.text(`Paciente: ${paciente.nombre} ${paciente.apellido}`, 10, 50);

    let y = 60;

    historias.forEach((h, index) => {
      doc.setFontSize(11);
      doc.text(`Atención ${index + 1}:`, 10, y);
      y += 6;
      doc.text(`Fecha: ${h.turno.fecha} - Horario: ${h.turno.horario}`, 10, y);
      y += 6;
      doc.text(`Altura: ${h.altura} cm, Peso: ${h.peso} kg, Temp: ${h.temperatura} °C, Presión: ${h.presion}`, 10, y);
      y += 6;

      if (h.campoExtra1_nombre) {
        doc.text(`${h.campoExtra1_nombre}: ${h.campoExtra1_valor}`, 10, y);
        y += 6;
      }
      if (h.campoExtra2_nombre) {
        doc.text(`${h.campoExtra2_nombre}: ${h.campoExtra2_valor}`, 10, y);
        y += 6;
      }
      if (h.campoExtra3_nombre) {
        doc.text(`${h.campoExtra3_nombre}: ${h.campoExtra3_valor}`, 10, y);
        y += 6;
      }

      y += 4;

      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(`Historia_Clinica_${paciente.nombre}_${paciente.apellido}.pdf`);
  }
}
