import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { LoadingService } from '../../service/loading/loading.service';
import { createClient } from '@supabase/supabase-js';
import { LoadingComponent } from '../loading/loading.component';

const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
declare var grecaptcha: any;

@Component({
  selector: 'app-registro-paciente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingComponent ],
  templateUrl: './registro-paciente.component.html',
  styleUrl: './registro-paciente.component.scss'
})
export class RegistroPacienteComponent {
  pacienteForm: FormGroup;
  foto: File | null = null;
  fotoExtra: File | null = null;
  fotoInvalida: boolean = false;
  fotoExtraInvalida: boolean = false;

  captchaResuelto: boolean = false;
  captchaToken: string | null = null;

  constructor(private fb: FormBuilder, private toastr: ToastrService, private router: Router, public loadingService: LoadingService) {
    this.pacienteForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      edad: [null, [Validators.required, Validators.min(0)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{7,}$/)]],
      obraSocial: ['', Validators.required],
    });
  }

  ngAfterViewInit() {
    const intentarRenderCaptcha = () => {
      if (typeof grecaptcha !== 'undefined') {
        grecaptcha.ready(() => {
          grecaptcha.render('captcha-element', {
            sitekey: '6LeCC2grAAAAAEm06GhsjfxCv9WPxpk9raD8NT-X',
            callback: (token: string) => this.onCaptchaResolved(token)
          });
        });
      } else {
        setTimeout(intentarRenderCaptcha, 500);
      }
    };

    intentarRenderCaptcha();
  }

  onCaptchaResolved(token: string) {
    this.captchaResuelto = true;
    this.captchaToken = token;
  }

  onFileChange(event: Event, tipo: 'foto' | 'fotoExtra'): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      if (tipo === 'foto') {
        this.foto = input.files[0];
        this.fotoInvalida = false;
      } else {
        this.fotoExtra = input.files[0];
        this.fotoExtraInvalida = false;
      }
    } else {
      if (tipo === 'foto') {
        this.foto = null;
        this.fotoInvalida = true;
      } else {
        this.fotoExtra = null;
        this.fotoExtraInvalida = true;
      }
    }
  }

  async register() {
    if (!this.foto) {
      this.toastr.error('Debes subir una foto de perfil.', 'Error');
      return;
    }

    if (!this.fotoExtra) {
      this.toastr.error('Debes subir una foto adicional.', 'Error');
      return;
    }

    this.loadingService.show();

    const formValue = this.pacienteForm.value;

    const { data, error } = await supabase.auth.signUp({
      email: formValue.email,
      password: formValue.password,
    });

    if (error) {
      this.toastr.error('Error al registrar usuario', 'Error');
      console.error('Supabase error:', error.message);
      this.loadingService.hide();
      return;
    }

    if (data.user) {
      const userId = data.user.id;
      await this.saveUserData(formValue, userId);
    }
  }

  async saveUserData(formValue: any, authID: string) {
    const email = formValue.email;

    const ext1 = this.foto?.name.split('.').pop();
    const ext2 = this.fotoExtra?.name.split('.').pop();

    const fileName1 = `${email.replace(/[^a-zA-Z0-9]/g, '_')}_1.${ext1}`;
    const fileName2 = `${email.replace(/[^a-zA-Z0-9]/g, '_')}_2.${ext2}`;

    const filePath1 = `users/${fileName1}`;
    const filePath2 = `users/${fileName2}`;

    const { error: uploadError1 } = await supabase.storage
      .from('images')
      .upload(filePath1, this.foto!, { upsert: true });

    const { error: uploadError2 } = await supabase.storage
      .from('images')
      .upload(filePath2, this.fotoExtra!, { upsert: true });

    if (uploadError1 || uploadError2) {
      console.error('Error al subir imágenes:', uploadError1?.message, uploadError2?.message);
      this.toastr.error('Error al subir las imágenes', 'Error');
      this.loadingService.hide();
      return;
    }

    const { data: publicUrl1 } = supabase.storage.from('images').getPublicUrl(filePath1);
    const { data: publicUrl2 } = supabase.storage.from('images').getPublicUrl(filePath2);

    const paciente = {
      nombre: formValue.nombre,
      apellido: formValue.apellido,
      edad: formValue.edad,
      dni: formValue.dni,
      email: formValue.email,
      password: formValue.password,
      rol: 'paciente',
      obraSocial: formValue.obraSocial,
      fotoURL: publicUrl1.publicUrl,
      fotoURL1: publicUrl2.publicUrl,
      authid: authID
    };

    const { error: insertError } = await supabase
      .from('paciente')
      .insert([paciente]);

    if (insertError) {
      this.toastr.error('Error al guardar paciente', 'Error');
      console.error('Error al guardar paciente:', insertError.message);
      this.loadingService.hide();
      return;
    }

    this.loadingService.hide();
    this.toastr.success('Paciente registrado exitosamente', '¡Éxito!');
    this.router.navigate(['/home']);
  }
}
