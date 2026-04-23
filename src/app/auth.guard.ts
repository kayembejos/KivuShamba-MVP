import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Ensures user is authenticated and has completed onboarding for the main app.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.parseUrl('/auth');
  }
  
  const user = authService.user();
  if (user && !user.onboardingComplete) {
    return router.parseUrl('/onboarding');
  }
  
  return true;
};

/**
 * Prevents authenticated users from seeing login page.
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    const user = authService.user();
    if (user?.onboardingComplete) {
      return router.parseUrl('/app');
    } else {
      return router.parseUrl('/onboarding');
    }
  }
  
  return true;
};

/**
 * Prevents users who finished onboarding from seeing it again.
 */
export const onboardingGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.parseUrl('/auth');
  }
  
  const user = authService.user();
  if (user?.onboardingComplete) {
    return router.parseUrl('/app');
  }

  return true;
};
