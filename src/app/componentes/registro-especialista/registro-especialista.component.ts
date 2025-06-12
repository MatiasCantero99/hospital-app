import { CommonModule, NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-registro-especialista',
  standalone:true,
  imports: [NgFor,CommonModule,ReactiveFormsModule],
  templateUrl: './registro-especialista.component.html',
  styleUrl: './registro-especialista.component.scss'
})
export class RegistroEspecialistaComponent {
  especialistaForm: FormGroup;
  especialidades = ['Cardiología', 'Pediatría', 'Traumatología', 'Neurología', 'Clínica médica'];

  constructor(private fb: FormBuilder) {
    this.especialistaForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      especialidad: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.especialistaForm.valid) {
      console.log('Especialista registrado:', this.especialistaForm.value);
    }
  }
}
