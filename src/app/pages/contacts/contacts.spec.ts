import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ContactsPage } from './contacts';
import { ContactsService, emptyContact } from '../../core/contacts.service';
import { HttpErrorResponse } from '@angular/common/http';
import { NgForm } from '@angular/forms';

const contact = { ...emptyContact(), id: 12, name: '<script>alert(1)</script>' };
const api = {
  list: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
};

describe('Anagrafiche', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    api.list.mockReturnValue(of({ data: [contact], current_page: 1, last_page: 1, total: 1 }));
    TestBed.configureTestingModule({
      imports: [ContactsPage],
      providers: [provideRouter([]), { provide: ContactsService, useValue: api }],
    });
  });

  it('renders contact names as text and exposes edit controls', async () => {
    const fixture = TestBed.createComponent(ContactsPage);
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain(contact.name);
    expect(fixture.nativeElement.querySelector('script')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Modifica');
  });

  it('shows a retry action when loading fails', async () => {
    api.list.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const fixture = TestBed.createComponent(ContactsPage);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Riprova');
  });

  it('keeps the draft open after a failed save', () => {
    api.save.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 422,
            error: { errors: { name: ['Inserisci il nome.'] } },
          }),
      ),
    );
    const page = TestBed.createComponent(ContactsPage).componentInstance;
    page.open();
    page.draft.name = 'Mario';
    page.save({ invalid: false } as NgForm);
    expect(page.editorOpen()).toBe(true);
    expect(page.draft.name).toBe('Mario');
    expect(page.fieldErrors()['name']).toEqual(['Inserisci il nome.']);
  });

  it('sends edits to the original id and refreshes the list after success', () => {
    api.save.mockReturnValue(of({ data: contact }));
    const page = TestBed.createComponent(ContactsPage).componentInstance;
    page.open(contact);
    page.draft.name = 'Nome aggiornato';
    page.save({ invalid: false } as NgForm);
    expect(api.save).toHaveBeenCalledWith(expect.objectContaining({ name: 'Nome aggiornato' }), 12);
    expect(page.editorOpen()).toBe(false);
    expect(api.list).toHaveBeenCalledTimes(2);
  });
});
