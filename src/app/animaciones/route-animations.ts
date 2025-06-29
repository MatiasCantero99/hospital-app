import { trigger, transition, style, query, animate, group } from '@angular/animations';

export const routeAnimations = trigger('routeAnimation', [
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
  ])
]);
