import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  sendSignInLinkToEmail, 
  isSignInWithEmailLink, 
  signInWithEmailLink, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDocFromServer, onSnapshot } from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';
import rootFirebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(rootFirebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, (rootFirebaseConfig as any).firestoreDatabaseId);

// Initialize Gemini API
export const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export interface UserProfile {
  email: string | null;
  displayName: string | null;
  uid: string;
  onboardingComplete?: boolean;
  mainCrop?: string;
  campaignBudget?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  
  private userSignal = signal<UserProfile | null>(null);
  private profileLoaded = signal(false);
  
  readonly user = this.userSignal.asReadonly();
  readonly isLoggedIn = computed(() => this.userSignal() !== null);
  readonly isProfileLoaded = this.profileLoaded.asReadonly();

  private unsubscribeProfile?: () => void;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initAuthListener();
      this.testConnection();
      this.checkMagicLink();
    }
  }

  private initAuthListener() {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (this.unsubscribeProfile) this.unsubscribeProfile();

      if (firebaseUser) {
        // Initial state from Auth
        this.userSignal.set({
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          uid: firebaseUser.uid
        });
        
        // Real-time sync for profile and onboarding status
        this.unsubscribeProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            this.userSignal.update(u => u ? ({ ...u, ...data } as UserProfile) : null);
          } else {
            // New user, trigger initial sync
            this.syncInitialProfile(firebaseUser);
          }
          this.profileLoaded.set(true);
        });
      } else {
        this.userSignal.set(null);
        this.profileLoaded.set(false);
      }
    });
  }

  private async syncInitialProfile(firebaseUser: any) {
    try {
      const userDocParams: any = {
        email: firebaseUser.email || '',
        lastLoginAt: new Date().toISOString()
      };
      if (firebaseUser.displayName) {
        userDocParams.displayName = firebaseUser.displayName;
      }
      await setDoc(doc(db, 'users', firebaseUser.uid), userDocParams, { merge: true });
    } catch (error) {
      console.error("Failed to sync user profile to Firestore", error);
    }
  }

  private async testConnection() {
    try {
      await getDocFromServer(doc(db, 'system', 'connection'));
    } catch (error) {
      if(error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration.");
      }
    }
  }

  private async checkMagicLink() {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Veuillez confirmer votre email pour la connexion.');
      }
      if (email) {
        try {
          await signInWithEmailLink(auth, email, window.location.href);
          window.localStorage.removeItem('emailForSignIn');
          window.history.replaceState(null, '', window.location.pathname);
        } catch (err) {
          console.error('Erreur lors de la connexion par lien', err);
        }
      }
    }
  }

  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }

  async sendMagicLink(email: string): Promise<void> {
    const actionCodeSettings = {
      // Must direct back to current URL or /auth
      url: window.location.origin + '/auth', 
      handleCodeInApp: true,
    };
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }
}

