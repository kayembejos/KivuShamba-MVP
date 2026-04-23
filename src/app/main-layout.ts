import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-screen bg-agri-bg relative font-sans text-agri-dark overflow-hidden">
      
      <!-- Side Navigation (Desktop/Tablet) -->
      <aside [class]="'hidden md:flex flex-col w-72 bg-white border-r border-slate-100 transition-all duration-300 z-30 ' + (isSidebarCollapsed() ? 'w-20' : 'w-72')">
        <div class="h-20 flex items-center px-6 gap-3 border-b border-slate-50">
          <div class="w-10 h-10 rounded-xl bg-agri-green flex items-center justify-center text-white shadow-lg shadow-agri-green/20 shrink-0">
            <span class="material-icons-round text-2xl">eco</span>
          </div>
          @if (!isSidebarCollapsed()) {
            <span class="font-display font-bold text-xl tracking-tight animate-in fade-in duration-300">KivuShamba</span>
          }
        </div>

        <nav class="flex-1 p-4 space-y-2">
          @for (item of navItems; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="bg-agri-green/10 text-agri-green shadow-sm" [routerLinkActiveOptions]="{exact: true}" 
               class="flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all hover:bg-slate-50 group">
              <span class="material-icons-round text-[22px] group-hover:scale-110 transition-transform">{{ item.icon }}</span>
              @if (!isSidebarCollapsed()) {
                <span class="text-sm animate-in fade-in slide-in-from-left-2 duration-300">{{ item.label }}</span>
              }
            </a>
          }
        </nav>

        <div class="p-4 border-t border-slate-50">
          <button (click)="isSidebarCollapsed.set(!isSidebarCollapsed())" 
                  class="flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-all">
            <span class="material-icons-round transition-transform" [style.transform]="isSidebarCollapsed() ? 'rotate(180deg)' : 'none'">chevron_left</span>
            @if (!isSidebarCollapsed()) {
              <span class="text-sm font-bold">Réduire le menu</span>
            }
          </button>
        </div>
      </aside>

      <!-- Main Shell Area -->
      <div class="flex-1 flex flex-col min-w-0 bg-agri-bg relative">
        
        <!-- Top Toolbar -->
        <header class="h-16 md:h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 z-20 shrink-0 sticky top-0">
          <div class="flex items-center gap-4">
            <div class="md:hidden w-8 h-8 rounded-lg bg-agri-green flex items-center justify-center text-white shadow-md">
              <span class="material-icons-round text-lg">eco</span>
            </div>
            <div>
              <h1 class="text-lg md:text-xl font-display font-bold text-agri-dark tracking-tight">{{ currentViewTitle() }}</h1>
              <div class="flex items-center gap-1.5 mt-0.5">
                <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span class="text-[9px] font-black uppercase tracking-widest text-slate-400">Mode Connecté</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3">
             <button class="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 transition-colors relative">
               <span class="material-icons-round text-[20px]">notifications_none</span>
               <div class="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-agri-earth ring-2 ring-white"></div>
             </button>
             <div class="flex items-center gap-3 pl-2 border-l border-slate-100">
                <div class="hidden sm:block text-right">
                  <p class="text-xs font-bold text-agri-dark line-clamp-1">{{ auth.user()?.displayName || 'Producteur' }}</p>
                  <p class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Membre Coopérative</p>
                </div>
                <div class="w-10 h-10 rounded-xl bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 ring-agri-green transition-all" (click)="router.navigate(['/auth'])">
                   <span class="material-icons-round text-slate-300 text-2xl">account_circle</span>
                </div>
             </div>
          </div>
        </header>

        <!-- Dynamic Content -->
        <main class="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-10 pb-32 md:pb-10 scroll-smooth">
          <router-outlet />
        </main>

        <!-- Bottom Navigation (Mobile Only) -->
        <nav class="md:hidden fixed bottom-6 left-6 right-6 h-20 bg-agri-dark/95 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-agri-dark/40 flex items-center justify-around px-2 z-40 border border-white/5">
          @for (item of navItems; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="bg-white/10 text-agri-green scale-110 !shadow-none" [routerLinkActiveOptions]="{exact: true}" 
               class="flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-2xl text-white/50 transition-all duration-300">
              <span class="material-icons-round text-[22px]">{{ item.icon }}</span>
              <span class="text-[8px] font-black uppercase tracking-[0.1em]">{{ item.label.split(' ')[0] }}</span>
            </a>
          }
        </nav>
      </div>

    </div>
  `
})
export class MainLayout {
  auth = inject(AuthService);
  router = inject(Router);
  
  isSidebarCollapsed = signal(false);

  navItems = [
    { path: '/app', icon: 'dashboard', label: 'Dashboard' },
    { path: '/app/scan', icon: 'photo_camera', label: 'Diagnostic IA' },
    { path: '/app/plan', icon: 'agriculture', label: 'Plan de Campagne' },
    { path: '/app/tracking', icon: 'payments', label: 'Suivi Dépenses' },
    { path: '/app/resilience', icon: 'shield_moon', label: 'Résilience' }
  ];

  currentViewTitle = signal('Conseil IA');

  constructor() {
    // Basic reactive title update based on router URL
    this.router.events.subscribe(() => {
      const currentLabel = this.navItems.find(i => this.router.url === i.path)?.label;
      if (currentLabel) this.currentViewTitle.set(currentLabel);
    });
  }
}
