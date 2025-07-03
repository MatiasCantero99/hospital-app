import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PacientesService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey)
   }

   async getPacientes() {
    const { data, error } = await this.supabase
      .from('paciente')
      .select('*');
    if (error) throw error;
    return data;
  }

  async getPacienteByEmail(email: string) {
    const { data, error } = await this.supabase
      .from('paciente')
      .select('nombre, apellido')
      .eq('email', email)
      .single();

    if (error) throw error;
    return data;
  }

}
