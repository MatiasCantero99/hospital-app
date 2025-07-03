import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { LoadingService } from '../../service/loading/loading.service';
import { LoadingComponent } from '../loading/loading.component';
import { Router } from '@angular/router';
import { EspecialistaService } from '../../service/especialista/especialista.service';
import { PacientesService } from '../../service/pacientes/pacientes.service';
import { AuthService } from '../../service/auth/auth.service';
import { FechaFormatPipe } from '../../pipes/fechaFormat/fecha-format.pipe';
import { EstadoturnocolorDirective } from '../../directiva/estadoturnocolor/estadoturnocolor.directive';
import { TieneResenaDirective } from '../../directiva/tieneResena/tiene-resena.directive';

const supabase: SupabaseClient = createClient(environment.supabaseUrl, environment.supabaseKey);
declare var bootstrap: any;

@Component({
  selector: 'app-mis-turnos',
  standalone:true,
  imports: [CommonModule, FormsModule, LoadingComponent, NgIf, NgFor, FechaFormatPipe,EstadoturnocolorDirective,TieneResenaDirective],
  templateUrl: './mis-turnos.component.html',
  styleUrl: './mis-turnos.component.scss'
})
export class MisTurnosComponent implements OnInit {
  turnos: any[] = [];
  filtro: string = '';
  filtroTipo: 'especialidad' | 'especialista' | 'paciente' = 'especialidad';

  comentarioModalTexto: string = '';
  modalTitulo: string = '';
  accionModal: string = '';
  turnoSeleccionado: any = null;
  historiaClinica: any = {
    altura: null,
    peso: null,
    temperatura: null,
    presion: '',
    extras: [{ nombre: '', valor: '' }]
  };
  turnoParaHistoria: any = null;
  notaCalificacion: number = 0;

  rol: 'paciente' | 'especialista' = 'paciente'; // setealo dinámico según usuario logueado
  emailUsuario: string = ''; // setealo dinámico también

  constructor(
    private toastr: ToastrService,
    public loadingService: LoadingService,
    private router: Router,
    private especialistaService: EspecialistaService,
    private pacienteService: PacientesService,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    this.authService.getUserData().subscribe(userData => {
      if (userData) {
        this.emailUsuario = userData.email;
        this.rol = userData.rol;
        this.cargarTurnos();
      }
      });
    }

  abrirModal(titulo: string, turno: any, accion: string) {
    console.log('hola');
    this.modalTitulo = titulo;
    this.accionModal = accion;
    this.turnoSeleccionado = turno;
    this.comentarioModalTexto = '';
    this.notaCalificacion = 0;

    const modal = new bootstrap.Modal(document.getElementById('comentarioModal')!);
    modal.show();
  }

  abrirModalHistoria(turno: any) {
    this.turnoParaHistoria = turno;
    this.historiaClinica = {
      altura: null,
      peso: null,
      temperatura: null,
      presion: '',
      extras: [{ nombre: '', valor: '' }]
    };

    const modal = new bootstrap.Modal(document.getElementById('historiaClinicaModal')!);
    modal.show();
  }

  agregarCampoExtra() {
    if (this.historiaClinica.extras.length < 3) {
      this.historiaClinica.extras.push({ nombre: '', valor: '' });
    }
  }

  async confirmarHistoriaClinica() {
    const data: { [key: string]: any } = {
      idTurno: this.turnoParaHistoria.id,
      altura: this.historiaClinica.altura,
      peso: this.historiaClinica.peso,
      temperatura: this.historiaClinica.temperatura,
      presion: this.historiaClinica.presion,
    };

    this.historiaClinica.extras.forEach((extra: any, index: number) => {
      if (extra.nombre && extra.valor) {
        data[`campoExtra${index + 1}_nombre`] = extra.nombre;
        data[`campoExtra${index + 1}_valor`] = extra.valor;
      }
    });

    // console.log('Insertando:', data);

    const { error } = await supabase.from('historialClinico').insert([data]);
    await supabase.from('turnos').update({ tieneHistorialClinico: true }).eq('id', this.turnoParaHistoria.id);


    if (error) {
      this.toastr.error('Error al guardar historia clínica');
      return;
    }

    this.toastr.success('Historia clínica guardada');

    const modal = bootstrap.Modal.getInstance(document.getElementById('historiaClinicaModal')!);
    modal?.hide();

    // Opcional: marca el turno para que no vuelva a mostrar botón
    this.cargarTurnos();
  }


  async confirmarComentario() {
    if (!this.comentarioModalTexto) {
      this.toastr.error('Debes escribir un comentario.');
      return;
    }

    let updateData: any = {};
    console.log('hola');
    console.log(updateData);
    console.log(this.turnoSeleccionado.id);

    switch (this.accionModal) {
      case 'cancelar':
        updateData = { estado: 'Cancelado', comentarioCancelado: this.comentarioModalTexto };
        break;
      case 'rechazar':
        updateData = { estado: 'Rechazado', comentarioRechazo: this.comentarioModalTexto };
        break;
      case 'finalizar':
        updateData = { estado: 'Realizado', resena: this.comentarioModalTexto };
        break;
      case 'calificar':
        updateData = {
          atencion: this.comentarioModalTexto,
          nota: this.notaCalificacion
        };
        break;
      default:
        this.toastr.error('Acción no reconocida.');
        return;
      }

    await supabase.from('turnos').update(updateData).eq('id', this.turnoSeleccionado.id);
    this.toastr.success('Actualización exitosa');

    this.cargarTurnos();

    const modal = bootstrap.Modal.getInstance(document.getElementById('comentarioModal')!);
    modal?.hide();
  }

  irASolicitarTurno() {
    this.router.navigate(['/solicitarTurno']);
  }

  async cargarTurnos() {
    this.loadingService.show();

    let query = supabase.from('turnos').select('*,historialClinico(*)');
    if (this.rol === 'paciente') {
      query = query.eq('emailPaciente', this.emailUsuario);
    } else {
      query = query.eq('emailEspecialista', this.emailUsuario);
    }

    const { data, error } = await query;

    if (error) {
      this.toastr.error('Error al cargar turnos');
      this.loadingService.hide();
      return;
    }

    this.turnos = data || [];
    // console.log(data[0]);

    // Recorre y agrega nombre/apellido:
    for (const turno of this.turnos) {
      if (this.rol === 'paciente') {
        const especialista = await this.especialistaService.getEspecialistaByEmail(turno.emailEspecialista);
        turno.especialista_nombre = `${especialista.nombre} ${especialista.apellido}`;
      } else {
        const paciente = await this.pacienteService.getPacienteByEmail(turno.emailPaciente);
        turno.paciente_nombre = `${paciente.nombre} ${paciente.apellido}`;
      }
    }

    this.loadingService.hide();
  }

  filtroCoincide(turno: any) {
    const texto = this.filtro.trim().toLowerCase();

    const coincideEspecialidad = turno.especialidad?.toLowerCase().includes(texto);
    const coincideEspecialista = turno.especialista_nombre?.toLowerCase().includes(texto);
    const coincidePaciente = turno.paciente_nombre?.toLowerCase().includes(texto);

    let coincideHistorial = false;

    if (Array.isArray(turno.historialClinico) && turno.historialClinico.length > 0) {
      coincideHistorial = turno.historialClinico.some((h: any) =>
        (h.altura?.toString().includes(texto)) ||
        (h.peso?.toString().includes(texto)) ||
        (h.temperatura?.toString().includes(texto)) ||
        (h.presion?.toString().includes(texto)) ||
        (h.campoExtra1_nombre?.toLowerCase().includes(texto)) ||
        (h.campoExtra1_valor?.toLowerCase().includes(texto)) ||
        (h.campoExtra2_nombre?.toLowerCase().includes(texto)) ||
        (h.campoExtra2_valor?.toLowerCase().includes(texto)) ||
        (h.campoExtra3_nombre?.toLowerCase().includes(texto)) ||
        (h.campoExtra3_valor?.toLowerCase().includes(texto))
      );
    }

    return coincideEspecialidad || coincideEspecialista || coincidePaciente || coincideHistorial;
  }


  get turnosFiltrados() {
    return this.turnos.filter(t => this.filtroCoincide(t));
  }

  async aceptarTurno(turno: any) {
    await supabase.from('turnos').update({ estado: 'Aceptado' }).eq('id', turno.id);
    this.toastr.success('Turno aceptado');
    this.cargarTurnos();
  }

  hayResena(): boolean {
    return this.turnosFiltrados.some(t => t.resena);
  }

  hayComentario(): boolean {
    return this.turnosFiltrados.some(t => t.atencion);
  }

  hayComentarioCancelado(): boolean {
    return this.turnosFiltrados.some(t => t.comentarioCancelado);
  }


}
