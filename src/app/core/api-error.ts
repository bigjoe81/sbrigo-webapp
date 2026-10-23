import { HttpErrorResponse } from '@angular/common/http';

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }

  if (error.status === 0) {
    return 'Impossibile contattare il server. Controlla la connessione e riprova.';
  }

  if (error.status === 419) {
    return 'La sessione è scaduta. Ricarica la pagina e riprova.';
  }

  const response = error.error as {
    message?: unknown;
    errors?: Record<string, string[]>;
  };
  const validationMessage = response?.errors
    ? Object.values(response.errors).flat()[0]
    : undefined;

  if (typeof validationMessage === 'string') {
    return validationMessage;
  }

  return typeof response?.message === 'string'
    ? response.message
    : fallback;
}
