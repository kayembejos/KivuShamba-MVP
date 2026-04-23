import { ChangeDetectionStrategy, Component, inject, signal, computed, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, db } from './auth.service';
import { AiAdvisoryService } from './ai-advisory.service';
import { onSnapshot, doc, collection, query, orderBy, limit, Unsubscribe, addDoc } from 'firebase/firestore';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <!-- AI Action Banner -->
      <div class="bg-gradient-to-br from-agri-green to-emerald-700 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-agri-green/20">
        <div class="flex flex-col gap-2 text-center md:text-left">
          <h2 class="text-2xl font-display font-black tracking-tight leading-none">Diagnostic Instantané</h2>
          <p class="text-sm text-emerald-100 font-medium max-w-sm">Utilisez l'IA pour identifier une maladie ou un ravageur en prenant une simple photo.</p>
        </div>
        <a routerLink="/app/scan" class="w-full md:w-auto bg-white text-agri-green px-8 py-4 rounded-2xl font-black text-sm shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
          <span class="material-icons-round">photo_camera</span>
          SCANNER LE CHAMP
        </a>
      </div>

      <!-- Top Section: Campaign Status & KPIs -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Campaign Card -->
        <div class="lg:col-span-2 bg-[#1B4332] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-agri-green/10">
          <div class="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          <div class="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div class="flex items-center gap-3 mb-6">
                <span class="text-[10px] font-black uppercase tracking-[0.2em] bg-white/10 px-3 py-1 rounded-full">Saison En Cours</span>
                <div class="px-3 py-1 rounded-full bg-agri-earth/20 border border-agri-earth/20 text-[10px] font-black uppercase tracking-widest text-agri-earth">Phase : Semis</div>
              </div>
              <h3 class="text-slate-300 font-bold text-sm mb-1 uppercase tracking-widest">Trésorerie de Campagne</h3>
              <div class="flex items-baseline gap-3 mb-4">
                <span class="text-4xl md:text-5xl font-display font-black tracking-tighter">{{ remainingBudget().toLocaleString() }}</span>
                <span class="text-xl font-bold text-slate-400">CFA</span>
              </div>
            </div>
            
            <div class="space-y-4 pt-10">
              <div class="flex justify-between items-end mb-2">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Budget consommé</span>
                <span class="text-lg font-black">{{ investmentRate() }}%</span>
              </div>
              <div class="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div class="h-full bg-agri-green transition-all duration-1000" [style.width.%]="investmentRate()"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Resilience & Alerts -->
        <div class="flex flex-col gap-6">
          <div class="flex-1 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <h3 class="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-4">Capacité de Résilience</h3>
              <div class="flex items-baseline gap-2 mb-2">
                <span class="text-3xl font-display font-black text-agri-dark">{{ resilienceCapacity().toLocaleString() }}</span>
                <span class="text-sm font-bold text-slate-400">CFA</span>
              </div>
              <p class="text-xs text-slate-500 font-medium leading-relaxed">Fonds sécurisés après déduction des besoins vitaux du foyer.</p>
            </div>
            <div class="mt-8">
               <button class="w-full py-4 bg-slate-50 text-agri-dark rounded-2xl font-bold text-xs hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                 Détails de Résilience
                 <span class="material-icons-round text-sm">trending_up</span>
               </button>
            </div>
          </div>
          
          <!-- Quick KPIs -->
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-agri-green text-white p-6 rounded-3xl shadow-lg shadow-agri-green/20">
               <span class="material-icons-round text-white/50 mb-3">account_balance_wallet</span>
               <p class="text-[9px] font-black uppercase tracking-widest text-white/60 mb-1">Total Campagne</p>
               <p class="text-lg font-black leading-none">{{ totalBudget().toLocaleString() }}</p>
            </div>
            <div class="bg-agri-dark text-white p-6 rounded-3xl shadow-lg shadow-agri-dark/20">
               <span class="material-icons-round text-white/50 mb-3">payments</span>
               <p class="text-[9px] font-black uppercase tracking-widest text-white/60 mb-1">Total Investi</p>
               <p class="text-lg font-black leading-none">{{ totalSpent().toLocaleString() }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Middle Section: Alerts & Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <!-- Alerts Side -->
        <div class="lg:col-span-5 space-y-4">
          <h4 class="text-xs font-black uppercase tracking-[0.2em] text-slate-400 px-2">Alertes IA Stratégiques</h4>
          
          @if (budgetStress()) {
            <div class="bg-amber-50 border border-amber-100 p-6 rounded-[2rem] flex gap-4 animate-in zoom-in duration-300">
              <div class="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                <span class="material-icons-round">warning</span>
              </div>
              <div>
                <h5 class="font-bold text-amber-900 text-sm mb-1 leading-tight">Attention, Stress Budgétaire</h5>
                <p class="text-xs text-amber-700/80 font-medium leading-relaxed">Fonds limités pour la phase de stockage. Plus de 80% du budget consommé avant la récolte.</p>
              </div>
            </div>
          }

          @if (protectionAlert()) {
            <div class="bg-red-50 border border-red-100 p-6 rounded-[2rem] flex gap-4 animate-in zoom-in duration-300">
              <div class="w-12 h-12 rounded-2xl bg-red-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-red-500/20">
                <span class="material-icons-round">gpp_maybe</span>
              </div>
              <div>
                <h5 class="font-bold text-red-900 text-sm mb-1 leading-tight">Alerte Critique : Protection</h5>
                <p class="text-xs text-red-700/80 font-medium leading-relaxed">Risque élevé de ravageurs. Aucune dépense de protection enregistrée. Protégez votre champ maintenant.</p>
              </div>
            </div>
          }

          <div class="bg-blue-50 border border-blue-100 p-6 rounded-[2rem] flex gap-4 animate-in zoom-in duration-300">
            <div class="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
              <span class="material-icons-round">lightbulb</span>
            </div>
            <div>
              <h5 class="font-bold text-blue-900 text-sm mb-1 leading-tight">Suggestion d'Amélioration</h5>
              <p class="text-xs text-blue-700/80 font-medium leading-relaxed">Opportunité : Investissez dans un stockage hermétique pour mieux vendre plus tard car votre trésorerie est stable.</p>
            </div>
          </div>
        </div>

        <!-- Predictive Line Chart -->
        <div class="lg:col-span-7 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col">
          <div class="flex justify-between items-start mb-8">
            <div>
              <h3 class="text-agri-dark font-display font-bold text-xl tracking-tight">Rendement Prédictif</h3>
              <p class="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Évolution des Dépenses vs Moyenne</p>
            </div>
            <div class="flex gap-4">
              <div class="flex items-center gap-1.5">
                <div class="w-2 h-2 rounded-full bg-agri-green"></div>
                <span class="text-[9px] font-black uppercase text-slate-400 tracking-widest">Ma Saison</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="w-2 h-2 rounded-full bg-slate-200"></div>
                <span class="text-[9px] font-black uppercase text-slate-400 tracking-widest">Moyenne Région</span>
              </div>
            </div>
          </div>

          <!-- Simple SVG Graph -->
          <div class="flex-1 relative min-h-[200px]">
             <svg class="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
               <!-- Grid lines -->
               <line x1="0" y1="40" x2="400" y2="40" stroke="#f1f5f9" stroke-width="1" />
               <line x1="0" y1="80" x2="400" y2="80" stroke="#f1f5f9" stroke-width="1" />
               <line x1="0" y1="120" x2="400" y2="120" stroke="#f1f5f9" stroke-width="1" />
               <line x1="0" y1="160" x2="400" y2="160" stroke="#f1f5f9" stroke-width="1" />
               
               <!-- Moyenne Region Path -->
               <path d="M0,180 L80,165 L160,140 L240,110 L320,80 L400,60" fill="none" stroke="#e2e8f0" stroke-width="3" stroke-dasharray="8 4" stroke-linecap="round" />
               
               <!-- My Season Path -->
               <path [attr.d]="chartPath()" fill="none" stroke="#1B4332" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" class="animate-in fade-in duration-1000" />
               
               <!-- Points -->
               @for (p of chartPoints(); track p.x) {
                 <circle [attr.cx]="p.x" [attr.cy]="p.y" r="5" fill="#1B4332" stroke="white" stroke-width="2" class="cursor-pointer hover:scale-150 transition-transform" />
               }
             </svg>
          </div>
          
          <div class="flex justify-between mt-4">
             <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Semis</span>
             <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Croissance</span>
             <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Récolte</span>
          </div>
        </div>
      </div>

      <!-- Bottom Section: Cost Nature & Journal -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">
        
        <!-- Cost Nature Summary -->
        <div class="lg:col-span-4 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
           <h3 class="text-agri-dark font-display font-bold text-xl tracking-tight mb-8">Nature de Coût</h3>
           <div class="space-y-6">
              @for (cat of costSummary(); track cat.id) {
                <div class="space-y-2">
                   <div class="flex justify-between items-center px-1">
                      <div class="flex items-center gap-2">
                         <div [class]="'w-2 h-2 rounded-full ' + cat.color"></div>
                         <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{{ cat.label }}</span>
                      </div>
                      <span class="text-xs font-bold text-agri-dark">{{ cat.percent }}%</span>
                   </div>
                   <div class="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                      <div class="h-full transition-all duration-700" [class]="cat.color" [style.width.%]="cat.percent"></div>
                   </div>
                </div>
              }
           </div>
        </div>

        <!-- Activity Journal -->
        <div class="lg:col-span-8 bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col">
          <div class="flex justify-between items-center mb-8">
            <h3 class="text-agri-dark font-display font-bold text-xl tracking-tight">Journal d'Activité</h3>
            <button class="text-[10px] font-black uppercase text-agri-green tracking-widest hover:underline">Tout voir</button>
          </div>
          
          <div class="flex-1 space-y-4">
             @for (tx of transactions(); track tx.id) {
                <div class="flex items-center gap-4 p-4 rounded-3xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                   <div class="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:shadow-md transition-all">
                      <span class="material-icons-round">{{ getCategoryIcon(tx.category) }}</span>
                   </div>
                   <div class="flex-1">
                      <h5 class="font-bold text-agri-dark text-sm">{{ tx.description || 'Dépense anonyme' }}</h5>
                      <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ tx.date | date:'dd MMM yyyy HH:mm' }}</p>
                   </div>
                   <div class="text-right">
                      <p class="text-sm font-black text-agri-dark">- {{ tx.amount.toLocaleString() }} CFA</p>
                      <span class="text-[9px] font-black text-slate-300 uppercase tracking-widest">{{ tx.category }}</span>
                   </div>
                </div>
             } @empty {
                <div class="flex-1 flex flex-col items-center justify-center text-center p-12">
                   <div class="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mb-4">
                      <span class="material-icons-round text-3xl">receipt_long</span>
                   </div>
                   <p class="text-slate-400 font-medium italic">Aucune transaction enregistrée cette saison.</p>
                </div>
             }
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardShell implements OnDestroy {
  authService = inject(AuthService);
  
  userProfile = signal<any>(null);
  transactions = signal<any[]>([]);
  
  private subs: Unsubscribe[] = [];

  constructor() {
    effect(() => {
      const user = this.authService.user();
      if (user) {
        this.initData(user.uid);
      }
    });
  }

  ngOnDestroy() {
    this.subs.forEach(s => s());
  }

  private initData(userId: string) {
    // Sync User Profile
    const userSub = onSnapshot(doc(db, 'users', userId), (snap) => {
      if (snap.exists()) {
        this.userProfile.set(snap.data());
      }
    });
    this.subs.push(userSub);

    // Sync Transactions (Last 5)
    const txQuery = query(collection(db, 'users', userId, 'transactions'), orderBy('date', 'desc'), limit(5));
    const txSub = onSnapshot(txQuery, (snap) => {
      this.transactions.set(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    this.subs.push(txSub);
  }

  totalBudget = computed(() => this.userProfile()?.campaignBudget || 1);
  
  totalSpent = computed(() => {
    // On pourrait synchroniser toutes les dépenses ou avoir un champ calculé
    // Ici on simule une agrégation ou on utilise les 5 dernières pour l'exemple
    // Dans une vraie app, on utiliserait une agrégation Firestore.
    // Simulons une dépense basée sur les transactions affichées pour l'exercice.
    const txs = this.transactions();
    return txs.reduce((acc, current) => acc + current.amount, 0);
  });

  remainingBudget = computed(() => this.totalBudget() - this.totalSpent());
  investmentRate = computed(() => Math.round((this.totalSpent() / this.totalBudget()) * 100));
  
  resilienceCapacity = computed(() => {
    const remaining = this.remainingBudget();
    const vitals = Math.floor(this.totalBudget() * 0.3); // Simulation : 30% du budget total réservé au foyer
    return Math.max(0, remaining - vitals);
  });

  budgetStress = computed(() => this.investmentRate() > 80);
  
  protectionAlert = computed(() => {
    const hasProtection = this.transactions().some(t => t.category === 'protection');
    return !hasProtection && this.totalSpent() > 0;
  });

  costMapping = [
     { id: 'seeds', label: 'Production', color: 'bg-agri-green' },
     { id: 'soil', label: 'Sol & Engrais', color: 'bg-emerald-400' },
     { id: 'protection', label: 'Protection', color: 'bg-red-400' },
     { id: 'labor', label: 'Main d\'œuvre', color: 'bg-agri-earth' },
     { id: 'logistics', label: 'Logistique', color: 'bg-slate-400' }
  ];

  costSummary = computed(() => {
    const txs = this.transactions();
    const total = this.totalSpent() || 1;
    
    return this.costMapping.map(c => {
      const sum = txs.filter(t => t.category === c.id).reduce((a, b) => a + b.amount, 0);
      return {
        ...c,
        percent: Math.round((sum / total) * 100)
      };
    });
  });

  // Chart Logic
  chartPoints = computed(() => {
    const rate = this.investmentRate();
    // Simulate progression based on rate
    const points = [
      { x: 0, y: 180 },
      { x: 100, y: 180 - (rate * 0.5) },
      { x: 200, y: 180 - (rate * 0.8) },
      { x: 300, y: 180 - (rate * 1.2) },
      { x: 400, y: 180 - (rate * 1.5) }
    ];
    return points.filter((_, i) => i <= Math.floor(rate / 20) + 1);
  });

  chartPath = computed(() => {
    const pts = this.chartPoints();
    if (pts.length < 2) return '';
    return `M${pts.map(p => `${p.x},${p.y}`).join(' L')}`;
  });

  getCategoryIcon(cat: string) {
    switch (cat) {
      case 'seeds': return 'grass';
      case 'soil': return 'layers';
      case 'protection': return 'sanitizer';
      case 'labor': return 'group';
      case 'logistics': return 'local_shipping';
      default: return 'receipt';
    }
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-campaign-plan',
  imports: [CommonModule],
  template: `
    <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div class="flex flex-col gap-2">
        <h2 class="text-2xl font-display font-bold text-agri-dark tracking-tight">Plan de Campagne Stratégique</h2>
        <p class="text-xs text-slate-400 font-bold uppercase tracking-widest">Conseils personnalisés pour votre culture : {{ mainCrop() }}</p>
      </div>

      <!-- AI Calendar Generation -->
      <div class="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-agri-earth/10 text-agri-earth flex items-center justify-center">
              <span class="material-icons-round">calendar_today</span>
            </div>
            <div>
              <h3 class="font-display font-bold text-lg text-agri-dark">Calendrier de Semis IA 2026</h3>
              <p class="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-1">Généré selon votre micro-climat local</p>
            </div>
          </div>
          <button (click)="generateCalendar()" [disabled]="isLoading()" class="px-6 py-3 bg-agri-dark text-white rounded-2xl font-bold text-xs hover:bg-agri-dark/90 transition-all flex items-center gap-2">
            @if (isLoading()) {
              <span class="material-icons-round animate-spin text-sm">refresh</span>
            } @else {
              <span class="material-icons-round text-sm">auto_awesome</span>
            }
            {{ calendar() ? 'Actualiser le Plan' : 'Générer mon Plan' }}
          </button>
        </div>

        @if (isLoading()) {
          <div class="py-20 flex flex-col items-center gap-4 text-slate-300 animate-pulse">
            <span class="material-icons-round text-6xl">hourglass_empty</span>
            <p class="font-medium italic">KivuShamba IA planifie votre saison...</p>
          </div>
        } @else if (calendar()) {
          <div class="prose prose-sm max-w-none text-slate-600 leading-relaxed overflow-x-auto">
             <div class="p-6 bg-slate-50 rounded-3xl border border-slate-100 whitespace-pre-wrap font-sans">
               {{ calendar() }}
             </div>
          </div>
        } @else {
          <div class="py-20 flex flex-col items-center text-center max-w-sm mx-auto">
            <div class="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-6">
               <span class="material-icons-round text-4xl">event_note</span>
            </div>
            <p class="text-slate-400 font-medium italic">Cliquez sur générer pour obtenir un calendrier d'actions optimisé pour votre culture de {{ mainCrop() }}.</p>
          </div>
        }
      </div>

      <!-- Educational Content -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-agri-green/5 p-8 rounded-[2.5rem] border border-agri-green/10">
          <h4 class="font-bold text-agri-green text-sm mb-3 flex items-center gap-2">
            <span class="material-icons-round">biotech</span>
            Optimisation des Intrants
          </h4>
          <p class="text-xs text-agri-green/70 font-medium leading-relaxed">
            L'IA recommande l'utilisation de compost organique enrichi pour votre sol. Réduisez vos coûts d'engrais chimiques de 40% cette saison.
          </p>
        </div>
        <div class="bg-agri-earth/5 p-8 rounded-[2.5rem] border border-agri-earth/10">
          <h4 class="font-bold text-agri-earth text-sm mb-3 flex items-center gap-2">
            <span class="material-icons-round">wb_sunny</span>
            Ajustement Climatique
          </h4>
          <p class="text-xs text-agri-earth/70 font-medium leading-relaxed">
            Les prévisions indiquent une arrivée tardive des pluies. Décalez vos semis de 10 jours pour éviter le stress hydrique initial.
          </p>
        </div>
      </div>
    </div>
  `
})
export class CampaignPlanShell {
  private ai = inject(AiAdvisoryService);
  private auth = inject(AuthService);
  
  calendar = signal<string | null>(null);
  isLoading = signal(false);
  
  mainCrop = computed(() => {
    // Dans une vraie app, on lirait le profil Firestore. 
    // Ici on simule pour l'exemple
    return 'Maïs';
  });

  async generateCalendar() {
    this.isLoading.set(true);
    try {
      const plan = await this.ai.getSowingCalendar(this.mainCrop(), 'Kivu / Région Est');
      this.calendar.set(plan);
    } finally {
      this.isLoading.set(false);
    }
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-tracking',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <div class="flex flex-col gap-2">
        <h2 class="text-2xl font-display font-bold text-agri-dark tracking-tight">Suivi des Dépenses</h2>
        <p class="text-xs text-slate-400 font-bold uppercase tracking-widest">Enregistrez chaque sou investi dans votre champ</p>
      </div>

      <!-- Quick Add Transaction -->
      <div class="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-agri-green/5 rounded-full -mr-16 -mt-16"></div>
        
        <h3 class="font-display font-bold text-lg text-agri-dark mb-6 relative z-10">Nouvelle Dépense</h3>
        
        <div class="space-y-4 relative z-10">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Montant (CFA)</label>
              <input [(ngModel)]="form.amount" type="number" placeholder="0" class="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 font-bold text-agri-dark focus:border-agri-green outline-none transition-all" />
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Catégorie</label>
              <select [(ngModel)]="form.category" class="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 font-bold text-agri-dark focus:border-agri-green outline-none transition-all appearance-none cursor-pointer">
                <option value="seeds">Production (Semences/Plants)</option>
                <option value="soil">Sol & Engrais</option>
                <option value="protection">Protection (Pesticides/Bio)</option>
                <option value="labor">Main d'œuvre</option>
                <option value="logistics">Logistique & Transport</option>
                <option value="other">Autres frais</option>
              </select>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Description (Optionnel)</label>
            <input [(ngModel)]="form.description" type="text" placeholder="Ex: 5 sacs d'Urée, Journalier récolte..." class="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 font-bold text-agri-dark focus:border-agri-green outline-none transition-all" />
          </div>

          <button (click)="saveTransaction()" [disabled]="!form.amount || isSaving()" class="w-full h-16 bg-agri-green text-white rounded-2xl font-black text-sm shadow-lg shadow-agri-green/20 hover:scale-[1.02] active:scale-95 transition-all mt-4 flex items-center justify-center gap-3">
            @if (isSaving()) {
              <span class="material-icons-round animate-spin">refresh</span>
              ENREGISTREMENT...
            } @else {
              <span class="material-icons-round">add_shopping_cart</span>
              ENREGISTRER LA DÉPENSE
            }
          </button>
        </div>
      </div>

      <!-- Feedback -->
      @if (successMessage()) {
        <div class="p-6 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-[2rem] font-bold text-sm flex items-center gap-4 animate-in zoom-in duration-300">
           <span class="material-icons-round">check_circle</span>
           {{ successMessage() }}
        </div>
      }
    </div>
  `
})
export class TrackingShell {
  private auth = inject(AuthService);
  
  isSaving = signal(false);
  successMessage = signal<string | null>(null);

  form = {
    amount: null,
    category: 'seeds',
    description: ''
  };

  async saveTransaction() {
    const user = this.auth.user();
    if (!user || !this.form.amount) return;

    this.isSaving.set(true);
    try {
      await addDoc(collection(db, 'users', user.uid, 'transactions'), {
        amount: this.form.amount,
        category: this.form.category,
        description: this.form.description,
        date: new Date().toISOString()
      });
      
      this.successMessage.set('Dépense enregistrée avec succès !');
      this.form = { amount: null, category: 'seeds', description: '' };
      
      setTimeout(() => this.successMessage.set(null), 3000);
    } catch (err) {
      console.error('Failed to save transaction', err);
    } finally {
      this.isSaving.set(false);
    }
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-resilience',
  template: `
    <div class="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 class="text-2xl font-display font-bold text-agri-dark mb-4">Résilience & Épargne</h2>
      <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <p class="text-slate-500 font-medium italic">Suivi de vos objectifs d'équipement et réserves...</p>
      </div>
    </div>
  `
})
export class ResilienceShell {}

