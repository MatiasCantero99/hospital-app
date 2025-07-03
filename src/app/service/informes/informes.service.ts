import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class InformesService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
   }

   async getTurnosPorEspecialidad(): Promise<{ especialidad: string; cantidad: number }[]> {
    const { data, error } = await this.supabase
      .from('turnos')
      .select('especialidad', { count: 'exact', head: false });

    if (error) throw error;

    // Agrupar manualmente si vienen registros con especialidades repetidas
    const agrupado: Record<string, number> = {};

    data.forEach((t: any) => {
      const esp = t.especialidad || 'Sin definir';
      agrupado[esp] = (agrupado[esp] || 0) + 1;
    });

    return Object.entries(agrupado).map(([especialidad, cantidad]) => ({ especialidad, cantidad }));
  }

  async getTurnosPorDia(): Promise<{ fecha: string; cantidad: number }[]> {
    const { data, error } = await this.supabase
      .from('turnos')
      .select('fecha');

    if (error) throw error;

    const agrupado: Record<string, number> = {};

    data.forEach((t: any) => {
      const fecha = t.fecha?.split('T')[0] || 'Sin fecha';
      agrupado[fecha] = (agrupado[fecha] || 0) + 1;
    });

    return Object.entries(agrupado).map(([fecha, cantidad]) => ({ fecha, cantidad }));
  }

  async getTurnosFinalizadosPorMedico(desde: string, hasta: string) {
    const { data, error } = await this.supabase
      .from('turnos')
      .select('emailEspecialista, especialidad')
      .eq('estado', 'Realizado')
      .gte('fecha', desde)
      .lte('fecha', hasta);

    if (error) throw error;

    const agrupado: Record<string, { especialidad: string, cantidad: number }> = {};

    data.forEach((t: any) => {
      const key = t.emailEspecialista || 'Sin asignar';
      if (!agrupado[key]) {
        agrupado[key] = { especialidad: t.especialidad || 'Sin definir', cantidad: 0 };
      }
      agrupado[key].cantidad += 1;
    });

    return Object.entries(agrupado).map(([emailEspecialista, info]) => ({
      emailEspecialista,
      especialidad: info.especialidad,
      cantidad: info.cantidad
    }));
  }

  async getTurnosSolicitadosPorMedico(desde: string, hasta: string) {
    const { data, error } = await this.supabase
      .from('turnos')
      .select('emailEspecialista, especialidad, fecha')
      .gte('fecha', desde)
      .lte('fecha', hasta);

    if (error) throw error;

    const agrupado: Record<string, { [esp: string]: number }> = {};

    data.forEach((t: any) => {
      const email = t.emailEspecialista || 'Sin asignar';
      const esp = t.especialidad || 'Sin definir';

      if (!agrupado[esp]) agrupado[esp] = {};
      agrupado[esp][email] = (agrupado[esp][email] || 0) + 1;
    });

    // Resultado: lista por especialidad, con email y cantidad
    const resultado: { especialidad: string; emailEspecialista: string; cantidad: number }[] = [];

    for (const esp in agrupado) {
      const porEspecialista = agrupado[esp];
      const max = Object.entries(porEspecialista).reduce((a, b) => (b[1] > a[1] ? b : a));
      resultado.push({ especialidad: esp, emailEspecialista: max[0], cantidad: max[1] });
    }

    return resultado;
  }

  async getCantidadLogsPorDia(): Promise<{ fechas: string; cantidad: number }[]> {
    const { data, error } = await this.supabase
      .from('logs')
      .select('fechas');

    if (error) throw error;

    const agrupado: Record<string, number> = {};

    data.forEach((log: any) => {
      const soloFecha = log.fechas?.split('T')[0]; // YYYY-MM-DD
      if (soloFecha) {
        agrupado[soloFecha] = (agrupado[soloFecha] || 0) + 1;
      }
    });

    return Object.entries(agrupado).map(([fechas, cantidad]) => ({ fechas, cantidad }));
  }


  generarPDF(titulo: string, columnas: string[], filas: any[][]) {
    const doc = new jsPDF();

    const img = new Image();
    img.src = 'assets/img/logo.png';

    doc.addImage(img, 'PNG', 10, 10, 30, 30);
    doc.setFontSize(18);
    doc.text(titulo, 50, 20);
    doc.setFontSize(10);
    doc.text(`Emitido: ${new Date().toLocaleDateString()}`, 50, 28);

    autoTable(doc, {
      startY: 50,
      head: [columnas],
      body: filas,
    });

    doc.save(`${titulo.replace(/\s+/g, '_')}.pdf`);
  }

  generarPDFConGrafico(titulo: string, columnas: string[], filas: any[][], imgDataUrl: string, extraInfo?:string) {
    const doc = new jsPDF();

    // Logo
    const img = new Image();
    img.src = 'assets/img/logo.png';
    doc.addImage(img, 'PNG', 10, 10, 30, 30);

    doc.setFontSize(18);
    doc.text(titulo, 50, 20);
    doc.setFontSize(10);
    doc.text(`Emitido: ${new Date().toLocaleDateString()}`, 50, 28);

    // Insertar imagen del gráfico (ajustá posición y tamaño)
    doc.addImage(imgDataUrl, 'PNG', 10, 40, 190, 90);

    if (extraInfo) {
      doc.setFontSize(12);
      doc.setTextColor(40);
      doc.text(extraInfo, 10, 135);  // justo antes de la tabla
    }

    autoTable(doc, {
      startY: 140,
      head: [columnas],
      body: filas,
    });

    doc.save(`${titulo.replace(/\s+/g, '_')}.pdf`);
  }

  generarExcel(titulo: string, columnas: string[], filas: any[][]) {
    const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([columnas, ...filas]);
    const workbook: XLSX.WorkBook = { Sheets: { 'Informe': worksheet }, SheetNames: ['Informe'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `${titulo.replace(/\s+/g, '_')}.xlsx`);
  }

  async generarExcelConGrafico(titulo: string, columnas: string[], filas: any[][], imgDataUrl: string) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Informe');

    // Agregar encabezados
    worksheet.addRow(columnas);

    // Agregar filas de datos
    filas.forEach(fila => worksheet.addRow(fila));

    // Agregar imagen
    const imageId = workbook.addImage({
      base64: imgDataUrl,
      extension: 'png',
    });

    // Posicionar imagen debajo de los datos (por ejemplo desde fila filas.length + 3, columna 1)
    worksheet.addImage(imageId, {
      tl: { col: 0, row: filas.length + 2 },  // top-left (col y row comienzan en 0)
      ext: { width: 500, height: 300 },       // tamaño en px (ajustar a gusto)
    });

    // Ajuste ancho columnas (opcional)
    columnas.forEach((col, index) => {
      worksheet.getColumn(index + 1).width = 20;
    });

    // Generar buffer y descargar
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${titulo.replace(/\s+/g, '_')}.xlsx`);
  }
}

