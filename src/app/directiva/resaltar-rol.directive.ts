import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[appResaltarRol]',
  standalone:true
})
export class ResaltarRolDirective implements OnInit {
  @Input('appResaltarRol') rol: string = '';

  constructor(private el: ElementRef) { }

  ngOnInit() {
    let backgroundColor = '';
    let textColor = '#000';
    switch (this.rol) {
      case 'administrador':
        backgroundColor = '#ffe5cc'; // crema anaranjado claro
        break;
      case 'especialista':
        backgroundColor = '#e0f7fa'; // celeste muy suave
        break;
      case 'paciente':
        backgroundColor = '#f1f8e9'; // verde muy claro
        break;
      default:
        backgroundColor = '#f5f5f5'; // gris claro
    }
    this.el.nativeElement.style.backgroundColor = backgroundColor;
  this.el.nativeElement.style.color = textColor;
  this.el.nativeElement.style.fontWeight = 'bold';

  }
}
