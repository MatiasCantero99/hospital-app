import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../service/auth/auth.service'; // Ajustá el path si está en otro lugar
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';


export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastr = inject(ToastrService);

  return authService.getUserData().pipe(
    map((user: any) => {
  if (user && user.rol === 'administrador') {
    return true;
  } else {
    toastr.error('Acceso denegado. Solo para administradores.', 'Error');
    router.navigate(['/home']);
    return false;
  }
    }),
    catchError(() => {
      toastr.error('Error al validar el rol del usuario.', 'Error');
      router.navigate(['/home']);
      return of(false);
    })
  );
};
