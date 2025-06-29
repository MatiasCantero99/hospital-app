import { AsyncPipe, NgIf } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './service/auth/auth.service';
import { LoadingComponent } from './componentes/loading/loading.component';
import { trigger, transition, style, animate, query, group } from '@angular/animations';
import { routeAnimations } from './animaciones/route-animations';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLinkActive, RouterLink, NgIf, AsyncPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  animations: [routeAnimations]
})
export class AppComponent {
  title = 'hospital-app';
  menuOpen = false;

  prepareRoute(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation'];
  }

  constructor( private router: Router, public authService: AuthService, private cdr: ChangeDetectorRef) {
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/home']);
  }
}
