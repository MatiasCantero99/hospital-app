import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey)
   }

   async getAdministradores() {
    const { data, error } = await this.supabase
      .from('admin')
      .select('*');
    if (error) throw error;
    return data;
  }
}
