import {ChangeDetectionStrategy, Component, signal, inject} from '@angular/core';
import {Router} from '@angular/router';
import {AuthService, db} from './auth.service';
import {ReactiveFormsModule, FormControl, Validators} from '@angular/forms';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-auth',
  imports: [ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-agri-bg flex flex-col font-sans relative overflow-hidden">
      <!-- Decorators -->
      <div class="absolute top-0 right-0 w-96 h-96 bg-agri-green/5 blur-[100px] rounded-full pointer-events-none"></div>
      <div class="absolute bottom-0 left-0 w-96 h-96 bg-agri-earth/5 blur-[100px] rounded-full pointer-events-none"></div>

      <!-- Header -->
      <header class="w-full px-4 md:px-6 py-5 flex items-center justify-between z-10 relative max-w-7xl mx-auto">
        <div class="flex items-center gap-3 cursor-pointer" (click)="router.navigate(['/'])">
          <div class="w-10 h-10 rounded-xl bg-agri-green flex items-center justify-center text-white shadow-md shadow-agri-green/20">
             <span class="material-icons-round text-2xl">eco</span>
          </div>
          <span class="font-display font-bold text-xl tracking-tight text-agri-dark">KivuShamba</span>
        </div>
      </header>
      
      <!-- Main Content -->
      <main class="flex-1 flex items-center justify-center px-4 z-10 relative">
        <div class="w-full max-w-md bg-white rounded-[2rem] shadow-xl shadow-agri-dark/5 p-8 md:p-10 border border-slate-100">
          <div class="text-center mb-8">
            <h1 class="font-display text-3xl font-bold text-agri-dark mb-3">Accès Espace Producteur</h1>
            <p class="text-slate-500 font-medium text-sm">Connectez-vous pour retrouver vos diagnostics et prévisions climatiques.</p>
          </div>

          <!-- Google Button -->
          <button (click)="loginGoogle()" [disabled]="isLoading()" class="w-full h-14 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-2xl flex items-center justify-center gap-3 font-bold text-slate-700 transition-all font-sans mb-8 disabled:opacity-60 disabled:hover:border-slate-200">
             @if (isLoading()) {
               <span class="material-icons-round animate-spin text-slate-400">refresh</span>
             } @else {
               <svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
               Continuer avec Google
             }
          </button>

          <div class="flex items-center gap-4 mb-8">
            <div class="h-px bg-slate-200 flex-1"></div>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ou accès direct (sans mot de passe)</span>
            <div class="h-px bg-slate-200 flex-1"></div>
          </div>

          <!-- Magic Link Form -->
          <div class="flex flex-col gap-4">
             <div>
               <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-2 ml-1">Adresse Email</label>
               <div class="relative">
                 <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <span class="material-icons-round text-slate-400 text-[20px]">mail</span>
                 </div>
                 <input [formControl]="emailControl" type="email" placeholder="votre@email.com" class="w-full h-14 bg-slate-50 border-2 border-slate-100 focus:border-agri-green focus:bg-white rounded-2xl pl-11 pr-4 outline-none transition-all font-medium text-agri-dark placeholder:text-slate-400" />
               </div>
             </div>
             
             <button [disabled]="emailControl.invalid || isEmailLoading() || emailSent()" (click)="sendMagicLink()" class="w-full h-14 bg-agri-dark hover:bg-agri-dark/90 disabled:opacity-50 disabled:hover:bg-agri-dark rounded-2xl flex items-center justify-center gap-2 font-bold text-white transition-all shadow-md">
                @if (isEmailLoading()) {
                  <span class="material-icons-round animate-spin text-white">refresh</span>
                } @else if (emailSent()) {
                  <span class="material-icons-round text-green-400">check_circle</span>
                  Lien magique envoyé !
                } @else {
                  Recevoir mon lien de connexion
                  <span class="material-icons-round text-white/50 text-[18px]">auto_awesome</span>
                }
             </button>
             @if (emailSent()) {
                <p class="text-center text-xs text-slate-500 font-medium px-2 mt-3 leading-relaxed">
                  Vérifiez votre boîte mail.<br/>Cliquez sur le lien pour vous connecter automatiquement.
                </p>
             }
          </div>
        </div>
      </main>
    </div>
  `
})
export class Auth {
  router = inject(Router);
  authService = inject(AuthService);
  
  isLoading = signal(false);
  isEmailLoading = signal(false);
  emailSent = signal(false);
  
  emailControl = new FormControl('', [Validators.required, Validators.email]);

  async loginGoogle() {
    this.isLoading.set(true);
    try {
      await this.authService.loginWithGoogle();
      
      // Wait a moment for the auth listener to fire and sync
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check if user already completed onboarding
      const user = this.authService.user();
      if (user) {
        const { getDoc, doc } = await import('firebase/firestore');
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        if (userSnap.exists() && userSnap.data()['onboardingComplete']) {
          this.router.navigate(['/app']); // Redirect to home/dashboard if already done
        } else {
          this.router.navigate(['/onboarding']);
        }
      }
    } catch (err) {
      console.error('Login failed', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async sendMagicLink() {
    if (this.emailControl.invalid) return;
    
    this.isEmailLoading.set(true);
    try {
      await this.authService.sendMagicLink(this.emailControl.value!);
      this.emailSent.set(true);
      this.emailControl.disable();
    } finally {
      this.isEmailLoading.set(false);
    }
  }
}
