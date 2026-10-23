import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { apiErrorMessage } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
})
export class DashboardPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = this.auth.currentUser;
  readonly firstName = computed(
    () => this.user()?.name.trim().split(/\s+/)[0] ?? 'utente',
  );
  readonly signingOut = signal(false);
  readonly logoutError = signal('');

  logout(): void {
    if (this.signingOut()) {
      return;
    }

    this.logoutError.set('');
    this.signingOut.set(true);
    this.auth
      .logout()
      .pipe(finalize(() => this.signingOut.set(false)))
      .subscribe({
        next: () => void this.router.navigateByUrl('/login'),
        error: (error: unknown) =>
          this.logoutError.set(
            apiErrorMessage(error, 'Non è stato possibile uscire. Riprova.'),
          ),
      });
  }
}
