import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-registro-paciente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule ],
  templateUrl: './registro-paciente.component.html',
  styleUrl: './registro-paciente.component.scss'
})
export class RegistroPacienteComponent {
  pacienteForm: FormGroup;
  foto: File | null = null;
  fotoInvalida: boolean = false;

  constructor(private fb: FormBuilder) {
    this.pacienteForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      edad: [null, [Validators.required, Validators.min(0)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
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

  onSubmit() {
    if (this.pacienteForm.valid) {
      console.log('Paciente registrado:', this.pacienteForm.value);

    }
  }
}
