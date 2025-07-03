import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../service/auth/auth.service';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { LoadingService } from '../../service/loading/loading.service';
import { LoadingComponent } from '../loading/loading.component';
import { CommonModule } from '@angular/common';

const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule, LoadingComponent,CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email: string = '';
  password: string = '';

  constructor(
    private auth: AuthService,
    private toastr: ToastrService,
    private router: Router,
    public loadingService: LoadingService
  ) {}

  setCredentials(email: string, password: string) {
    this.email = email;
    this.password = password;
  }

  async login() {
    this.loadingService.show(); // ⏳ Mostrar spinner
    console.log('Email:', this.email);
    console.log('Password:', this.password);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: this.email,
      password: this.password
    });

    if (error) {
      this.toastr.error('Credenciales inválidas/mail no confirmado');
      this.loadingService.hide(); // ✅ Ocultar spinner siempre
      return;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
    this.toastr.error('No se pudo obtener información del usuario');
    this.loadingService.hide(); // ✅ Ocultar spinner siempre
    return;
    }

    const user = userData.user;
    console.log(userData.user);
    if (!user.email_confirmed_at) {
      console.log('toy entre');
      this.toastr.warning('Debés confirmar tu correo antes de ingresar');
      await supabase.auth.signOut(); // Para que no quede logueado
      this.loadingService.hide(); // ✅ Ocultar spinner siempre
      return;
    }
    const userEmail = this.email;

    const roles = ['admin', 'especialista', 'paciente'];

    let userFound = false;

    for (const tabla of roles) {
      const { data: usuarios, error } = await supabase
        .from(tabla)
        .select('*')
        .eq('email', userEmail)
        .maybeSingle();

      if (usuarios) {
        userFound = true;

        if (tabla === 'especialista' && usuarios.habilitado !== true) {
          this.toastr.error('El especialista no está habilitado por el administrador');
          await supabase.auth.signOut();
          this.loadingService.hide(); // ✅ Ocultar spinner siempre
          return;
        }

        this.toastr.success(`Bienvenido ${tabla}`);

        await supabase.from('logs').insert({
          usuario: user.email,
          fechas: new Date().toISOString()
        });

        this.loadingService.hide(); // ✅ Ocultar spinner siempre
        this.router.navigate(['/home']);
        return;
      }
    }

    if (!userFound) {
      this.toastr.error('El usuario no está registrado en ninguna tabla');
      this.loadingService.hide(); // ✅ Ocultar spinner siempre
      await supabase.auth.signOut();
    }
  }

}
