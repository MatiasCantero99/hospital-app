import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fechaFormat',
  standalone:true
})
export class FechaFormatPipe implements PipeTransform {

  transform(fechaISO: string): string {
    if (!fechaISO) return '';

    const fecha = new Date(fechaISO);

    const opcionesFecha: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };

    const opcionesHora: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Argentina/Buenos_Aires'
    };

    const fechaStr = fecha.toLocaleDateString('es-AR', opcionesFecha);
    const horaStr = fecha.toLocaleTimeString('es-AR', opcionesHora);

    return `${fechaStr} - ${horaStr} hs`;
  }

}
