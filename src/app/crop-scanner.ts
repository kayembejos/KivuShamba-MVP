import { ChangeDetectionStrategy, Component, inject, signal, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AiAdvisoryService } from './ai-advisory.service';
import { AuthService, db } from './auth.service';
import { collection, addDoc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

@Component({
  selector: 'app-crop-scanner',
  imports: [CommonModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-agri-bg p-6 pb-24 flex flex-col font-sans animate-in fade-in duration-500 overflow-y-auto">
      <header class="flex items-center gap-4 mb-4 shrink-0">
        <button (click)="goBack()" class="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-agri-dark">
          <span class="material-icons-round">arrow_back</span>
        </button>
        <h1 class="text-xl font-display font-bold text-agri-dark">Diagnostic IA</h1>
      </header>

      <div class="flex flex-col gap-8">
        <!-- Scanner Area -->
        <div class="flex flex-col gap-6">
          <div class="aspect-square w-full max-w-md mx-auto bg-slate-200 rounded-[3rem] border-4 border-white shadow-inner overflow-hidden relative group shrink-0">
            @if (!previewUrl()) {
              <div class="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                <div class="w-20 h-20 rounded-full bg-slate-300/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span class="material-icons-round text-4xl">photo_camera</span>
                </div>
                <p class="text-sm font-bold uppercase tracking-widest leading-relaxed">Placez la feuille malade dans le cadre</p>
              </div>
            } @else {
              <img [src]="previewUrl()" class="w-full h-full object-cover animate-in zoom-in duration-500" alt="Culture à analyser" />
            }
            
            <input type="file" accept="image/*" capture="environment" (change)="onFileSelected($event)" class="absolute inset-0 opacity-0 cursor-pointer" />
          </div>

          @if (isLoading()) {
            <div class="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center gap-4 text-center animate-pulse">
              <div class="w-12 h-12 rounded-full border-4 border-agri-green border-t-transparent animate-spin"></div>
              <div>
                <h3 class="font-bold text-agri-dark">Analyse IA en cours...</h3>
                <p class="text-xs text-slate-400 font-medium">L'expert agronome examine votre culture</p>
              </div>
            </div>
          } @else if (result()) {
            <div class="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 animate-in slide-in-from-bottom-4 duration-500">
              <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-agri-green flex items-center justify-center text-white">
                    <span class="material-icons-round">analytics</span>
                  </div>
                  <h3 class="font-display font-bold text-lg text-agri-dark tracking-tight">Rapport</h3>
                </div>
                
                @if (!isSaved()) {
                  <button (click)="saveDiagnosis()" [disabled]="isSaving()" class="px-4 py-2 bg-agri-green/10 text-agri-green rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-agri-green/20 transition-all">
                    <span class="material-icons-round text-sm">{{ isSaving() ? 'refresh' : 'bookmark_border' }}</span>
                    {{ isSaving() ? 'Sauvegarder' : 'Sauvegarder' }}
                  </button>
                } @else {
                  <div class="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs flex items-center gap-2">
                    <span class="material-icons-round text-sm">check_circle</span>
                    Sauvegardé
                  </div>
                }
              </div>
              
              <div class="prose prose-sm font-sans text-slate-600 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {{ result() }}
              </div>

              <button (click)="reset()" class="mt-8 w-full py-4 rounded-2xl bg-slate-100 text-agri-dark font-bold text-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
                <span class="material-icons-round">refresh</span>
                Nouveau Scan
              </button>
            </div>
          }
        </div>

        <!-- History List -->
        <section class="space-y-6">
          <div class="flex items-center justify-between px-2">
            <h2 class="font-display font-bold text-lg text-agri-dark tracking-tight">Rapports récents</h2>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ diagnostics().length }} diagnostics</span>
          </div>

          <div class="space-y-4">
            @for (diag of diagnostics(); track diag.id) {
              <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                <div class="flex gap-4">
                  @if (diag.cropImage) {
                    <div class="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-slate-50">
                      <img [src]="diag.cropImage" class="w-full h-full object-cover" alt="Scan original" />
                    </div>
                  } @else {
                    <div class="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 shrink-0">
                      <span class="material-icons-round">broken_image</span>
                    </div>
                  }
                  <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start mb-1">
                      <span class="text-[10px] font-bold text-agri-green uppercase tracking-widest">{{ diag.date | date:'dd MMM yyyy' }}</span>
                      <span class="text-[10px] font-bold text-slate-300 uppercase">{{ diag.date | date:'HH:mm' }}</span>
                    </div>
                    <p class="text-xs font-medium text-slate-600 line-clamp-2 leading-relaxed">
                      {{ diag.result }}
                    </p>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="text-center py-12 px-6 border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                <div class="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mx-auto mb-4">
                  <span class="material-icons-round text-3xl">history</span>
                </div>
                <h3 class="font-bold text-slate-400 text-sm">Aucun diagnostic sauvé</h3>
                <p class="text-[10px] text-slate-300 font-bold uppercase tracking-wider mt-1">Vos scans s'afficheront ici</p>
              </div>
            }
          </div>
        </section>
      </div>
    </div>
  `
})
export class CropScannerComponent {
  private ai = inject(AiAdvisoryService);
  private auth = inject(AuthService);
  
  previewUrl = signal<string | null>(null);
  result = signal<string | null>(null);
  isLoading = this.ai.isLoading;
  isSaving = signal(false);
  isSaved = signal(false);
  diagnostics = signal<any[]>([]);

  constructor() {
    // Listen for real-time history
    effect(() => {
      const user = this.auth.user();
      if (user) {
        const q = query(
          collection(db, 'users', user.uid, 'diagnostics'), 
          orderBy('date', 'desc'),
          limit(10)
        );
        onSnapshot(q, (snap) => {
          const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          this.diagnostics.set(docs);
        });
      }
    });
  }

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.isSaved.set(false);
    // Preview
    const reader = new FileReader();
    reader.onload = (e) => this.previewUrl.set(e.target?.result as string);
    reader.readAsDataURL(file);

    // AI Analysis
    const base64 = await this.toBase64(file);
    const diagnosis = await this.ai.diagnoseCrop(base64, file.type);
    this.result.set(diagnosis);
  }

  async saveDiagnosis() {
    const user = this.auth.user();
    const currentResult = this.result();
    if (!user || !currentResult || this.isSaving()) return;

    this.isSaving.set(true);
    try {
      await addDoc(collection(db, 'users', user.uid, 'diagnostics'), {
        result: currentResult,
        date: new Date().toISOString(),
        cropImage: this.previewUrl()?.slice(0, 50000) // Truncate base64 if too large
      });
      this.isSaved.set(true);
    } catch (err) {
      console.error('Failed to save diagnosis', err);
    } finally {
      this.isSaving.set(false);
    }
  }

  private toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:image/... base64, part
      };
      reader.onerror = error => reject(error);
    });
  }

  reset() {
    this.previewUrl.set(null);
    this.result.set(null);
    this.isSaved.set(false);
  }

  goBack() {
    window.history.back();
  }
}
