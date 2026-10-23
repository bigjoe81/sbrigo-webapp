import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';
import {
  API_URL,
  CURRENT_USER_URL,
  LOGOUT_URL,
  OTP_SEND_URL,
  OTP_VERIFY_URL,
  REGISTER_URL,
} from './api.config';
import {
  OtpCredentials,
  RegistrationDetails,
  User,
} from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly user = signal<User | null>(null);
  readonly currentUser = this.user.asReadonly();

  sendOtp(email: string): Observable<void> {
    return this.requestCsrfCookie().pipe(
      switchMap(() => this.http.post<void>(OTP_SEND_URL, { email })),
    );
  }

  verifyOtp(credentials: OtpCredentials): Observable<User> {
    return this.requestCsrfCookie().pipe(
      switchMap(() => this.http.post<void>(OTP_VERIFY_URL, credentials)),
      switchMap(() => this.fetchUser()),
      tap((user) => this.user.set(user)),
    );
  }

  register(details: RegistrationDetails): Observable<void> {
    return this.requestCsrfCookie().pipe(
      switchMap(() => this.http.post<void>(REGISTER_URL, details)),
    );
  }

  logout(): Observable<void> {
    return this.requestCsrfCookie().pipe(
      switchMap(() => this.http.post<void>(LOGOUT_URL, {})),
      tap(() => this.user.set(null)),
    );
  }

  getCurrentUser(): Observable<User | null> {
    if (this.user()) {
      return of(this.user());
    }

    return this.fetchUser().pipe(
      tap((user) => this.user.set(user)),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.user.set(null);
          return of(null);
        }

        throw error;
      }),
    );
  }

  private requestCsrfCookie(): Observable<void> {
    return this.http.get<void>(`${API_URL}/sanctum/csrf-cookie`);
  }

  private fetchUser(): Observable<User> {
    return this.http
      .get<{ user: User }>(CURRENT_USER_URL)
      .pipe(map(({ user }) => user));
  }
}
