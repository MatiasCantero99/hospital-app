import { Component,OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, CommonModule, NgFor } from '@angular/common';
import { AuthService } from '../../service/auth/auth.service';
import { EspecialistaService } from '../../service/especialista/especialista.service';
import { SupabaseClient } from '@supabase/supabase-js';
import { LoadingComponent } from '../loading/loading.component';
import { LoadingService } from '../../service/loading/loading.service';
import { ToastrService } from 'ngx-toastr';


@Component({
  selector: 'app-mis-horarios',
  standalone:true,
  imports: [FormsModule,NgFor,CommonModule],
  templateUrl: './mis-horarios.component.html',
  styleUrl: './mis-horarios.component.scss'
})
export class MisHorariosComponent implements OnInit {
  especialidades: string[] = [];
  especialidadSeleccionada = '';
  diaSeleccionado = '';
  horaInicio = '';
  horaFin = '';
  horariosActuales: any[] = [];

  diasDisponibles = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
  horasDisponibles = this.generarHoras('08:00', '17:00');

  email: string = '';
  supabase!: SupabaseClient

  constructor(
    private authService: AuthService,
    private especialistaService: EspecialistaService,
    private loadingService: LoadingService,
    private toastr: ToastrService
  ) {}

  async ngOnInit() {
    this.loadingService.show();
    try {
      this.supabase = this.authService.getSupabase();

      const user = await this.supabase.auth.getUser();
      if (!user.data?.user?.email) return;

      this.email = user.data.user.email;
      this.especialidades = await this.especialistaService.getEspecialidadesByEmail(this.email);

      await this.cargarHorarios();
      } catch (error) {
        console.error(error);
        this.toastr.error('Error al cargar los datos del especialista.', 'Error');
      } finally {
        this.loadingService.hide();
    }
  }

  generarHoras(desde: string, hasta: string): string[] {
  const horas: string[] = [];
  let [h, m] = desde.split(':').map(Number);
  const [hf, mf] = hasta.split(':').map(Number);

  while (h < hf || (h === hf && m < mf)) {
    horas.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    m += 30;
    if (m >= 60) {
      m = 0;
      h++;
    }
  }

  horas.push(`${hf.toString().padStart(2, '0')}:${mf.toString().padStart(2, '0')}`);

  return horas;
}


  generarTurnos30min(inicio: string, fin: string): string[] {
    const todas = this.generarHoras(inicio, fin);
    const turnos: string[] = [];

    for (let i = 0; i < todas.length - 1; i++) {
      turnos.push(`${todas[i]} - ${todas[i + 1]}`);
    }

    return turnos;
  }


  async guardarHorarios() {
    if (!this.especialidadSeleccionada || !this.diaSeleccionado || !this.horaInicio || !this.horaFin) {
      this.toastr.warning('Completá todos los campos antes de guardar.', 'Faltan datos');
      return;
    }

    if (this.horaFin <= this.horaInicio) {
      this.toastr.warning('La hora de fin debe ser mayor a la de inicio.', 'Hora inválida');
      return;
    }

    this.loadingService.show();

    const turnos = this.generarTurnos30min(this.horaInicio, this.horaFin);
    const nuevosTurnos = turnos.map(t => ({
      email: this.email,
      especialidad: this.especialidadSeleccionada,
      dia: this.diaSeleccionado,
      hora: t
    }));

    try {
      const { error } = await this.supabase
        .from('mis_horarios')
        .insert(nuevosTurnos);

      if (error) throw error;

      this.toastr.success('Horarios guardados correctamente.', 'Éxito');
      await this.cargarHorarios();
    } catch (error) {
      console.error(error);
      this.toastr.error('No se pudieron guardar los horarios.', 'Error');
    } finally {
      this.loadingService.hide();
    }
  }

  async cargarHorarios() {
    const { data, error } = await this.supabase
      .from('mis_horarios')
      .select('*')
      .eq('email', this.email);

    if (!error && data) {
      this.horariosActuales = data;
    }
  }

  async eliminarTurno(turno: any) {
    this.loadingService.show();
    try {
      const { error } = await this.supabase
        .from('mis_horarios')
        .delete()
        .match({
          email: this.email,
          dia: turno.dia,
          hora: turno.hora,
          especialidad: turno.especialidad
        });

      if (error) throw error;

      this.toastr.info('Turno eliminado.', 'Eliminado');
      this.horariosActuales = this.horariosActuales.filter(t =>
        !(t.dia === turno.dia && t.hora === turno.hora && t.especialidad === turno.especialidad)
      );
    } catch (error) {
      console.error(error);
      this.toastr.error('Error al eliminar el turno.', 'Error');
    } finally {
      this.loadingService.hide();
    }
  }

}
