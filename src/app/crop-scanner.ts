import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiAdvisoryService } from './ai-advisory.service';

@Component({
  selector: 'app-crop-scanner',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-agri-bg p-6 flex flex-col font-sans animate-in fade-in duration-500">
      <header class="flex items-center gap-4 mb-8">
        <button (click)="goBack()" class="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-agri-dark">
          <span class="material-icons-round">arrow_back</span>
        </button>
        <h1 class="text-xl font-display font-bold text-agri-dark">Scanner KivuShamba</h1>
      </header>

      <!-- Camera Preview Placeholder / Upload Area -->
      <div class="flex-1 flex flex-col gap-6">
        <div class="aspect-square w-full max-w-md mx-auto bg-slate-200 rounded-[3rem] border-4 border-white shadow-inner overflow-hidden relative group">
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
            <div class="flex items-center gap-3 mb-6">
              <div class="w-10 h-10 rounded-xl bg-agri-green flex items-center justify-center text-white">
                <span class="material-icons-round">analytics</span>
              </div>
              <h3 class="font-display font-bold text-lg text-agri-dark tracking-tight">Rapport de Diagnostic</h3>
            </div>
            
            <div class="prose prose-sm font-sans text-slate-600 leading-relaxed whitespace-pre-wrap">
              {{ result() }}
            </div>

            <button (click)="reset()" class="mt-8 w-full py-4 rounded-2xl bg-slate-100 text-agri-dark font-bold text-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
              <span class="material-icons-round">refresh</span>
              Nouveau Scan
            </button>
          </div>
        }

        @if (!previewUrl() && !isLoading()) {
          <div class="p-8 bg-agri-green/10 rounded-[2.5rem] border border-agri-green/20">
            <h4 class="font-bold text-agri-green text-sm mb-2 flex items-center gap-2">
              <span class="material-icons-round text-lg">info</span>
              Conseil Pro
            </h4>
            <p class="text-xs text-agri-green/80 font-medium leading-relaxed">
              Pour un meilleur diagnostic, assurez-vous que la lumière est bonne et que la feuille est nette à l'écran.
            </p>
          </div>
        }
      </div>
    </div>
  `
})
export class CropScannerComponent {
  private ai = inject(AiAdvisoryService);
  
  previewUrl = signal<string | null>(null);
  result = signal<string | null>(null);
  isLoading = this.ai.isLoading;

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => this.previewUrl.set(e.target?.result as string);
    reader.readAsDataURL(file);

    // AI Analysis
    const base64 = await this.toBase64(file);
    const diagnosis = await this.ai.diagnoseCrop(base64, file.type);
    this.result.set(diagnosis);
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
  }

  goBack() {
    window.history.back();
  }
}
