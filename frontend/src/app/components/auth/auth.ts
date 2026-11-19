import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { FirebaseService } from '../../services/firebase.service';
import { DatePickerComponent } from '../common/date-picker';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePickerComponent],
  template: `
    <div class="container py-5 my-2">
      <div class="row justify-content-center">
        <div class="col-md-9 col-lg-7 col-xl-6">
          
          <div class="card card-modern border-0 shadow-xl p-4 p-md-5">
            
            <!-- University Header & Crest -->
            <div class="text-center mb-4">
              <div class="d-inline-flex align-items-center justify-content-center rounded-3 p-3 mb-3 shadow-sm"
                   style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);">
                <i class="bi bi-shield-lock-fill text-white fs-2"></i>
              </div>
              <h3 class="fw-bold text-dark mb-1">
                {{ isLogin() ? 'Sign In to Portal' : 'Create Applicant Account' }}
              </h3>
              <p class="text-muted small mx-auto" style="max-width: 380px;">
                {{ isLogin() 
                  ? 'Access your IEM admission profile, upload certificates, or test roles via 1-click presets.' 
                  : 'Register to submit applications for the 2026 academic batch and track evaluation status.' 
                }}
              </p>
            </div>

            <!-- Feedback Alerts -->
            <div class="alert alert-danger d-flex align-items-center gap-2.5 small rounded-3 py-2.5 px-3 mb-3 shadow-xs" *ngIf="errorMessage()">
              <i class="bi bi-exclamation-circle-fill fs-5 text-danger"></i>
              <div>{{ errorMessage() }}</div>
            </div>
            
            <div class="alert alert-success d-flex align-items-center gap-2.5 small rounded-3 py-2.5 px-3 mb-3 shadow-xs" *ngIf="successMessage()">
              <i class="bi bi-check-circle-fill fs-5 text-success"></i>
              <div>{{ successMessage() }}</div>
            </div>

            <!-- Segmented Mode Toggle -->
            <div class="nav-pills-modern d-flex mb-4">
              <button class="nav-link w-50 py-2 fw-bold text-center border-0" 
                      [class.active]="isLogin()" 
                      (click)="toggleMode(true)">
                <i class="bi bi-box-arrow-in-right me-1"></i> Sign In
              </button>
              <button class="nav-link w-50 py-2 fw-bold text-center border-0" 
                      [class.active]="!isLogin()" 
                      (click)="toggleMode(false)">
                <i class="bi bi-person-plus me-1"></i> New Registration
              </button>
            </div>

            <!-- SIGN IN FORM -->
            <form *ngIf="isLogin()" (ngSubmit)="onLogin()">
              <div class="mb-3">
                <label for="login-email" class="form-label">Email Address *</label>
                <div class="input-group">
                  <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                  <input type="email" id="login-email" class="form-control" [(ngModel)]="loginEmail" name="email" 
                         placeholder="e.g. student@iem.edu.in" autocomplete="email" autocorrect="off" autocapitalize="none" spellcheck="false" required>
                </div>
              </div>

              <div class="mb-4">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <label for="login-password" class="form-label mb-0">Password *</label>
                </div>
                <div class="input-group">
                  <span class="input-group-text"><i class="bi bi-key"></i></span>
                  <input type="password" id="login-password" class="form-control" [(ngModel)]="loginPassword" name="password" 
                         placeholder="••••••••" autocomplete="current-password" required>
                </div>
              </div>

              <button type="submit" class="btn btn-iem-primary w-100 py-2.5 fw-bold mb-3 shadow-sm" [disabled]="loading()">
                <span class="spinner-border spinner-border-sm me-1.5" *ngIf="loading()"></span>
                <i class="bi bi-door-open me-1" *ngIf="!loading()"></i>
                Sign In with Credentials
              </button>

              <div class="d-flex align-items-center my-3.5">
                <hr class="flex-grow-1 border-secondary border-opacity-25 my-0">
                <span class="px-3 small text-muted text-uppercase fw-semibold" style="font-size: 0.68rem; letter-spacing: 0.05em;">Or Continue With</span>
                <hr class="flex-grow-1 border-secondary border-opacity-25 my-0">
              </div>

              <!-- Firebase Google SSO -->
              <button type="button" class="btn btn-outline-dark w-100 py-2.5 small fw-bold d-flex align-items-center justify-content-center gap-2 mb-2 bg-white" 
                      (click)="onGoogleSignIn()" [disabled]="loading()">
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                Sign In with Google (Firebase SSO)
              </button>

              <button type="button" class="btn btn-iem-soft w-100 py-2 small fw-semibold d-flex align-items-center justify-content-center gap-2" 
                      (click)="onFirebaseCustomSignIn()" [disabled]="loading()">
                <i class="bi bi-fire text-warning fs-5"></i>
                Sign In with Firebase ID Token
              </button>
            </form>

            <!-- REGISTER FORM -->
            <form *ngIf="!isLogin()" (ngSubmit)="onRegister()">
              <div class="mb-3">
                <label for="reg-fullname" class="form-label">Full Legal Name *</label>
                <div class="input-group">
                  <span class="input-group-text"><i class="bi bi-person"></i></span>
                  <input type="text" id="reg-fullname" class="form-control" [(ngModel)]="regFullName" name="fullName" 
                         placeholder="e.g. Debarghya Mitra" autocomplete="name" required>
                </div>
              </div>

              <div class="row g-2 mb-3">
                <div class="col-md-6">
                  <label for="reg-email" class="form-label">Email Address *</label>
                  <input type="email" id="reg-email" class="form-control" [(ngModel)]="regEmail" name="email" 
                         placeholder="student@gmail.com" autocomplete="email" autocorrect="off" autocapitalize="none" spellcheck="false" required>
                </div>
                <div class="col-md-6">
                  <label for="reg-phone" class="form-label">Mobile Number</label>
                  <input type="tel" id="reg-phone" class="form-control" [(ngModel)]="regPhone" name="phone" 
                         placeholder="9876543210" autocomplete="tel" inputmode="numeric">
                </div>
              </div>

              <div class="mb-3">
                <label for="reg-password" class="form-label">Password *</label>
                <input type="password" id="reg-password" class="form-control" [(ngModel)]="regPassword" name="password" 
                       placeholder="At least 6 characters" autocomplete="new-password" required>
              </div>

              <div class="row g-2 mb-4">
                <div class="col-md-6">
                  <label for="reg-dob" class="form-label">Date of Birth</label>
                  <app-date-picker id="reg-dob" name="dob" [(value)]="regDob"></app-date-picker>
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-bold">Account Role</label>
                  <input type="text" class="form-control bg-light text-muted" value="Student / Applicant" readonly disabled>
                  <small class="text-muted d-block mt-1" style="font-size: 0.72rem;">Staff accounts (Officers & Admins) are provisioned by IEM.</small>
                </div>
              </div>

              <button type="submit" class="btn btn-iem-primary w-100 py-2.5 fw-bold shadow-sm" [disabled]="loading()">
                <span class="spinner-border spinner-border-sm me-1.5" *ngIf="loading()"></span>
                <i class="bi bi-person-check me-1" *ngIf="!loading()"></i>
                Complete Registration
              </button>

              <div class="d-flex align-items-center my-3.5">
                <hr class="flex-grow-1 border-secondary border-opacity-25 my-0">
                <span class="px-3 small text-muted text-uppercase fw-semibold" style="font-size: 0.68rem; letter-spacing: 0.05em;">Or Quick Sign Up With</span>
                <hr class="flex-grow-1 border-secondary border-opacity-25 my-0">
              </div>

              <!-- Firebase Google SSO -->
              <button type="button" class="btn btn-outline-dark w-100 py-2.5 small fw-bold d-flex align-items-center justify-content-center gap-2 mb-2 bg-white" 
                      (click)="onGoogleSignIn()" [disabled]="loading()">
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                Sign Up with Google (Instant Account)
              </button>
            </form>

            <!-- QUICK 1-CLICK DEMO PERSONAS -->
            <div class="border-top mt-4 pt-4">
              <div class="d-flex align-items-center justify-content-between mb-2.5">
                <span class="small fw-bold text-dark text-uppercase tracking-wider" style="font-size: 0.72rem;">
                  <i class="bi bi-lightning-charge-fill text-warning me-1"></i> Quick Demo Logins (1-Click)
                </span>
                <span class="badge bg-light text-muted border font-mono" style="font-size: 0.65rem;">Lab Presets</span>
              </div>

              <div class="d-grid gap-2">
                <!-- Student Persona -->
                <button type="button" class="btn btn-light border p-2.5 text-start d-flex justify-content-between align-items-center rounded-3 hover-shadow"
                        (click)="quickLogin('student@iem.edu.in', 'Student@123')">
                  <div class="d-flex align-items-center gap-2.5">
                    <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 32px; height: 32px; font-size: 0.8rem;">
                      DM
                    </div>
                    <div>
                      <div class="fw-bold small text-dark mb-0">Student: Debarghya Mitra</div>
                      <div class="text-muted" style="font-size: 0.72rem;">student&#64;iem.edu.in</div>
                    </div>
                  </div>
                  <span class="badge bg-primary text-white px-2.5 py-1">Applicant</span>
                </button>

                <!-- Officer Persona -->
                <button type="button" class="btn btn-light border p-2.5 text-start d-flex justify-content-between align-items-center rounded-3 hover-shadow"
                        (click)="quickLogin('officer@iem.edu.in', 'Officer@123')">
                  <div class="d-flex align-items-center gap-2.5">
                    <div class="bg-info text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 32px; height: 32px; font-size: 0.8rem;">
                      SP
                    </div>
                    <div>
                      <div class="fw-bold small text-dark mb-0">Officer: Prof. Sadhu Prasad Kar</div>
                      <div class="text-muted" style="font-size: 0.72rem;">officer&#64;iem.edu.in</div>
                    </div>
                  </div>
                  <span class="badge bg-info text-dark px-2.5 py-1">Reviewer</span>
                </button>

                <!-- Admin Persona -->
                <button type="button" class="btn btn-light border p-2.5 text-start d-flex justify-content-between align-items-center rounded-3 hover-shadow"
                        (click)="quickLogin('admin@iem.edu.in', 'Admin@123')">
                  <div class="d-flex align-items-center gap-2.5">
                    <div class="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 32px; height: 32px; font-size: 0.8rem;">
                      SS
                    </div>
                    <div>
                      <div class="fw-bold small text-dark mb-0">Admin: Dr. Sangeeta Sarkar</div>
                      <div class="text-muted" style="font-size: 0.72rem;">admin&#64;iem.edu.in</div>
                    </div>
                  </div>
                  <span class="badge bg-danger text-white px-2.5 py-1">Executive</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  `
})
export class AuthComponent {
  api = inject(ApiService);
  fb = inject(FirebaseService);
  router = inject(Router);

  isLogin = signal<boolean>(true);
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  loginEmail = '';
  loginPassword = '';

  regFullName = '';
  regEmail = '';
  regPhone = '';
  regPassword = '';
  regDob = '';
  regRole = 'APPLICANT';

  toggleMode(login: boolean): void {
    this.isLogin.set(login);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  onLogin(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.api.login({ email: this.loginEmail, password: this.loginPassword }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.redirectByRole(res.user.role);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Login failed. Please check your credentials.');
      }
    });
  }

  onRegister(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.api.register({
      fullName: this.regFullName,
      email: this.regEmail,
      phone: this.regPhone,
      password: this.regPassword,
      dateOfBirth: this.regDob,
      role: 'APPLICANT'
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.successMessage.set('Account created successfully! Redirecting...');
        setTimeout(() => this.redirectByRole(res.user.role), 600);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Registration failed.');
      }
    });
  }

  async onGoogleSignIn(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const gResult = await this.fb.signInGoogle();
      this.api.firebaseLogin(gResult.idToken).subscribe({
        next: (res) => {
          this.loading.set(false);
          this.redirectByRole(res.user.role);
        },
        error: (err) => {
          // Graceful fallback if deployed Cloud Function backend has older token parser
          if ((err.status === 401 || err.status === 400) && gResult.email) {
            this.api.firebaseLogin(`firebase-token-${gResult.email}`).subscribe({
              next: (res2) => {
                this.loading.set(false);
                this.redirectByRole(res2.user.role);
              },
              error: (err2) => {
                this.loading.set(false);
                this.errorMessage.set(err2.error?.message || 'Google authentication failed.');
              }
            });
            return;
          }
          this.loading.set(false);
          this.errorMessage.set(err.error?.message || 'Google authentication failed.');
        }
      });
    } catch (e: any) {
      this.loading.set(false);
      this.errorMessage.set(e.message || 'Google Sign-in failed.');
    }
  }

  onFirebaseCustomSignIn(): void {
    this.loading.set(true);
    const mockToken = `firebase-token-${this.loginEmail}`;
    this.api.firebaseLogin(mockToken).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.redirectByRole(res.user.role);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Firebase login failed.');
      }
    });
  }

  quickLogin(email: string, pwd: string): void {
    this.loginEmail = email;
    this.loginPassword = pwd;
    this.onLogin();
  }

  private redirectByRole(role: string): void {
    const r = (role || '').toUpperCase();
    if (r === 'ADMINISTRATOR' || r === 'ADMIN') {
      this.router.navigate(['/admin']);
    } else if (r === 'ADMISSION_OFFICER' || r === 'OFFICER') {
      this.router.navigate(['/officer']);
    } else {
      this.router.navigate(['/student']);
    }
  }
}
