import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { EspecialistaService } from '../../service/especialista/especialista.service';
import { AsyncPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { LoadingService } from '../../service/loading/loading.service';
import { LoadingComponent } from '../loading/loading.component';

@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [NgFor, NgClass,NgIf, LoadingComponent,AsyncPipe],
  templateUrl: './usuario.component.html',
  styleUrl: './usuario.component.scss'
})
export class UsuarioComponent implements OnInit{
  especialistas: any[] = [];

  constructor (private especialistaService: EspecialistaService, public loadingService: LoadingService, private cdr: ChangeDetectorRef){}

  async ngOnInit() {
    await this.cargarEspecialistas();
  }

  async cargarEspecialistas() {
    this.loadingService.show();
    try {
      this.especialistas = await this.especialistaService.getEspecialistas();
    } catch (error) {
      console.error('Error al cargar especialistas:', error);
    }finally{
      this.loadingService.hide();
      // this.cdr.detectChanges()
    }
  }

  async cambiarEstado(especialista: any) {
    const nuevoEstado = !especialista.habilitado;
    try {
      await this.especialistaService.toggleHabilitado(especialista.id, nuevoEstado);
      especialista.habilitado = nuevoEstado; // actualiza visualmente
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  }

}
