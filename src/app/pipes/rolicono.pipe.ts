import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'rolicono',
  standalone:true
})
export class RoliconoPipe implements PipeTransform {

  transform(value: string): string {
    switch (value) {
      case 'administrador':
        return '👑 Administrador';
      case 'especialista':
        return '🩺 Especialista';
      case 'paciente':
        return '💊 Paciente';
      default:
        return value;
    }
  }

}
