import {ChangeDetectionStrategy, Component, signal, inject} from '@angular/core';
import {Router} from '@angular/router';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-landing',
  templateUrl: './landing.html'
})
export class Landing {
  assistanceStarted = signal(false);
  router = inject(Router);

  async startAssistance() {
    this.assistanceStarted.set(true);
    // Simuler le délai de lancement de l'assistance agronomique offline
    setTimeout(() => {
      this.router.navigate(['/auth']);
    }, 500);
  }
}
