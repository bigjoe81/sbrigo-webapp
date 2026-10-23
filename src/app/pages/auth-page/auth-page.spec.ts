import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { AuthPage } from './auth-page';

describe('AuthPage', () => {
  it('registers with name and email, then requires email verification', async () => {
    const auth = {
      register: vi.fn().mockReturnValue(of(undefined)),
      sendOtp: vi.fn().mockReturnValue(of(undefined)),
      verifyOtp: vi.fn().mockReturnValue(
        of({ id: 1, name: 'Giulia Rossi', email: 'giulia@example.com' }),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [AuthPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AuthPage);
    fixture.componentRef.setInput('mode', 'register');
    fixture.detectChanges();

    const page = fixture.componentInstance;
    page.registrationForm.setValue({
      name: 'Giulia Rossi',
      email: 'giulia@example.com',
    });
    page.submit();
    fixture.detectChanges();

    expect(auth.register).toHaveBeenCalledWith({
      name: 'Giulia Rossi',
      email: 'giulia@example.com',
    });
    expect(page.registrationPending()).toBe(true);
    expect(page.otpSent()).toBe(true);
    expect(page.loginForm.controls.email.value).toBe('giulia@example.com');
    expect(
      fixture.nativeElement.querySelector('input[type="password"]'),
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector('input[autocomplete="one-time-code"]'),
    ).toBeTruthy();
  });
});
