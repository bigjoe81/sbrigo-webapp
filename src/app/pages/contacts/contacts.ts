import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, finalize, startWith, switchMap, catchError, of, tap } from 'rxjs';
import { Contact, ContactData, ContactsService, emptyContact } from '../../core/contacts.service';
import { apiErrorMessage } from '../../core/api-error';

@Component({
  selector: 'app-contacts',
  imports: [FormsModule, RouterLink],
  templateUrl: './contacts.html',
})
export class ContactsPage {
  private readonly editorDialog = viewChild<ElementRef<HTMLDialogElement>>('editorDialog');
  private readonly deleteDialog = viewChild<ElementRef<HTMLDialogElement>>('deleteDialog');
  private readonly api = inject(ContactsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reload = new Subject<void>();
  private readonly searchChanges = new Subject<void>();
  readonly contacts = signal<Contact[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly formError = signal('');
  readonly notice = signal('');
  readonly total = signal(0);
  readonly lastPage = signal(1);
  readonly editorOpen = signal(false);
  readonly selected = signal<Contact | null>(null);
  readonly deleting = signal(false);
  readonly step = signal(0);
  readonly fieldErrors = signal<Record<string, string[]>>({});
  readonly serverErrors = computed(() => Object.entries(this.fieldErrors()));
  search = '';
  filter = '';
  page = 1;
  editingId?: number;
  draft: ContactData = emptyContact();
  readonly roles = { customer: 'Cliente', supplier: 'Fornitore', both: 'Cliente e fornitore' };
  readonly steps = ['Chi è?', 'Come lo contatti?', 'Dati fiscali'];

  constructor() {
    effect(() => {
      const dialog = this.editorDialog()?.nativeElement;
      if (dialog && !dialog.open) dialog.showModal();
    });
    effect(() => {
      const dialog = this.deleteDialog()?.nativeElement;
      if (dialog && !dialog.open) dialog.showModal();
    });
    this.searchChanges
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe(() => this.refresh());
    this.reload
      .pipe(
        startWith(undefined),
        tap(() => {
          this.loading.set(true);
          this.error.set('');
        }),
        switchMap(() =>
          this.api.list(this.search, this.filter, this.page).pipe(
            catchError((error: unknown) => {
              this.error.set(
                apiErrorMessage(error, 'Non riusciamo a caricare le anagrafiche. Riprova.'),
              );
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        this.loading.set(false);
        if (result) {
          this.contacts.set(result.data);
          this.total.set(result.total);
          this.lastPage.set(result.last_page);
        }
      });
  }
  searchChanged() {
    this.searchChanges.next();
  }
  refresh() {
    this.page = 1;
    this.reload.next();
  }
  retry() {
    this.reload.next();
  }
  changePage(delta: number) {
    this.page += delta;
    this.reload.next();
  }
  open(contact?: Contact) {
    this.editingId = contact?.id;
    this.draft = contact
      ? (Object.fromEntries(
          Object.keys(emptyContact()).map((key) => [key, contact[key as keyof Contact] ?? '']),
        ) as unknown as ContactData)
      : emptyContact();
    this.step.set(0);
    this.formError.set('');
    this.fieldErrors.set({});
    this.notice.set('');
    this.editorOpen.set(true);
  }
  next(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    this.step.update((value) => value + 1);
  }
  save(form: NgForm) {
    if (this.saving() || form.invalid || !this.draft.name.trim()) {
      form.control.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.formError.set('');
    this.fieldErrors.set({});
    this.api
      .save(this.draft, this.editingId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.editorOpen.set(false);
          this.notice.set('Anagrafica salvata.');
          this.refresh();
        },
        error: (error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 422) {
            const errors = error.error.errors ?? {};
            this.fieldErrors.set(errors);
            if (['name', 'type', 'entity_type'].some((key) => errors[key])) this.step.set(0);
            else if (
              ['email', 'phone', 'address', 'postal_code', 'city', 'province', 'country'].some(
                (key) => errors[key],
              )
            )
              this.step.set(1);
          }
          this.formError.set(apiErrorMessage(error, 'Salvataggio non riuscito. Riprova.'));
        },
      });
  }
  remove() {
    const contact = this.selected();
    if (!contact || this.deleting()) return;
    this.deleting.set(true);
    this.api
      .delete(contact.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.deleting.set(false)),
      )
      .subscribe({
        next: () => {
          this.selected.set(null);
          this.notice.set('Anagrafica eliminata.');
          this.refresh();
        },
        error: (error: unknown) => {
          this.selected.set(null);
          this.error.set(apiErrorMessage(error, 'Eliminazione non riuscita. Riprova.'));
        },
      });
  }
}
