import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoadingComponent } from '../loading/loading.component';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { LoadingService } from '../../service/loading/loading.service';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

@Component({
  selector: 'app-registro-admin',
  standalone:true,
  imports: [CommonModule, ReactiveFormsModule, LoadingComponent],
  templateUrl: './registro-admin.component.html',
  styleUrl: './registro-admin.component.scss'
})
export class RegistroAdminComponent {
  adminForm: FormGroup;
  foto: File | null = null;
  fotoInvalida: boolean = false;

  constructor(private fb: FormBuilder, private toastr: ToastrService, private router: Router, public loadingService: LoadingService) {
    this.adminForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      edad: [null, [Validators.required, Validators.min(18), Validators.max(99)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{7,}$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.foto = input.files[0];
      this.fotoInvalida = false;
    } else {
      this.foto = null;
      this.fotoInvalida = true;
    }
  }

  async register() {
    if (!this.foto) {
      this.toastr.error('Debes subir una foto de perfil.', 'Error');
      return;
    }

    this.loadingService.show();

    const formValue = this.adminForm.value;

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
    const ext = this.foto?.name.split('.').pop();
    const fileName = `${email.replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`;
    const filePath = `users/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, this.foto!, { upsert: true });

    if (uploadError) {
      console.error('Error al subir imagen:', uploadError.message);
      this.toastr.error('Error al subir la imagen', 'Error');
      this.loadingService.hide();
      return;
    }

    const { data: publicUrl } = supabase.storage.from('images').getPublicUrl(filePath);

    const admin = {
      nombre: formValue.nombre,
      apellido: formValue.apellido,
      edad: formValue.edad,
      dni: formValue.dni,
      email: formValue.email,
      password: formValue.password,
      rol: 'admin',
      fotoURL: publicUrl.publicUrl,
      authid: authID
    };

    const { error: insertError } = await supabase
      .from('admin')
      .insert([admin]);

    if (insertError) {
      this.toastr.error('Error al guardar administrador', 'Error');
      console.error('Error al guardar administrador:', insertError.message);
      this.loadingService.hide();
      return;
    }

    this.loadingService.hide();
    this.toastr.success('Administrador registrado exitosamente', '¡Éxito!');
    this.router.navigate(['/home']);
  }

}
