import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.getCurrentUser().pipe(
    map((user) =>
      user
        ? true
        : router.createUrlTree(['/login'], {
            queryParams: { returnUrl: state.url },
          }),
    ),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 0) {
        return of(
          router.createUrlTree(['/login'], {
            queryParams: { returnUrl: state.url, backendUnavailable: '1' },
          }),
        );
      }

      throw error;
    }),
  );
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.getCurrentUser().pipe(
    map((user) => (user ? router.createUrlTree(['/dashboard']) : true)),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 0) {
        return of(true);
      }

      throw error;
    }),
  );
};
