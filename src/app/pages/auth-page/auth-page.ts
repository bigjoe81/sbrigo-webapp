import { Component, inject, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, Observable } from 'rxjs';
import { apiErrorMessage } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-auth-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './auth-page.html',
})
export class AuthPage {
  readonly mode = input<'login' | 'register'>('login');

  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly submitting = signal(false);
  readonly errorMessage = signal('');
  readonly otpSent = signal(false);
  readonly registrationPending = signal(false);
  readonly registrationForm = this.formBuilder.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });
  readonly loginForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  constructor() {
    if (this.route.snapshot.queryParamMap.get('backendUnavailable') === '1') {
      this.errorMessage.set(
        'Backend non raggiungibile: puoi consultare la schermata, ma per autenticarti Laravel deve essere online.',
      );
    }
  }

  submit(): void {
    this.errorMessage.set('');

    if (this.submitting()) {
      return;
    }

    if (this.mode() === 'register' && !this.registrationPending()) {
      const form = this.registrationForm;
      if (form.invalid) {
        form.markAllAsTouched();
        return;
      }

      const { name, email } = form.getRawValue();
      this.runRequest(
        this.auth.register({ name, email }),
        'Registrazione non riuscita. Controlla i dati e riprova.',
        () => {
          this.loginForm.controls.email.setValue(email.trim().toLowerCase());
          this.otpSent.set(true);
          this.registrationPending.set(true);
        },
      );
      return;
    }

    if (!this.otpSent()) {
      const form = this.loginForm.controls.email;
      if (form.invalid) {
        form.markAsTouched();
        return;
      }

      this.runRequest(
        this.auth.sendOtp(form.value),
        'Non è stato possibile inviare il codice. Riprova.',
        () => this.otpSent.set(true),
      );
      return;
    }

    const form = this.loginForm;
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }

    const { email, code } = form.getRawValue();
    this.runRequest(
      this.auth.verifyOtp({ email, code }),
      'Codice non valido o scaduto. Riprova.',
      () => this.navigateAfterAuth(),
    );
  }

  private runRequest(
    request: Observable<unknown>,
    fallback: string,
    onSuccess?: () => void,
  ): void {
    this.submitting.set(true);
    request
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => onSuccess?.(),
        error: (error: unknown) => {
          this.errorMessage.set(
            apiErrorMessage(error, fallback),
          );
        },
      });
  }

  private navigateAfterAuth(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const destination =
      returnUrl?.startsWith('/') && !returnUrl.startsWith('//')
        ? returnUrl
        : '/dashboard';
    void this.router.navigateByUrl(destination);
  }

  resetOtp(): void {
    this.otpSent.set(false);
    this.loginForm.controls.code.reset('');
    this.errorMessage.set('');
  }

  resendOtp(): void {
    if (this.submitting()) {
      return;
    }

    this.loginForm.controls.code.reset('');
    this.errorMessage.set('');
    this.runRequest(
      this.auth.sendOtp(this.loginForm.controls.email.value),
      'Non è stato possibile inviare il codice. Riprova.',
    );
  }
}
