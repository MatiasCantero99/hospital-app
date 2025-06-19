import { AsyncPipe, NgIf } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './service/auth/auth.service';
import { LoadingComponent } from './componentes/loading/loading.component';
import { LoadingService } from './service/loading/loading.service';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLinkActive, RouterLink, NgIf, AsyncPipe,LoadingComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'hospital-app';
  menuOpen = false;

    constructor( private router: Router, public authService: AuthService, public loadingService: LoadingService, private cdr: ChangeDetectorRef) {
  //     setTimeout(() => this.loadingService.show(), 10000);
  // setTimeout(() => this.loadingService.hide(), 50000);
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
