import { AsyncPipe, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './service/auth/auth.service';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLinkActive, RouterLink, NgIf, AsyncPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'hospital-app';
  menuOpen = false;

    constructor( private router: Router, private authService: AuthService) {}

    toggleMenu() {
      this.menuOpen = !this.menuOpen;
    }

    closeMenu() {
    this.menuOpen = false;
    }

    logout() {
      // this.authService.logout();
      this.router.navigate(['/home']);
    }
  }
