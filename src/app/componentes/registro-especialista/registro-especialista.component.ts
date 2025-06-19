import { CommonModule, NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../service/auth/auth.service';
import { environment } from '../../../environments/environment';
import { createClient } from '@supabase/supabase-js';
import { LoadingService } from '../../service/loading/loading.service';

const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

@Component({
  selector: 'app-registro-especialista',
  standalone:true,
  imports: [NgFor,CommonModule,ReactiveFormsModule],
  templateUrl: './registro-especialista.component.html',
  styleUrl: './registro-especialista.component.scss'
})
export class RegistroEspecialistaComponent {
  especialistaForm: FormGroup;
  especialidadesDisponibles: string[] = [];
  foto: File | null = null;
  fotoInvalida: boolean = false;

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService, private toastr: ToastrService, private loadingService: LoadingService) {
    this.especialistaForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      especialidades: this.fb.array([this.fb.group({ valor: ['', Validators.required] })]),
      nuevaEspecialidad: [''],
      edad: ['', [Validators.required, Validators.min(18), Validators.max(99)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{7,}$/)]],
    });
  }

  ngOnInit() {
  this.fetchEspecialidades();
}

async fetchEspecialidades() {
  const { data, error } = await supabase
    .from('listaEspecialidades')
    .select('nombre');

  if (error) {
    console.error('Error al traer especialidades:', error.message);
    return;
  }

  this.especialidadesDisponibles = data.map((esp: any) => esp.nombre);
}

  get especialidadesForm(): FormArray {
  return this.especialistaForm.get('especialidades') as FormArray;
}

get especialidadesSeleccionadas(): string[] {
  return this.especialidadesForm.controls
    .map(ctrl => ctrl.get('valor')?.value)
    .filter((v: string) => v);
}

agregarEspecialidad() {
  this.especialidadesForm.push(this.fb.group({
    valor: ['', Validators.required]
  }));
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
    this.loadingService.show();  // Mostrar loading
  const formValue = this.especialistaForm.value;

  if (!this.foto) {
    this.toastr.error('Debes subir una foto de perfil.', 'Foto requerida');
    this.loadingService.hide();  
    return;
  }

  if (formValue.password.length < 6) {
    this.toastr.error('La contraseña debe tener al menos 6 caracteres.', 'Contraseña inválida');
    this.loadingService.hide();  
    return;
  }

  const { data, error } = await supabase.auth.signUp({
    email: formValue.email,
    password: formValue.password,
  });
  console.log('data:', data);
  console.log('error:', error);

  if (error) {
    if (error.message.includes('already registered') || error.message.includes('duplicate key')) {
      this.toastr.error('El correo ya está registrado. Probá con otro.', 'Correo duplicado');
    }
    else if(error.code === '23505') {
      this.toastr.error('El correo ya está registrado. Probá con otro.', 'Correo duplicado');
    }
     else {
      this.toastr.error('Ocurrió un error al registrarte.', 'Error');
    }
    console.error('Error al registrar:', error.message);
    this.loadingService.hide();  // Ocultar loading
    return;
  }

  if (data.user) {
    const userId = data.user.id;
    await this.saveUserData(formValue,userId);
  }
}


async saveUserData(formValue: any, authID: string) {
  const email = formValue.email;
  const fileExt = this.foto?.name.split('.').pop();
  const fileName = `${email.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;
  const filePath = `users/${fileName}`;

  // Subir imagen
  const { error: uploadError } = await supabase.storage
    .from('images')
    .upload(filePath, this.foto!, { upsert: true });

  if (uploadError) {
    console.error('Error al subir la imagen:', uploadError.message);
    this.toastr.error('No se pudo subir la imagen de perfil', 'Error');
    this.loadingService.hide();  
    return;
  }

  const { data: publicUrlData } = supabase
    .storage.from('images')
    .getPublicUrl(filePath);

  const especialista = {
    nombre: formValue.nombre,
    apellido: formValue.apellido,
    edad: formValue.edad,
    dni: formValue.dni,
    email: email,
    password: formValue.password,
    rol: 'especialista',
    fotoURL: publicUrlData.publicUrl,
    authid:authID
  };

  // Insertar en tabla especialista
  const { error: insertError } = await supabase
    .from('especialista')
    .insert([especialista]);

  if (insertError) {
    if(insertError.code === '23505'){
      this.toastr.error('El correo ya está registrado como especialista.', 'Correo duplicado');
    }else{
      this.toastr.error('Error al guardar los datos del especialista', 'Error');
    }
    console.error('Error al guardar especialista:', insertError.message);
    this.loadingService.hide();  
    return;
  }

  // Armar lista de especialidades elegidas + nueva si existe
  const especialidadesElegidas = formValue.especialidades.map((e: any) => e.valor);
  const nuevaEsp = formValue.nuevaEspecialidad?.trim();

  if (nuevaEsp) {
    especialidadesElegidas.push(nuevaEsp);
  }

  // Verificar duplicados
  const especialidadesUnicas = new Set(especialidadesElegidas);
  if (especialidadesUnicas.size !== especialidadesElegidas.length) {
    this.toastr.error('No se pueden repetir especialidades.', 'Error');
    this.loadingService.hide();  
    return;
  }

  // Insertar en tabla especialidad (todas)
  for (const especialidad of especialidadesElegidas) {
    const { error: espError } = await supabase
      .from('especialidad')
      .insert([{ email, especialidad }]);

    if (espError) {
      console.error('Error al guardar especialidad:', espError.message);
      this.loadingService.hide();  
    }
  }

  // Si hay nueva especialidad, insertarla en listaEspecialidad si no existe
  console.log(nuevaEsp);
  if (nuevaEsp) {
    console.log('entre');
    const { data: existente, error: checkError } = await supabase
      .from('listaEspecialidades')
      .select('nombre')
      .eq('nombre', nuevaEsp)
      .maybeSingle();

    if (!existente) {
  const { error: insertEspError } = await supabase
    .from('listaEspecialidades')
    .insert([{ nombre: nuevaEsp }]);

  if (insertEspError) {
    console.error('Error al agregar nueva especialidad a la lista:', insertEspError.message);
  }
}
  this.loadingService.hide();  // Ocultar loading
}
this.loadingService.hide();  // Ocultar loading
this.toastr.success('Usuario registrado exitosamente', '¡Éxito!');
this.router.navigate(['/home']);
}
}
