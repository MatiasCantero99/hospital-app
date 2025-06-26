import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EspecialistaService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey)
   }

   async getEspecialistas() {
    const { data, error } = await this.supabase
      .from('especialista')
      .select('*');

    if (error) throw error;
    return data;
  }

  async toggleHabilitado(id: number, nuevoEstado: boolean) {
    const { error } = await this.supabase
      .from('especialista')
      .update({ habilitado: nuevoEstado })
      .eq('id', id);

    if (error) throw error;
  }

  async getEspecialidadesByEmail(email: string) {
    const { data, error } = await this.supabase
      .from('especialidad')
      .select('*')
      .eq('email', email);

    if (error) throw error;
    return data.map(e => e.especialidad);
  }
}
