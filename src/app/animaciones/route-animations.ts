import { trigger, transition, style, query, animate, group } from '@angular/animations';

export const routeAnimation = trigger('routeAnimation', [
  // Animación vertical entre perfil y horarios
  transition('perfil <=> horarios', [
    query(':enter, :leave', style({ position: 'absolute', width: '100%' }), { optional: true }),
    group([
      query(':enter', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('400ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ], { optional: true }),
      query(':leave', [
        animate('400ms ease-out', style({ transform: 'translateY(-100%)', opacity: 0 }))
      ], { optional: true })
    ])
  ]),

  // Animación para login: derecha a izquierda
  transition('* => login', [
    query(':enter, :leave', style({ position: 'absolute', width: '100%' }), { optional: true }),
    group([
      query(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('400ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ], { optional: true }),
      query(':leave', [
        animate('400ms ease-out', style({ transform: 'translateX(-100%)', opacity: 0 }))
      ], { optional: true })
    ])
  ]),

  // Animación general fallback (izquierda a derecha)
  transition('* <=> *', [
    query(':enter, :leave', style({ position: 'absolute', width: '100%' }), { optional: true }),
    group([
      query(':enter', [
        style({ transform: 'translateX(-100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ], { optional: true }),
      query(':leave', [
        animate('300ms ease-out', style({ transform: 'translateX(100%)', opacity: 0 }))
      ], { optional: true })
    ])
  ]),
]);
