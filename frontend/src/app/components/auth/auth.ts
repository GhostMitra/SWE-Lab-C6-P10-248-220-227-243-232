import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-md-8 col-lg-6">
          <div class="card card-custom border-0 shadow-lg p-4 p-md-5">
            <!-- Header -->
            <div class="text-center mb-4">
              <div class="bg-iem-primary text-white d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style="width: 54px; height: 54px;">
                <i class="bi bi-shield-lock-fill fs-3"></i>
              </div>
              <h3 class="fw-bold text-dark">{{ isLogin() ? 'Sign In to Portal' : 'Create Applicant Account' }}</h3>
              <p class="text-muted small">
                {{ isLogin() ? 'Enter your registered credentials, use Firebase Auth, or select a test role below' : 'Register to submit applications and track admission progress' }}
              </p>
            </div>

            <!-- Error / Success Alert -->
            <div class="alert alert-danger d-flex align-items-center gap-2 small" *ngIf="errorMessage()">
              <i class="bi bi-exclamation-triangle-fill"></i>
              <div>{{ errorMessage() }}</div>
            </div>
            <div class="alert alert-success d-flex align-items-center gap-2 small" *ngIf="successMessage()">
              <i class="bi bi-check-circle-fill"></i>
              <div>{{ successMessage() }}</div>
            </div>

            <!-- Tabs -->
            <ul class="nav nav-pills nav-fill mb-4 p-1 bg-light rounded-3">
              <li class="nav-item">
                <button class="nav-link py-2 fw-semibold" [class.active]="isLogin()" (click)="toggleMode(true)">
                  Sign In
                </button>
              </li>
              <li class="nav-item">
                <button class="nav-link py-2 fw-semibold" [class.active]="!isLogin()" (click)="toggleMode(false)">
                  New Registration
                </button>
              </li>
            </ul>

            <!-- LOGIN FORM -->
            <form *ngIf="isLogin()" (ngSubmit)="onLogin()">
              <div class="mb-3">
                <label class="form-label small fw-bold">Email Address</label>
                <div class="input-group">
                  <span class="input-group-text bg-white"><i class="bi bi-envelope"></i></span>
                  <input type="email" class="form-control" [(ngModel)]="loginEmail" name="email" placeholder="name@iem.edu.in" required>
                </div>
              </div>

              <div class="mb-4">
                <label class="form-label small fw-bold">Password</label>
                <div class="input-group">
                  <span class="input-group-text bg-white"><i class="bi bi-key"></i></span>
                  <input type="password" class="form-control" [(ngModel)]="loginPassword" name="password" placeholder="••••••••" required>
                </div>
              </div>

              <button type="submit" class="btn btn-iem-primary w-100 py-2.5 fw-bold mb-3" [disabled]="loading()">
                <span class="spinner-border spinner-border-sm me-1" *ngIf="loading()"></span>
                Sign In with Credentials
              </button>

              <div class="d-flex align-items-center my-3">
                <hr class="flex-grow-1">
                <span class="px-2 small text-muted text-uppercase" style="font-size: 0.68rem;">Or authenticate with</span>
                <hr class="flex-grow-1">
              </div>

              <button type="button" class="btn btn-outline-dark w-100 py-2.5 small fw-bold d-flex align-items-center justify-content-center gap-2 mb-2" (click)="onGoogleSignIn()" [disabled]="loading()">
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                Sign In with Google (Firebase)
              </button>

              <button type="button" class="btn btn-light border w-100 py-2 small fw-semibold d-flex align-items-center justify-content-center gap-2" (click)="onFirebaseCustomSignIn()" [disabled]="loading()">
                <i class="bi bi-fire text-warning fs-5"></i>
                Sign In with Firebase ID Token
              </button>
            </form>

            <!-- REGISTER FORM -->
            <form *ngIf="!isLogin()" (ngSubmit)="onRegister()">
              <div class="mb-3">
                <label class="form-label small fw-bold">Full Name</label>
                <input type="text" class="form-control" [(ngModel)]="regFullName" name="fullName" placeholder="e.g. Debarghya Mitra" required>
              </div>

              <div class="row g-2 mb-3">
                <div class="col-md-6">
                  <label class="form-label small fw-bold">Email Address</label>
                  <input type="email" class="form-control" [(ngModel)]="regEmail" name="email" placeholder="student@gmail.com" required>
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-bold">Mobile Number</label>
                  <input type="tel" class="form-control" [(ngModel)]="regPhone" name="phone" placeholder="9876543210">
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label small fw-bold">Password</label>
                <input type="password" class="form-control" [(ngModel)]="regPassword" name="password" placeholder="Minimum 6 characters" required>
              </div>

              <div class="row g-2 mb-4">
                <div class="col-md-6">
                  <label class="form-label small fw-bold">Date of Birth</label>
                  <input type="date" class="form-control" [(ngModel)]="regDob" name="dob">
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-bold">Account Role</label>
                  <select class="form-select" [(ngModel)]="regRole" name="role">
                    <option value="APPLICANT">Applicant / Student</option>
                    <option value="ADMISSION_OFFICER">Admission Officer</option>
                    <option value="ADMINISTRATOR">Administrator</option>
                  </select>
                </div>
              </div>

              <button type="submit" class="btn btn-iem-primary w-100 py-2.5 fw-bold" [disabled]="loading()">
                <span class="spinner-border spinner-border-sm me-1" *ngIf="loading()"></span>
                Complete Registration
              </button>
            </form>

            <!-- Quick Demo Credentials Box -->
            <div class="border-top mt-4 pt-4">
              <div class="text-center small fw-bold text-muted mb-2 text-uppercase tracking-wider">
                <i class="bi bi-lightning-charge-fill text-warning me-1"></i> Quick Demo Logins (1-Click)
              </div>
              <div class="d-grid gap-2">
                <button type="button" class="btn btn-sm btn-light border text-start d-flex justify-content-between align-items-center px-3 py-2"
                        (click)="quickLogin('student@iem.edu.in', 'Student@123')">
                  <div>
                    <div class="fw-bold small text-primary"><i class="bi bi-person-fill me-1"></i>Student / Applicant</div>
                    <div class="text-muted" style="font-size: 0.72rem;">student&#64;iem.edu.in (Debarghya Mitra)</div>
                  </div>
                  <span class="badge bg-primary">Sign In</span>
                </button>

                <button type="button" class="btn btn-sm btn-light border text-start d-flex justify-content-between align-items-center px-3 py-2"
                        (click)="quickLogin('officer@iem.edu.in', 'Officer@123')">
                  <div>
                    <div class="fw-bold small text-info"><i class="bi bi-person-check-fill me-1"></i>Admission Officer</div>
                    <div class="text-muted" style="font-size: 0.72rem;">officer&#64;iem.edu.in (Prof. Sadhu Prasad Kar)</div>
                  </div>
                  <span class="badge bg-info text-dark">Sign In</span>
                </button>

                <button type="button" class="btn btn-sm btn-light border text-start d-flex justify-content-between align-items-center px-3 py-2"
                        (click)="quickLogin('admin@iem.edu.in', 'Admin@123')">
                  <div>
                    <div class="fw-bold small text-danger"><i class="bi bi-shield-lock-fill me-1"></i>Administrator</div>
                    <div class="text-muted" style="font-size: 0.72rem;">admin&#64;iem.edu.in (Dr. Sangeeta Sarkar)</div>
                  </div>
                  <span class="badge bg-danger">Sign In</span>
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

  loginEmail = 'student@iem.edu.in';
  loginPassword = 'Student@123';

  regFullName = '';
  regEmail = '';
  regPhone = '';
  regPassword = '';
  regDob = '2004-06-15';
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
      role: this.regRole
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
    try {
      const idToken = await this.fb.signInGoogle();
      this.api.firebaseLogin(idToken).subscribe({
        next: (res) => {
          this.loading.set(false);
          this.redirectByRole(res.user.role);
        },
        error: (err) => {
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
