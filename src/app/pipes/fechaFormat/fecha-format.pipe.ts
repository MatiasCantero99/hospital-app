import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fechaFormat',
  standalone:true
})
export class FechaFormatPipe implements PipeTransform {

  transform(fechaISO: string): string {
    if (!fechaISO) return '';

    const fecha = new Date(fechaISO + 'T00:00:00'); // Fuerza hora local

    const opcionesFecha: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };

    const fechaStr = fecha.toLocaleDateString('es-AR', opcionesFecha);

    return `${fechaStr}`;
  }

}
