import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { db } from './auth.service';
import { doc, updateDoc } from 'firebase/firestore';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-onboarding',
  imports: [ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-agri-bg flex flex-col font-sans relative overflow-hidden">
      <!-- Background elements -->
      <div class="absolute top-0 right-0 w-96 h-96 bg-agri-green/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div class="absolute bottom-0 left-0 w-96 h-96 bg-agri-earth/5 blur-[120px] rounded-full pointer-events-none"></div>

      <!-- Step Indicator -->
      <div class="w-full max-w-xl mx-auto px-6 pt-12 z-10">
        <div class="flex items-center justify-between mb-8">
          @for (s of [1, 2, 3]; track s) {
            <div class="flex items-center gap-2">
              <div [class]="'w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all ' + 
                (currentStep() >= s ? 'bg-agri-green text-white scale-110 shadow-lg shadow-agri-green/20' : 'bg-white text-slate-300 border-2 border-slate-100')">
                {{ s }}
              </div>
              @if (s < 3) {
                <div [class]="'h-1 w-12 md:w-24 rounded-full transition-all ' + (currentStep() > s ? 'bg-agri-green' : 'bg-slate-100')"></div>
              }
            </div>
          }
        </div>
      </div>

      <main class="flex-1 flex flex-col items-center justify-center px-4 pb-12 z-10 relative">
        <div class="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl shadow-agri-dark/5 p-8 md:p-12 border border-slate-50 overflow-hidden">
          
          <!-- Step 1: Diagnostic -->
          @if (currentStep() === 1) {
            <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div class="text-center">
                <span class="text-xs font-bold text-agri-green uppercase tracking-widest bg-agri-green/10 px-3 py-1 rounded-full mb-4 inline-block">Étape 1 : Diagnostic</span>
                <h1 class="font-display text-3xl font-bold text-agri-dark mt-2">Votre Culture & Ressources</h1>
                <p class="text-slate-500 font-medium mt-2">Commençons par définir vos objectifs de saison.</p>
              </div>

              <div [formGroup]="step1Form" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-3 ml-1">Culture Principale</label>
                    <div class="relative">
                      <select formControlName="mainCrop" class="w-full h-14 bg-slate-50 border-2 border-slate-100 focus:border-agri-green focus:bg-white rounded-2xl px-4 appearance-none outline-none transition-all font-bold text-agri-dark">
                        <option value="">Sélectionnez...</option>
                        <option value="Maïs">Maïs</option>
                        <option value="Café">Café</option>
                        <option value="Cacao">Cacao</option>
                        <option value="Manioc">Manioc</option>
                        <option value="Riz">Riz</option>
                      </select>
                      <span class="material-icons-round absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-3 ml-1">Budget Total (CFA)</label>
                    <input formControlName="budget" type="number" placeholder="ex: 500000" class="w-full h-14 bg-slate-50 border-2 border-slate-100 focus:border-agri-green focus:bg-white rounded-2xl px-4 outline-none transition-all font-bold text-agri-dark" />
                  </div>
                </div>

                <!-- AI Quick Estimation -->
                @if (step1Form.valid) {
                  <div class="bg-agri-green/5 rounded-3xl p-6 border border-agri-green/10 animate-in zoom-in duration-300">
                    <div class="flex items-start gap-4">
                      <div class="w-10 h-10 rounded-xl bg-agri-green flex items-center justify-center text-white shrink-0">
                        <span class="material-icons-round">insights</span>
                      </div>
                      <div>
                        <h4 class="font-bold text-agri-dark text-sm mb-1">Estimation de rendement AgriFlow</h4>
                        <p class="text-xs text-slate-600 leading-relaxed font-medium">
                          Basé sur votre budget de {{ step1Form.value.budget?.toLocaleString() }} CFA pour le {{ step1Form.value.mainCrop }}, l'IA estime un rendement potentiel de 
                          <span class="text-agri-green font-bold">{{ estimatedYield() }} tonnes</span> par hectare avec une gestion optimisée.
                        </p>
                      </div>
                    </div>
                  </div>
                }

                <button [disabled]="step1Form.invalid" (click)="goToStep2()" class="w-full h-16 bg-agri-dark text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-agri-dark/90 transition-all shadow-lg active:scale-95 disabled:opacity-30">
                  Continuer vers la planification
                  <span class="material-icons-round">arrow_forward</span>
                </button>
              </div>
            </div>
          }

          <!-- Step 2: Distribution -->
          @if (currentStep() === 2) {
            <div class="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div class="text-center">
                <span class="text-xs font-bold text-agri-green uppercase tracking-widest bg-agri-green/10 px-3 py-1 rounded-full mb-4 inline-block">Étape 2 : Planification Pédagogique</span>
                <h1 class="font-display text-3xl font-bold text-agri-dark mt-2">Répartition du Budget</h1>
                <p class="text-slate-500 font-medium mt-2">Comment souhaitez-vous allouer vos ressources ?</p>
              </div>

              <!-- Strategy Selector -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button (click)="setStrategy('ai_resilience')" [class]="'p-6 rounded-[2rem] border-2 text-left transition-all ' + (strategy() === 'ai_resilience' ? 'border-agri-green bg-agri-green/5 shadow-inner' : 'border-slate-100 hover:border-slate-200')">
                  <div class="w-10 h-10 rounded-xl bg-agri-green flex items-center justify-center text-white mb-4">
                    <span class="material-icons-round">auto_awesome</span>
                  </div>
                  <h3 class="font-bold text-agri-dark mb-2">Résilience IA</h3>
                  <p class="text-xs text-slate-500 leading-relaxed font-medium">L'IA optimise la répartition pour sécuriser votre récolte contre les aléas.</p>
                </button>
                <button (click)="setStrategy('manual')" [class]="'p-6 rounded-[2rem] border-2 text-left transition-all ' + (strategy() === 'manual' ? 'border-agri-earth bg-agri-earth/5 shadow-inner' : 'border-slate-100 hover:border-slate-200')">
                  <div class="w-10 h-10 rounded-xl bg-agri-earth flex items-center justify-center text-white mb-4">
                    <span class="material-icons-round">edit_note</span>
                  </div>
                  <h3 class="font-bold text-agri-dark mb-2">Expert Manuel</h3>
                  <p class="text-xs text-slate-500 leading-relaxed font-medium">Vous maîtrisez vos chiffres. Saisissez votre propre répartition.</p>
                </button>
              </div>

              <!-- Distribution Details -->
              <div class="space-y-6 bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
                <div class="space-y-4">
                   @for (cat of categories; track cat.id) {
                    <div class="space-y-2">
                       <div class="flex justify-between items-center px-1">
                         <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{{ cat.label }}</label>
                         <span class="text-xs font-bold text-agri-dark">{{ distribution()[cat.id] }}% ({{ getAmount(cat.id)?.toLocaleString() }} CFA)</span>
                       </div>
                       @if (strategy() === 'manual') {
                         <input type="range" min="0" max="100" [value]="distribution()[cat.id]" (input)="updateManual(cat.id, $event)" class="w-full accent-agri-earth h-1 bg-slate-200 rounded-full appearance-none outline-none" />
                       } @else {
                         <div class="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                           <div class="h-full bg-agri-green transition-all" [style.width.%]="distribution()[cat.id]"></div>
                         </div>
                       }
                    </div>
                   }
                </div>

                <!-- Totals & Alerts -->
                <div class="pt-4 border-t border-slate-200">
                  <div class="flex justify-between items-center mb-4">
                    <span class="text-sm font-bold text-slate-700">Budget Alloué :</span>
                    <span [class]="'text-lg font-black ' + (totalUsed() === 100 ? 'text-agri-green' : 'text-red-500')">{{ totalUsed() }}% / 100%</span>
                  </div>

                  @if (strategy() === 'ai_resilience') {
                    <div class="bg-agri-green/10 text-agri-green p-4 rounded-xl text-xs font-bold flex gap-3 animate-in fade-in duration-500">
                      <span class="material-icons-round shrink-0">info</span>
                      <p>L'IA a réservé 15% pour les pesticides bio et 10% pour les imprévus climatiques afin de protéger votre investissement.</p>
                    </div>
                  } @else if (criticalAlert()) {
                    <div class="bg-amber-50 text-amber-700 p-4 rounded-xl text-xs font-bold flex gap-3 border border-amber-100 animate-bounce duration-[1000ms]">
                      <span class="material-icons-round shrink-0">warning</span>
                      <p>Attention, sans budget pour la protection, vous risquez de perdre jusqu'à 30% de votre rendement.</p>
                    </div>
                  }
                </div>
              </div>

              <div class="flex gap-4">
                <button (click)="currentStep.set(1)" class="w-1/3 h-16 bg-white border-2 border-slate-100 rounded-2xl font-bold flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 transition-all">
                  <span class="material-icons-round">arrow_back</span>
                </button>
                <button [disabled]="totalUsed() !== 100" (click)="goToStep3()" class="flex-1 h-16 bg-agri-dark text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-agri-dark/90 transition-all shadow-lg disabled:opacity-30">
                  Valider le Plan Plan
                  <span class="material-icons-round">check_circle</span>
                </button>
              </div>
            </div>
          }

          <!-- Step 3: Objective -->
          @if (currentStep() === 3) {
            <div class="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div class="text-center">
                <span class="text-xs font-bold text-agri-green uppercase tracking-widest bg-agri-green/10 px-3 py-1 rounded-full mb-4 inline-block">Étape 3 : Objectif Final</span>
                <h1 class="font-display text-3xl font-bold text-agri-dark mt-2">Votre Ambition</h1>
                <p class="text-slate-500 font-medium mt-2">À quoi servira le surplus de récolte ?</p>
              </div>

              <div class="grid grid-cols-1 gap-4">
                @for (obj of goals; track obj.id) {
                  <button (click)="selectedGoal.set(obj.id)" [class]="'p-6 rounded-3xl border-2 text-left transition-all flex items-center gap-4 ' + (selectedGoal() === obj.id ? 'border-agri-green bg-agri-green/5' : 'border-slate-100 hover:border-slate-200')">
                    <div [class]="'w-12 h-12 rounded-xl flex items-center justify-center transition-all ' + (selectedGoal() === obj.id ? 'bg-agri-green text-white shadow-lg' : 'bg-slate-100 text-slate-400')">
                      <span class="material-icons-round text-2xl">{{ obj.icon }}</span>
                    </div>
                    <div class="flex-1">
                      <h4 class="font-bold text-agri-dark">{{ obj.label }}</h4>
                      <p class="text-xs text-slate-500 font-medium">{{ obj.desc }}</p>
                    </div>
                    @if (selectedGoal() === obj.id) {
                      <span class="material-icons-round text-agri-green">check_circle</span>
                    }
                  </button>
                }
              </div>

              <div class="flex gap-4">
                <button (click)="currentStep.set(2)" class="w-1/3 h-16 bg-white border-2 border-slate-100 rounded-2xl font-bold flex items-center justify-center gap-2 text-slate-400">
                  <span class="material-icons-round">arrow_back</span>
                </button>
                <button [disabled]="!selectedGoal() || isSaving()" (click)="finish()" class="flex-1 h-16 bg-agri-green text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-agri-green/90 transition-all shadow-lg active:scale-95 disabled:opacity-50">
                  @if (isSaving()) {
                    <span class="material-icons-round animate-spin">refresh</span>
                  } @else {
                    Lancer mon Dashboard
                    <span class="material-icons-round">rocket_launch</span>
                  }
                </button>
              </div>
            </div>
          }

        </div>
      </main>

      <!-- Footer Info -->
      <footer class="w-full py-6 px-6 text-center text-xs text-slate-400 font-medium relative z-10">
        © 2026 KivuShamba. Tous droits réservés.
      </footer>
    </div>
  `
})
export class Onboarding {
  authService = inject(AuthService);
  router = inject(Router);
  fb = inject(FormBuilder);

  currentStep = signal(1);
  strategy = signal<'ai_resilience' | 'manual'>('ai_resilience');
  selectedGoal = signal<string | null>(null);
  isSaving = signal(false);

  categories = [
    { id: 'seeds', label: 'Semences' },
    { id: 'soil', label: 'Sol & Engrais' },
    { id: 'protection', label: 'Protection (Bio)' },
    { id: 'labor', label: 'Main-d\'œuvre' },
    { id: 'reserve', label: 'Réserve Climat' }
  ];

  goals = [
    { id: 'next_season', label: 'Financement Prochaine Saison', desc: 'Épargner pour être autonome au semis suivant.', icon: 'calendar_today' },
    { id: 'pump', label: 'Pompe d\'Irrigation', desc: 'S\'équiper pour produire même en saison sèche.', icon: 'water_drop' },
    { id: 'moulin', label: 'Moulin Communautaire', desc: 'Transformer localement pour plus de valeur.', icon: 'precision_manufacturing' }
  ];

  distribution = signal<Record<string, number>>({
    seeds: 25,
    soil: 20,
    protection: 25,
    labor: 20,
    reserve: 10
  });

  step1Form = this.fb.group({
    mainCrop: ['', Validators.required],
    budget: [null as number | null, [Validators.required, Validators.min(1000)]]
  });

  estimatedYield = computed(() => {
    const budget = this.step1Form.get('budget')?.value || 0;
    // Simulation: ratio simple pour l'effet visuel
    return (budget / 50000).toFixed(1);
  });

  totalUsed = computed(() => {
    return Object.values(this.distribution()).reduce((a, b) => a + b, 0);
  });

  criticalAlert = computed(() => {
    return this.strategy() === 'manual' && this.distribution()['protection'] < 10;
  });

  getAmount(cat: string) {
    const budget = this.step1Form.get('budget')?.value || 0;
    return Math.floor((budget * this.distribution()[cat]) / 100);
  }

  goToStep2() {
    this.currentStep.set(2);
  }

  setStrategy(val: 'ai_resilience' | 'manual') {
    this.strategy.set(val);
    if (val === 'ai_resilience') {
      this.distribution.set({
        seeds: 25,
        soil: 20,
        protection: 25,
        labor: 20,
        reserve: 10
      });
    }
  }

  updateManual(cat: string, event: Event) {
    const val = parseInt((event.target as HTMLInputElement).value);
    this.distribution.update(d => ({ ...d, [cat]: val }));
  }

  goToStep3() {
    this.currentStep.set(3);
  }

  async finish() {
    const user = this.authService.user();
    if (!user) return;

    this.isSaving.set(true);
    try {
      const userDoc = doc(db, 'users', user.uid);
      await updateDoc(userDoc, {
        mainCrop: this.step1Form.value.mainCrop,
        campaignBudget: this.step1Form.value.budget,
        budgetDistribution: {
          strategy: this.strategy(),
          ...this.distribution()
        },
        savingsGoal: this.selectedGoal(),
        onboardingComplete: true
      });
      // Dans une vraie app, on irait vers /dashboard
      // Ici on simule le succès
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.router.navigate(['/app']);
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      this.isSaving.set(false);
    }
  }
}
