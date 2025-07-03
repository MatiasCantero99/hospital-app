import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'horarioAmPm'
})
export class HorarioAmPmPipe implements PipeTransform {

  transform(horario: string): string {
    const [hora, minuto] = horario.split(':').map(Number);
    const ampm = hora < 12 || (hora === 12 && minuto === 0) ? 'AM' : 'PM';
    const hora12 = hora % 12 === 0 ? 12 : hora % 12;
    return `${hora12}:${minuto.toString().padStart(2, '0')} ${ampm}`;
  }

}
