import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { AuthService } from '../../service/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [NgIf],
  templateUrl: './mi-perfil.component.html',
  styleUrl: './mi-perfil.component.scss'
})
export class MiPerfilComponent implements OnInit {
  usuario: any = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.getUserData().subscribe(data => {
      this.usuario = data;
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/home']);
  }

  irAMisHorarios() {
  this.router.navigate(['/misHorarios']);
}
}
