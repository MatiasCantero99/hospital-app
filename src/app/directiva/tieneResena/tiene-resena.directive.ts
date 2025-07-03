import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appTieneResena]',
  standalone:true
})
export class TieneResenaDirective implements OnInit {

  @Input('appTieneResena') tieneResena: boolean = false;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    if (this.tieneResena) {
      this.renderer.setStyle(this.el.nativeElement, 'border-left', '5px solid gold');
    }
  }

}
