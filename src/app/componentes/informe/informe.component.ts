import { Component, ViewChild, ElementRef } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { NgChartsModule } from 'ng2-charts';
import { InformesService } from '../../service/informes/informes.service';
import { NgClass, NgIf } from '@angular/common';
import { FechaFormatPipe } from '../../pipes/fechaFormat/fecha-format.pipe';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-informe',
  standalone:true,
  imports: [NgChartsModule,NgIf, FechaFormatPipe, NgClass, FormsModule],
  templateUrl: './informe.component.html',
  styleUrl: './informe.component.scss'
})
export class InformeComponent {
  @ViewChild('graficoEspecialidad') graficoEspecialidad!: ElementRef<HTMLCanvasElement>;
  @ViewChild('graficoDia', { read: ElementRef }) graficoDia!: ElementRef<HTMLCanvasElement>;
  @ViewChild('graficoSolicitados', { read: ElementRef }) graficoSolicitados!: ElementRef<HTMLCanvasElement>;
  @ViewChild('graficoFinalizados', { read: ElementRef }) graficoFinalizados!: ElementRef<HTMLCanvasElement>;
  @ViewChild('graficoLogs', { read: ElementRef }) graficoLogs!: ElementRef<HTMLCanvasElement>;

  fechaDesde: string = '';
  fechaHasta: string = '';

  informeSeleccionado: string = '';
  labelsEspecialidad: string[] = [];
  datasetsEspecialidad: any[] = [];
  mayorEspecialidad: { especialidad: string; cantidad: number } | null = null;

  labelsPorDia: string[] = [];
  datasetsPorDia: any[] = [];
  mayorDia: { fecha: string; cantidad: number } | null = null;

  labelsFinalizadosMedico: string[] = [];
  datasetsFinalizadosMedico: any[] = [];
  medicoConMasFinalizados: { emailEspecialista: string; cantidad: number } | null = null;

  labelsSolicitadosMedico: string[] = [];
  datasetsSolicitadosMedico: any[] = [];
  medicoConMasSolicitados: { emailEspecialista: string; cantidad: number } | null = null;

  logs: { usuario: string; fechas: string }[] = [];

  labelsLogs: string[] = [];
  datasetsLogs: any[] = [];
  diaConMasLogins: { fechas: string; cantidad: number } | null = null;

  // Opciones del gráfico
  barChartOptions: ChartOptions<'bar'> = {
  responsive: true,
  plugins: {
    legend: { position: 'top' },
    datalabels: {
      anchor: 'end',
      align: 'end',
      color: '#000',
      font: { weight: 'bold' }
    }
  }
};
public barChartPlugins = [ChartDataLabels];

  constructor(private informesService: InformesService) {}
  ngOnInit(): void {}

  seleccionarInforme(nombre: string) {
    this.informeSeleccionado = nombre;

    if (nombre === 'especialidad') {
      this.cargarTurnosPorEspecialidad();
    }
    else if (nombre === 'dia'){
      this.cargarTurnosPorDia();
    }
    else if (nombre === 'medicoFinalizados'){
      this.cargarTurnosFinalizadosPorMedico();
    }
    else if (nombre === 'medicoSolicitados'){
      this.cargarTurnosSolicitadosPorMedico();
    }
    else if (nombre === 'log'){
      this.cargarLogs();
    }
  
  }

  async cargarTurnosPorEspecialidad() {
    try {
      const datos = await this.informesService.getTurnosPorEspecialidad();
      this.labelsEspecialidad = datos.map(d => d.especialidad);
      this.datasetsEspecialidad = [{
        data: datos.map(d => d.cantidad),
        label: 'Turnos',
        backgroundColor: '#0d6efd',
        barThickness: 50, // más finita
      }];

      this.mayorEspecialidad = datos.reduce((max, item) => item.cantidad > max.cantidad ? item : max, datos[0]);
    } catch (error) {
      console.error('Error al obtener datos:', error);
    }
  }

  async cargarTurnosPorDia() {
    try {
      const datos = await this.informesService.getTurnosPorDia();

      this.labelsPorDia = datos.map(d => d.fecha);
      this.datasetsPorDia = [{
        data: datos.map(d => d.cantidad),
        label: 'Turnos',
        backgroundColor: '#198754', // verde
        barThickness: 20, // más finita
      }];

      this.mayorDia = datos.reduce((max, item) => item.cantidad > max.cantidad ? item : max, datos[0]);
      // console.log('Día con más turnos:', this.mayorDia);
    } catch (error) {
      console.error('Error al obtener turnos por día:', error);
    }
  }

  async cargarTurnosFinalizadosPorMedico() {
    try {
      const datos = await this.informesService.getTurnosFinalizadosPorMedico(this.fechaDesde, this.fechaHasta);

      this.labelsFinalizadosMedico = datos.map(d => d.emailEspecialista);
      this.datasetsFinalizadosMedico = [{
        data: datos.map(d => d.cantidad),
        label: 'Turnos Finalizados',
        backgroundColor: '#dc3545',
        barThickness: 60,
      }];

      this.medicoConMasFinalizados = datos.reduce(
        (max, item) => item.cantidad > max.cantidad ? item : max,
        datos[0]
      );
    } catch (error) {
      console.error('Error al obtener turnos finalizados por médico:', error);
    }
  }

  async cargarTurnosConFiltro() {
    if (this.informeSeleccionado === 'medicoSolicitados') {
      const datos = await this.informesService.getTurnosSolicitadosPorMedico(this.fechaDesde, this.fechaHasta);
      this.labelsSolicitadosMedico = datos.map(d => `${d.emailEspecialista} (${d.especialidad})`);
      this.datasetsSolicitadosMedico = [{
        data: datos.map(d => d.cantidad),
        label: 'Turnos Solicitados',
        backgroundColor: '#0dcaf0',
        barThickness: 60,
      }];
    }
    else if (this.informeSeleccionado === 'medicoFinalizados') {
      const datos = await this.informesService.getTurnosFinalizadosPorMedico(this.fechaDesde, this.fechaHasta);
      this.labelsFinalizadosMedico = datos.map(d => `${d.emailEspecialista} (${d.especialidad})`);
      this.datasetsFinalizadosMedico = [{
        data: datos.map(d => d.cantidad),
        label: 'Turnos Finalizados',
        backgroundColor: '#dc3545',
        barThickness: 60,
      }];
    }
  }

  async cargarTurnosSolicitadosPorMedico() {
    try {
      const datos = await this.informesService.getTurnosSolicitadosPorMedico(this.fechaDesde,this.fechaHasta);

      this.labelsSolicitadosMedico = datos.map(d => d.emailEspecialista);
      this.datasetsSolicitadosMedico = [{
        data: datos.map(d => d.cantidad),
        label: 'Turnos Solicitados',
        backgroundColor: '#0dcaf0',
        barThickness: 60,
      }];

      this.medicoConMasSolicitados = datos.reduce(
        (max, item) => item.cantidad > max.cantidad ? item : max,
        datos[0]
      );
      // console.log('Médico con más turnos solicitados:', this.medicoConMasSolicitados);
    } catch (error) {
      console.error('Error al obtener turnos solicitados por médico:', error);
    }
  }

  async cargarLogs() {

    try {
      const datos = await this.informesService.getCantidadLogsPorDia();
      
      this.labelsLogs = datos.map(d => {
        const fecha = new Date(d.fechas);
        const [anio, mes, dia] = fecha.toISOString().split('T')[0].split('-');
        return `${dia}/${mes}/${anio}`;
      });
      this.datasetsLogs = [{
        data: datos.map(d => d.cantidad),
        label: 'Cantidad de Ingresos',
        backgroundColor: '#6f42c1',
        barThickness: 40
      }];
      
      this.diaConMasLogins = datos.reduce((max, item) => item.cantidad > max.cantidad ? item : max, datos[0]);
    } catch (error) {
      console.error('Error al cargar logs:', error);
    }
  }

  descargarPDFConGrafico() {
    let imgData: string | null = '';

    if (this.informeSeleccionado === 'especialidad' && this.graficoEspecialidad) {
      imgData = this.getCanvasImage(this.graficoEspecialidad);
    } else if (this.informeSeleccionado === 'dia' && this.graficoDia) {
      imgData = this.getCanvasImage(this.graficoDia);
    } else if (this.informeSeleccionado === 'medicoSolicitados' && this.graficoSolicitados) {
      imgData = this.getCanvasImage(this.graficoSolicitados);
    } else if (this.informeSeleccionado === 'medicoFinalizados' && this.graficoFinalizados) {
      imgData = this.getCanvasImage(this.graficoFinalizados);
    } else if (this.informeSeleccionado === 'log' && this.graficoLogs) {
      imgData = this.getCanvasImage(this.graficoLogs);
    }


    if (!imgData) {
      // alert('No se encontró el gráfico para exportar');
      return;
    }

    // Armar columnas y filas según el informe
    let columnas: string[] = [];
    let filas: any[][] = [];
    let titulo = '';
    let extraInfo: string = '';

    switch (this.informeSeleccionado) {
    case 'especialidad':
      titulo = 'Turnos por Especialidad';
      columnas = ['Especialidad', 'Cantidad'];
      filas = this.labelsEspecialidad.map((label, i) => [label, this.datasetsEspecialidad[0].data[i]]);
      if (this.datasetsEspecialidad[0]?.data?.length > 0) {
        const maxIndex = this.datasetsEspecialidad[0].data.indexOf(Math.max(...this.datasetsEspecialidad[0].data));
        extraInfo = `Especialidad con más turnos: ${this.labelsEspecialidad[maxIndex]} (${this.datasetsEspecialidad[0].data[maxIndex]})`;
      }
      break;

    case 'dia':
      titulo = 'Turnos por Día';
      columnas = ['Fecha', 'Cantidad'];
      filas = this.labelsPorDia.map((label, i) => [label, this.datasetsPorDia[0].data[i]]);
      if (this.mayorDia) {
        extraInfo = `Día con más turnos: ${this.mayorDia.fecha} (${this.mayorDia.cantidad})`;
      }
      break;

    case 'medicoSolicitados':
      titulo = 'Turnos Solicitados por Médico';
      columnas = ['Médico (Especialidad)', 'Cantidad'];
      filas = this.labelsSolicitadosMedico.map((label, i) => [label, this.datasetsSolicitadosMedico[0].data[i]]);
      if (this.medicoConMasSolicitados) {
        extraInfo = `Médico con más turnos solicitados: ${this.medicoConMasSolicitados.emailEspecialista} (${this.medicoConMasSolicitados.cantidad})`;
      }
      break;

    case 'medicoFinalizados':
      titulo = 'Turnos Finalizados por Médico';
      columnas = ['Médico (Especialidad)', 'Cantidad'];
      filas = this.labelsFinalizadosMedico.map((label, i) => [label, this.datasetsFinalizadosMedico[0].data[i]]);
      if (this.medicoConMasFinalizados) {
        extraInfo = `Médico con más turnos finalizados: ${this.medicoConMasFinalizados.emailEspecialista} (${this.medicoConMasFinalizados.cantidad})`;
      }
      break;

    case 'log':
      titulo = 'Informe de Ingresos';
      columnas = ['Fecha', 'Cantidad'];
      filas = this.labelsLogs.map((label, i) => [label, this.datasetsLogs[0].data[i]]);
      if (this.diaConMasLogins) {
        extraInfo = `Día con más ingresos: ${this.diaConMasLogins.fechas} (${this.diaConMasLogins.cantidad})`;
      }
      break;
  }

    this.informesService.generarPDFConGrafico(titulo, columnas, filas, imgData, extraInfo);
  }

  getCanvasImage(graficoRef: ElementRef<HTMLCanvasElement>): string | null {
    if (!graficoRef || !graficoRef.nativeElement) return null;
    return graficoRef.nativeElement.toDataURL('image/png');
  }

  descargarExcel() {
    let titulo = '';
    let columnas: string[] = [];
    let filas: any[][] = [];
    let imgData: string | null = null;

    switch (this.informeSeleccionado) {
      case 'especialidad':
        titulo = 'Turnos por Especialidad';
        columnas = ['Especialidad', 'Cantidad'];
        filas = this.labelsEspecialidad.map((label, i) => [label, this.datasetsEspecialidad[0].data[i]]);
        imgData = this.getCanvasImage(this.graficoEspecialidad);
        break;

      case 'dia':
        titulo = 'Turnos por Día';
        columnas = ['Fecha', 'Cantidad'];
        filas = this.labelsPorDia.map((label, i) => [label, this.datasetsPorDia[0].data[i]]);
        imgData = this.getCanvasImage(this.graficoDia);
        break;

      case 'medicoSolicitados':
        titulo = 'Turnos Solicitados por Médico';
        columnas = ['Email Médico', 'Cantidad'];
        filas = this.labelsSolicitadosMedico.map((label, i) => [label, this.datasetsSolicitadosMedico[0].data[i]]);
        imgData = this.getCanvasImage(this.graficoSolicitados);
        break;

      case 'medicoFinalizados':
        titulo = 'Turnos Finalizados por Médico';
        columnas = ['Email Médico', 'Cantidad'];
        filas = this.labelsFinalizadosMedico.map((label, i) => [label, this.datasetsFinalizadosMedico[0].data[i]]);
        imgData = this.getCanvasImage(this.graficoFinalizados);
        break;

      case 'log':
        titulo = 'Informe de Ingresos';
        columnas = ['Fecha', 'Cantidad'];
        filas = this.labelsLogs.map((label, i) => [label, this.datasetsLogs[0].data[i]]);
        imgData = this.getCanvasImage(this.graficoLogs);
        break;

      default:
        console.warn('No se seleccionó informe válido para Excel');
        return;
    }

    if (!imgData) {
      // Si no hay gráfico (imagen), llamá al método viejo sin gráfico
      this.informesService.generarExcel(titulo, columnas, filas);
    } else {
      // Con gráfico, llamá al método con ExcelJS
      this.informesService.generarExcelConGrafico(titulo, columnas, filas, imgData);
    }
  }

}
