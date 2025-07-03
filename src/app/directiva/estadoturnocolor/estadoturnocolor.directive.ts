import { Directive, ElementRef, Input, OnChanges, Renderer2, RendererStyleFlags2, SimpleChanges } from '@angular/core';


@Directive({
  selector: '[appEstadoturnocolor]',
  standalone:true
})
export class EstadoturnocolorDirective {

   @Input('appEstadoturnocolor') estado: string | null = null;

  constructor(private el: ElementRef, private renderer: Renderer2) { }

  ngOnChanges(changes: SimpleChanges) {
      if ('estado' in changes) {
        this.setColor();
      }
    }

  private setColor() {
    // Primero, limpiar cualquier color previo
    console.log('Estado recibido en directiva:', this.estado);
    console.log(this.el.nativeElement.tagName);
    this.renderer.removeStyle(this.el.nativeElement, 'background-color');

    if (!this.estado) return;

    let color = '';

    switch (this.estado.toLowerCase()) {
      case 'cancelado':
        color = '#f8d7da';  // rojo claro
        break;
      case 'rechazado':
        color = '#f8d7da';  // rojo claro
        break;
      case 'realizado':
        color = '#d4edda';  // verde claro
        break;
      case 'aceptado':
        color = '#d1ecf1';  // celeste claro
        break;
      default:
        color = ''; // sin color o default
    }

    if (color) {
      setTimeout(() => {
        const celdas = this.el.nativeElement.querySelectorAll('td, th');
        celdas.forEach((celda: HTMLElement) => {
          this.renderer.setStyle(celda, 'background-color', color);
        });
      });
    }
  }
}
