import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { from, of, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private supabase: SupabaseClient;
  public isLoggedIn$ = new BehaviorSubject<boolean>(false);
  public currentUser$ = new BehaviorSubject<any>(null);
  public currentUserRole$ = new BehaviorSubject<string | null>(null);

  constructor() { 
    this.supabase = createClient(environment.supabaseUrl,environment.supabaseKey);
    this.checkSession();
  }

  async checkSession() {
    const { data: { session } } = await this.supabase.auth.getSession();
    this.isLoggedIn$.next(!!session);

    if (session?.user) {
    this.currentUser$.next(session.user);
    this.getUserData().subscribe(userData => {
    const rol = userData?.rol ?? null;
    this.currentUserRole$.next(rol);
  });
  }

    this.supabase.auth.onAuthStateChange((event, session) => {
      // console.log('Cambio de sesión:', event, session);
      this.isLoggedIn$.next(!!session);
      this.currentUser$.next(session?.user ?? null);
    });
  }


  async logout() {
    console.log('hola');
    try {
      await this.supabase.auth.signOut();
      localStorage.clear();
      this.isLoggedIn$.next(false); 
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error.message);
    }
  }

  getUserData(): Observable<any> {
    return from(this.supabase.auth.getUser()).pipe(
      switchMap(({ data }) => {
        const email = data?.user?.email;
        if (!email) return of(null);

        // Intenta buscar en 'administrador'
        return from(this.supabase
          .from('admin')
          .select('*')
          .eq('email', email)
          .maybeSingle()
        ).pipe(
          switchMap(result => {
            if (result.data) return of(result.data);

            // Si no está en 'administrador', buscar en 'especialista'
            return from(this.supabase
              .from('especialista')
              .select('*')
              .eq('email', email)
              .single()
            ).pipe(
              switchMap(result => {
                if (result.data) return of(result.data);

                // Si no está en 'especialista', buscar en 'paciente'
                return from(this.supabase
                  .from('paciente')
                  .select('*')
                  .eq('email', email)
                  .single()
                ).pipe(
                  switchMap(result => of(result.data || null))
                );
              })
            );
          })
        );
      })
    );
  }

  getSupabase(): SupabaseClient {
    return this.supabase;
  }

}
