import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, Course } from '../../services/api.service';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-apply',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container py-4 my-2">
      
      <!-- WIZARD PROGRESS HEADER -->
      <div class="card card-modern border-0 p-4 mb-4 shadow-sm bg-white">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="badge bg-primary text-white font-mono px-2.5 py-1">OFFICIAL ADMISSIONS 2026–2027</span>
              <h3 class="fw-bold text-dark mb-0">Undergraduate & Postgraduate Application</h3>
            </div>
            <p class="text-muted small mb-0">
              Institute of Engineering & Management, Kolkata • Central Admissions Gateway
            </p>
          </div>
          <div>
            <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-3 py-1.5 fw-bold fs-7 rounded-pill">
              Step {{ currentStep() }} of 3: {{ currentStep() === 1 ? 'Profile & Marks' : (currentStep() === 2 ? 'Document Upload' : 'Fee Payment') }}
            </span>
          </div>
        </div>

        <!-- High-Contrast Interactive Stepper -->
        <div class="stepper-container mb-1 mt-4">
          <div class="stepper-step is-clickable" [class.completed]="currentStep() > 1" [class.active]="currentStep() === 1"
               (click)="goToStep(1)" role="button" tabindex="0" title="Go to Step 1: Application Details">
            <div class="stepper-circle">
              <i class="bi" [ngClass]="currentStep() > 1 ? 'bi-check-lg' : 'bi-person-fill'"></i>
            </div>
            <div class="stepper-title">1. Application Details</div>
          </div>

          <div class="stepper-step" [class.is-clickable]="canGoToStep(2)" [class.completed]="currentStep() > 2" [class.active]="currentStep() === 2"
               (click)="canGoToStep(2) && goToStep(2)" role="button" tabindex="0"
               [title]="canGoToStep(2) ? 'Go to Step 2: Document Uploads' : 'Complete Application Details first to unlock documents'">
            <div class="stepper-circle">
              <i class="bi" [ngClass]="currentStep() > 2 ? 'bi-check-lg' : 'bi-cloud-arrow-up-fill'"></i>
            </div>
            <div class="stepper-title">2. Document Uploads</div>
          </div>

          <div class="stepper-step" [class.is-clickable]="canGoToStep(3)" [class.completed]="paymentDone()" [class.active]="currentStep() === 3"
               (click)="canGoToStep(3) && goToStep(3)" role="button" tabindex="0"
               [title]="canGoToStep(3) ? 'Go to Step 3: Fee Payment' : 'Complete Step 1 & 2 to unlock fee payment'">
            <div class="stepper-circle">
              <i class="bi" [ngClass]="paymentDone() ? 'bi-check-lg' : 'bi-credit-card-fill'"></i>
            </div>
            <div class="stepper-title">3. Fee Payment</div>
          </div>
        </div>
      </div>

      <!-- Feedback Alerts -->
      <div class="alert alert-danger d-flex align-items-center gap-2.5 small rounded-3 py-3 px-3.5 mb-4 shadow-sm" *ngIf="errorMessage()">
        <i class="bi bi-exclamation-triangle-fill text-danger fs-4"></i>
        <div>
          <strong class="d-block text-dark">Submission Note:</strong>
          <span class="text-danger fw-semibold">{{ errorMessage() }}</span>
        </div>
      </div>

      <div class="alert alert-success d-flex align-items-center gap-2.5 small rounded-3 py-3 px-3.5 mb-4 shadow-sm" *ngIf="successMessage()">
        <i class="bi bi-check-circle-fill text-success fs-4"></i>
        <div>
          <strong class="d-block text-dark">Status:</strong>
          <span class="text-success fw-semibold">{{ successMessage() }}</span>
        </div>
      </div>

      <!-- ========================================================
           STEP 1: APPLICATION FORM DETAILS
           ======================================================== -->
      <div *ngIf="currentStep() === 1">
        
        <!-- Active Application Indicator (If already initiated) -->
        <div class="alert alert-primary d-flex flex-wrap justify-content-between align-items-center gap-2 rounded-3 py-2.5 px-3.5 mb-4 shadow-xs" *ngIf="activeAppId()">
          <div class="d-flex align-items-center gap-2.5">
            <i class="bi bi-info-circle-fill fs-4 text-primary"></i>
            <div>
              <strong class="text-dark">Active Application:</strong>
              <span class="font-mono fw-bold text-primary ms-1 fs-6">{{ activeAppId() }}</span>
              <span class="text-muted small ms-2 d-none d-md-inline">— You can edit any section below and navigate freely between sections.</span>
            </div>
          </div>
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-sm btn-outline-primary" (click)="goToStep(2)">
              <i class="bi bi-cloud-arrow-up me-1"></i> Go to Documents (Step 2)
            </button>
            <button type="button" class="btn btn-sm btn-iem-primary" (click)="goToStep(3)">
              <i class="bi bi-credit-card me-1"></i> Go to Payment (Step 3)
            </button>
          </div>
        </div>

        <!-- Quick Section Navigation Sub-Bar -->
        <div class="d-flex flex-wrap gap-2 mb-4 p-2 bg-white border rounded-pill justify-content-center shadow-xs">
          <button type="button" class="btn btn-sm px-3 rounded-pill" 
                  [class.btn-primary]="activeSubSection() === 1" 
                  [class.btn-light]="activeSubSection() !== 1" 
                  (click)="scrollToSection('sec-program', 1)">
            <i class="bi bi-mortarboard-fill me-1"></i> Section 1: Target Program
          </button>
          <button type="button" class="btn btn-sm px-3 rounded-pill" 
                  [class.btn-primary]="activeSubSection() === 2" 
                  [class.btn-light]="activeSubSection() !== 2" 
                  (click)="scrollToSection('sec-profile', 2)">
            <i class="bi bi-person-lines-fill me-1"></i> Section 2: Personal Profile
          </button>
          <button type="button" class="btn btn-sm px-3 rounded-pill" 
                  [class.btn-primary]="activeSubSection() === 3" 
                  [class.btn-light]="activeSubSection() !== 3" 
                  (click)="scrollToSection('sec-education', 3)">
            <i class="bi bi-award-fill me-1"></i> Section 3: Academic Marks
          </button>
        </div>

        <form (ngSubmit)="onSubmitStep1()">
          
          <!-- SECTION 1: PROGRAM SELECTION -->
          <div class="card card-modern border-0 p-4 mb-4 shadow-sm bg-white" id="sec-program">
            <div class="d-flex align-items-center gap-2.5 pb-3 mb-3 border-bottom">
              <div class="bg-primary text-white p-2 rounded-2 shadow-xs">
                <i class="bi bi-mortarboard-fill fs-5"></i>
              </div>
              <div>
                <h5 class="fw-bold text-dark mb-0">1. Target Academic Program</h5>
                <small class="text-muted">Choose your intended degree specialization for the 2026 academic batch</small>
              </div>
            </div>

            <div class="mb-3">
              <label for="apply-course" class="form-label">Select Degree Program *</label>
              <select id="apply-course" class="form-select form-select-lg" [(ngModel)]="form.courseId" name="courseId" required>
                <option [ngValue]="null" disabled selected>-- Select Degree Specialization --</option>
                <option *ngFor="let c of courses()" [ngValue]="c.courseId">
                  {{ c.courseName }} ({{ c.courseCode }}) — {{ c.degree }} | Fee: ₹{{ c.applicationFee }}
                </option>
              </select>
            </div>

            <!-- Selected Course Details Callout (If Selected) -->
            <div class="card border border-primary border-opacity-25 bg-light rounded-3 p-3 mt-2 shadow-xs" *ngIf="selectedCourseDetails()">
              <div class="row g-3 align-items-center">
                <div class="col-md-8">
                  <div class="d-flex align-items-center gap-2 mb-1">
                    <span class="badge bg-primary text-white font-mono px-2.5 py-1">{{ selectedCourseDetails()?.courseCode }}</span>
                    <strong class="text-dark">{{ selectedCourseDetails()?.courseName }}</strong>
                  </div>
                  <div class="text-muted small">
                    <i class="bi bi-shield-check text-primary me-1"></i>
                    <strong>Eligibility:</strong> {{ selectedCourseDetails()?.eligibilityCriteria }}
                  </div>
                </div>
                <div class="col-md-4 text-md-end border-start-md">
                  <div class="small text-muted">Intake Capacity: <strong>{{ selectedCourseDetails()?.seats }} Seats</strong></div>
                  <div class="small text-muted">Application Fee: <strong class="text-success fs-6">₹ {{ selectedCourseDetails()?.applicationFee }}</strong></div>
                </div>
              </div>
            </div>

            <!-- Section 1 Next Button -->
            <div class="d-flex justify-content-end pt-3 border-top mt-3">
              <button type="button" class="btn btn-sm btn-iem-primary" (click)="scrollToSection('sec-profile', 2)">
                Proceed to Personal Profile <i class="bi bi-arrow-down ms-1"></i>
              </button>
            </div>
          </div>

          <!-- SECTION 2: CANDIDATE & GUARDIAN PROFILE -->
          <div class="card card-modern border-0 p-4 mb-4 shadow-sm bg-white" id="sec-profile">
            <div class="d-flex align-items-center gap-2.5 pb-3 mb-3 border-bottom">
              <div class="bg-primary text-white p-2 rounded-2 shadow-xs">
                <i class="bi bi-person-lines-fill fs-5"></i>
              </div>
              <div>
                <h5 class="fw-bold text-dark mb-0">2. Personal & Guardian Profile</h5>
                <small class="text-muted">Enter contact and demographic details as per government ID</small>
              </div>
            </div>

            <div class="row g-3">
              <!-- Date of Birth -->
              <div class="col-md-4">
                <label for="apply-dob" class="form-label">Date of Birth *</label>
                <div class="input-group">
                  <span class="input-group-text"><i class="bi bi-calendar-event"></i></span>
                  <input type="date" id="apply-dob" class="form-control" [(ngModel)]="form.dateOfBirth" name="dateOfBirth"
                         min="1990-01-01" max="2012-12-31" required>
                </div>
              </div>

              <!-- Gender -->
              <div class="col-md-4">
                <label for="apply-gender" class="form-label">Gender *</label>
                <div class="input-group">
                  <span class="input-group-text"><i class="bi bi-gender-ambiguous"></i></span>
                  <select id="apply-gender" class="form-select" [(ngModel)]="form.gender" name="gender" required>
                    <option value="" disabled selected>-- Select Gender --</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <!-- Guardian Name -->
              <div class="col-md-4">
                <label for="apply-guardian" class="form-label">Parent / Guardian Legal Name *</label>
                <div class="input-group">
                  <span class="input-group-text"><i class="bi bi-person-fill"></i></span>
                  <input type="text" id="apply-guardian" class="form-control" [(ngModel)]="form.guardianName" name="guardianName" 
                         placeholder="e.g. Subhas Mitra" autocomplete="name" required>
                </div>
              </div>

              <!-- Guardian Phone -->
              <div class="col-md-4">
                <label for="apply-guardian-phone" class="form-label">Guardian Mobile Number *</label>
                <div class="input-group">
                  <span class="input-group-text"><i class="bi bi-telephone-fill"></i></span>
                  <input type="tel" id="apply-guardian-phone" class="form-control" [(ngModel)]="form.guardianPhone" name="guardianPhone" 
                         placeholder="10-digit mobile number" autocomplete="tel" inputmode="numeric" required>
                </div>
              </div>

              <!-- Residential Address -->
              <div class="col-md-8">
                <label for="apply-address" class="form-label">Permanent Residential Address *</label>
                <div class="input-group">
                  <span class="input-group-text"><i class="bi bi-geo-alt-fill"></i></span>
                  <input type="text" id="apply-address" class="form-control" [(ngModel)]="form.address" name="address" 
                         placeholder="House/Flat No, Street, City, PIN Code, State" autocomplete="street-address" required>
                </div>
              </div>
            </div>

            <!-- Section 2 Nav Buttons -->
            <div class="d-flex justify-content-between pt-3 border-top mt-3">
              <button type="button" class="btn btn-sm btn-iem-outline" (click)="scrollToSection('sec-program', 1)">
                <i class="bi bi-arrow-up me-1"></i> Previous: Academic Program
              </button>
              <button type="button" class="btn btn-sm btn-iem-primary" (click)="scrollToSection('sec-education', 3)">
                Proceed to Academic Qualifications <i class="bi bi-arrow-down ms-1"></i>
              </button>
            </div>
          </div>

          <!-- SECTION 3: EDUCATIONAL QUALIFICATIONS (10TH & 12TH) -->
          <div class="card card-modern border-0 p-4 mb-4 shadow-sm bg-white" id="sec-education">
            <div class="d-flex align-items-center gap-2.5 pb-3 mb-3 border-bottom">
              <div class="bg-primary text-white p-2 rounded-2 shadow-xs">
                <i class="bi bi-award-fill fs-5"></i>
              </div>
              <div>
                <h5 class="fw-bold text-dark mb-0">3. Educational Qualifications</h5>
                <small class="text-muted">Enter secondary (10th) and higher secondary (12th) board exam performance</small>
              </div>
            </div>

            <div class="row g-4">
              
              <!-- 10th Secondary Box -->
              <div class="col-lg-6">
                <div class="p-3.5 bg-light rounded-3 border h-100">
                  <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="fw-bold text-primary mb-0">
                      <i class="bi bi-1-circle-fill me-1"></i> Class 10th (Secondary Board)
                    </h6>
                    <span class="badge bg-secondary bg-opacity-20 text-dark font-mono">10th Std</span>
                  </div>

                  <div class="mb-3">
                    <label for="apply-10th-board" class="form-label">Board of Examination *</label>
                    <input type="text" id="apply-10th-board" class="form-control" [(ngModel)]="form.tenthBoard" name="tenthBoard" 
                           placeholder="CBSE / ICSE / West Bengal Board" required>
                  </div>

                  <div class="row g-2">
                    <div class="col-6">
                      <label for="apply-10th-year" class="form-label">Passing Year *</label>
                      <input type="number" id="apply-10th-year" class="form-control" [(ngModel)]="form.tenthYear" name="tenthYear" 
                             placeholder="e.g. 2022" inputmode="numeric" required>
                    </div>
                    <div class="col-6">
                      <label for="apply-10th-pct" class="form-label">Aggregate % *</label>
                      <input type="number" step="0.01" id="apply-10th-pct" class="form-control" [(ngModel)]="form.tenthPercentage" name="tenthPercentage" 
                             placeholder="e.g. 91.5" inputmode="decimal" required>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 12th Higher Secondary Box -->
              <div class="col-lg-6">
                <div class="p-3.5 bg-light rounded-3 border h-100">
                  <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="fw-bold text-primary mb-0">
                      <i class="bi bi-2-circle-fill me-1"></i> Class 12th (Higher Secondary)
                    </h6>
                    <span class="badge bg-secondary bg-opacity-20 text-dark font-mono">12th Std / Diploma</span>
                  </div>

                  <div class="row g-2 mb-3">
                    <div class="col-7">
                      <label for="apply-12th-board" class="form-label">Board of Examination *</label>
                      <input type="text" id="apply-12th-board" class="form-control" [(ngModel)]="form.twelfthBoard" name="twelfthBoard" 
                             placeholder="CBSE / ISC / State Board" required>
                    </div>
                    <div class="col-5">
                      <label for="apply-12th-stream" class="form-label">Stream *</label>
                      <input type="text" id="apply-12th-stream" class="form-control" [(ngModel)]="form.twelfthStream" name="twelfthStream" 
                             placeholder="Science (PCM)" required>
                    </div>
                  </div>

                  <div class="row g-2">
                    <div class="col-6">
                      <label for="apply-12th-year" class="form-label">Passing Year *</label>
                      <input type="number" id="apply-12th-year" class="form-control" [(ngModel)]="form.twelfthYear" name="twelfthYear" 
                             placeholder="e.g. 2024" inputmode="numeric" required>
                    </div>
                    <div class="col-6">
                      <label for="apply-12th-pct" class="form-label">Aggregate % *</label>
                      <input type="number" step="0.01" id="apply-12th-pct" class="form-control" [(ngModel)]="form.twelfthPercentage" name="twelfthPercentage" 
                             placeholder="e.g. 93.4" inputmode="decimal" required>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <!-- Dynamic Projected Merit Score Calculation Callout -->
            <div class="p-3 bg-light rounded-3 border border-success border-opacity-30 mt-3.5 shadow-xs" *ngIf="projectedMeritScore()">
              <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
                <div class="d-flex align-items-center gap-2">
                  <i class="bi bi-calculator-fill text-success fs-4"></i>
                  <div>
                    <strong class="text-dark">Projected Composite Merit Score:</strong>
                    <div class="small text-muted font-mono">
                      Formula: (60% × {{ form.twelfthPercentage }}%) + (40% × {{ form.tenthPercentage }}%)
                    </div>
                  </div>
                </div>
                <div>
                  <span class="badge bg-success fs-5 px-3 py-1.5 shadow-xs">
                    {{ projectedMeritScore() }} Points
                  </span>
                </div>
              </div>
            </div>

            <!-- Section 3 Prev Button -->
            <div class="d-flex justify-content-start pt-3 border-top mt-3">
              <button type="button" class="btn btn-sm btn-iem-outline" (click)="scrollToSection('sec-profile', 2)">
                <i class="bi bi-arrow-up me-1"></i> Previous: Personal Profile
              </button>
            </div>

          </div>

          <!-- ACTIONS FOOTER -->
          <div class="card card-modern border-0 p-3.5 shadow-sm bg-white">
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
              <button type="button" class="btn btn-iem-outline" (click)="saveNoSqlDraft()">
                <i class="bi bi-cloud-arrow-down me-1.5 text-warning"></i> Auto-Save Draft to Firestore
              </button>
              
              <div class="d-flex gap-2">
                <button type="button" class="btn btn-outline-secondary" *ngIf="activeAppId()" (click)="goToStep(2)">
                  Skip to Documents <i class="bi bi-arrow-right ms-1"></i>
                </button>
                <button type="submit" class="btn btn-iem-primary btn-lg px-4 py-2.5 fw-bold shadow-sm" [disabled]="loading()">
                  <span class="spinner-border spinner-border-sm me-1.5" *ngIf="loading()"></span>
                  <i class="bi bi-arrow-right-circle me-1" *ngIf="!loading()"></i>
                  {{ activeAppId() ? 'Save Changes & Proceed to Documents' : 'Submit Details & Proceed to Documents' }}
                </button>
              </div>
            </div>
          </div>

        </form>
      </div>

      <!-- ========================================================
           STEP 2: DOCUMENT UPLOAD INTERFACE (STORAGE BUCKET)
           ======================================================== -->
      <div *ngIf="currentStep() === 2">
        <div class="card card-modern border-0 p-4 p-md-5 mb-4 shadow-sm bg-white">
          
          <div class="alert alert-info py-3 px-3.5 mb-4 small d-flex align-items-center gap-3 rounded-3 shadow-xs">
            <i class="bi bi-cloud-arrow-up-fill fs-3 text-info"></i>
            <div>
              <strong class="text-dark">Cloud Storage Bucket (Direct Stream):</strong> 
              Your marksheets are stored securely in 
              <code class="text-primary font-mono fw-bold">gs://iem-admission-404bn.firebasestorage.app</code> and cataloged in Firebase Cloud Firestore.
            </div>
          </div>

          <!-- SECTION 1: SEPARATE PHOTO AND SIGNATURE UPLOADS -->
          <div class="mb-4">
            <h6 class="fw-bold text-dark mb-2">
              <i class="bi bi-person-badge text-primary me-2"></i>Mandatory Identity Media (Separate Uploads)
            </h6>
            <div class="row g-3">
              <!-- Dedicated Photo Upload Card -->
              <div class="col-md-6">
                <div class="card h-100 p-3 shadow-sm rounded-3 border" [ngClass]="hasPhoto() ? 'border-success bg-success bg-opacity-10' : 'border-secondary-subtle bg-light'">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="fw-bold text-dark">
                      <i class="bi bi-camera-fill text-primary me-1"></i> Passport Photograph *
                    </span>
                    <span class="badge" [ngClass]="hasPhoto() ? 'bg-success' : 'bg-danger'">
                      <i class="bi" [ngClass]="hasPhoto() ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                      {{ hasPhoto() ? 'UPLOADED' : 'REQUIRED' }}
                    </span>
                  </div>
                  <p class="small text-muted mb-2" style="font-size: 0.8rem;">
                    Recent color passport-size photograph (JPG, PNG - Max 5MB).
                  </p>

                  <div *ngIf="getDoc('PHOTO')" class="d-flex align-items-center justify-content-between p-2 mb-2 bg-white rounded border">
                    <div class="d-flex align-items-center gap-2 text-truncate me-2">
                      <i class="bi bi-file-earmark-image-fill text-success fs-5"></i>
                      <div class="text-truncate">
                        <div class="small fw-bold text-truncate">{{ getDoc('PHOTO')?.fileName }}</div>
                        <span class="text-muted" style="font-size: 0.72rem;">{{ (getDoc('PHOTO')?.fileSize / 1024) | number:'1.0-1' }} KB &bull; candidate-media</span>
                      </div>
                    </div>
                    <a [href]="api.getFileUrl(getDoc('PHOTO')?.filePath)" target="_blank" class="btn btn-sm btn-outline-primary py-0 px-2" style="font-size: 0.75rem;">
                      <i class="bi bi-eye"></i> View
                    </a>
                  </div>

                  <div class="input-group input-group-sm mt-auto">
                    <input type="file" class="form-control" accept="image/png, image/jpeg, image/jpg" (change)="onPhotoFileSelected($event)">
                    <button class="btn btn-iem-primary fw-bold" type="button" (click)="uploadPhoto()" [disabled]="uploadingPhoto() || !photoFile">
                      <span class="spinner-border spinner-border-sm me-1" *ngIf="uploadingPhoto()"></span>
                      <i class="bi bi-upload me-1" *ngIf="!uploadingPhoto()"></i>Upload Photo
                    </button>
                  </div>
                </div>
              </div>

              <!-- Dedicated Signature Upload Card -->
              <div class="col-md-6">
                <div class="card h-100 p-3 shadow-sm rounded-3 border" [ngClass]="hasSignature() ? 'border-success bg-success bg-opacity-10' : 'border-secondary-subtle bg-light'">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="fw-bold text-dark">
                      <i class="bi bi-pen-fill text-primary me-1"></i> Candidate Signature *
                    </span>
                    <span class="badge" [ngClass]="hasSignature() ? 'bg-success' : 'bg-danger'">
                      <i class="bi" [ngClass]="hasSignature() ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                      {{ hasSignature() ? 'UPLOADED' : 'REQUIRED' }}
                    </span>
                  </div>
                  <p class="small text-muted mb-2" style="font-size: 0.8rem;">
                    Candidate signature on white paper (JPG, PNG - Max 5MB).
                  </p>

                  <div *ngIf="getDoc('SIGNATURE')" class="d-flex align-items-center justify-content-between p-2 mb-2 bg-white rounded border">
                    <div class="d-flex align-items-center gap-2 text-truncate me-2">
                      <i class="bi bi-pen text-success fs-5"></i>
                      <div class="text-truncate">
                        <div class="small fw-bold text-truncate">{{ getDoc('SIGNATURE')?.fileName }}</div>
                        <span class="text-muted" style="font-size: 0.72rem;">{{ (getDoc('SIGNATURE')?.fileSize / 1024) | number:'1.0-1' }} KB &bull; candidate-media</span>
                      </div>
                    </div>
                    <a [href]="api.getFileUrl(getDoc('SIGNATURE')?.filePath)" target="_blank" class="btn btn-sm btn-outline-primary py-0 px-2" style="font-size: 0.75rem;">
                      <i class="bi bi-eye"></i> View
                    </a>
                  </div>

                  <div class="input-group input-group-sm mt-auto">
                    <input type="file" class="form-control" accept="image/png, image/jpeg, image/jpg" (change)="onSignatureFileSelected($event)">
                    <button class="btn btn-iem-primary fw-bold" type="button" (click)="uploadSignature()" [disabled]="uploadingSignature() || !signatureFile">
                      <span class="spinner-border spinner-border-sm me-1" *ngIf="uploadingSignature()"></span>
                      <i class="bi bi-upload me-1" *ngIf="!uploadingSignature()"></i>Upload Signature
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- SECTION 2: ACADEMIC & VERIFICATION DOCUMENTS -->
          <div class="row g-4 mb-4">
            
            <!-- Upload Box -->
            <div class="col-lg-5">
              <div class="p-4 bg-light rounded-4 border shadow-xs h-100">
                <h5 class="fw-bold text-dark mb-3">
                  <i class="bi bi-upload text-primary me-2"></i> Upload Certificate File
                </h5>
                
                <div class="mb-3">
                  <label for="doc-type" class="form-label">Document Category *</label>
                  <select id="doc-type" class="form-select" [(ngModel)]="uploadDocType">
                    <option value="MARKSHEET_10">Class 10th Secondary Marksheet (PDF) *</option>
                    <option value="MARKSHEET_12">Class 12th Higher Secondary Marksheet (PDF) *</option>
                    <option value="PHOTO">Passport Photograph (JPG / PNG) *</option>
                    <option value="PHOTO_ID">Government Photo ID (Aadhaar / Passport) *</option>
                    <option value="SIGNATURE">Candidate Signature (JPG / PNG) *</option>
                    <option value="OTHER_CERTIFICATE">Other Supporting Certificate (Optional)</option>
                  </select>
                </div>

                <div class="mb-4">
                  <label for="doc-file" class="form-label">Choose Document File (PDF, PNG, JPG - Max 10MB) *</label>
                  <input type="file" id="doc-file" class="form-control" (change)="onFileSelected($event)">
                </div>

                <button type="button" class="btn btn-iem-primary btn-lg w-100 py-2.5 fw-bold shadow-sm" 
                        (click)="onUploadFile()" [disabled]="uploading() || !selectedFile">
                  <span class="spinner-border spinner-border-sm me-1.5" *ngIf="uploading()"></span>
                  <i class="bi bi-cloud-upload me-1.5" *ngIf="!uploading()"></i>
                  Upload to Storage Bucket
                </button>
              </div>
            </div>

            <!-- Uploaded Table -->
            <div class="col-lg-7">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="fw-bold text-dark mb-0">Uploaded Documents for Application {{ activeAppId() }}</h5>
                <span class="badge bg-light text-dark border font-mono px-2.5 py-1">{{ uploadedDocs().length }} Stored</span>
              </div>

              <div class="table-modern-wrapper shadow-xs" *ngIf="uploadedDocs().length > 0; else noDocsTable">
                <table class="table-modern">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>File Name</th>
                      <th>Size</th>
                      <th class="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let d of uploadedDocs()">
                      <td><span class="badge bg-secondary bg-opacity-20 text-dark font-mono border">{{ d.docType }}</span></td>
                      <td class="fw-semibold">{{ d.fileName }}</td>
                      <td class="small text-muted">{{ (d.fileSize / 1024) | number:'1.1-1' }} KB</td>
                      <td class="text-end">
                        <a [href]="api.getFileUrl(d.filePath)" target="_blank" class="btn btn-sm btn-outline-primary py-1 px-2.5" style="font-size: 0.78rem;">
                          <i class="bi bi-eye me-1"></i> View
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <ng-template #noDocsTable>
                <div class="alert alert-light border text-center py-5 text-muted small rounded-3">
                  <i class="bi bi-file-earmark-arrow-up fs-1 text-secondary d-block mb-2"></i>
                  <h6 class="fw-bold text-dark">No documents uploaded yet</h6>
                  Please upload all 5 mandatory documents (10th & 12th marksheets, Photo, Photo ID, Signature) to satisfy admission readiness.
                </div>
              </ng-template>
            </div>

          </div>

          <!-- Document Prerequisite Notice for Payment -->
          <div class="alert mt-3 mb-3" [ngClass]="hasRequiredDocs() ? 'alert-success border-success' : 'alert-warning border-warning'">
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div>
                <strong><i class="bi" [ngClass]="hasRequiredDocs() ? 'bi-check-circle-fill text-success' : 'bi-exclamation-triangle-fill text-warning'"></i>
                Prerequisites for Fee Payment:</strong>
                <span *ngIf="!hasRequiredDocs()" class="ms-1 text-danger fw-semibold">Upload all 5 mandatory documents (10th & 12th Marksheets, Photo, Photo ID, Signature) to unlock payment.</span>
                <span *ngIf="hasRequiredDocs()" class="ms-1 text-success fw-semibold">All mandatory documents uploaded. Payment is unlocked.</span>
              </div>
              <div class="d-flex flex-wrap gap-2">
                <span class="badge" [ngClass]="has10thMarksheet() ? 'bg-success' : 'bg-danger'">
                  <i class="bi" [ngClass]="has10thMarksheet() ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                  10th: {{ has10thMarksheet() ? 'OK' : 'REQUIRED' }}
                </span>
                <span class="badge" [ngClass]="has12thMarksheet() ? 'bg-success' : 'bg-danger'">
                  <i class="bi" [ngClass]="has12thMarksheet() ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                  12th: {{ has12thMarksheet() ? 'OK' : 'REQUIRED' }}
                </span>
                <span class="badge" [ngClass]="hasPhoto() ? 'bg-success' : 'bg-danger'">
                  <i class="bi" [ngClass]="hasPhoto() ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                  Photo: {{ hasPhoto() ? 'OK' : 'REQUIRED' }}
                </span>
                <span class="badge" [ngClass]="hasPhotoId() ? 'bg-success' : 'bg-danger'">
                  <i class="bi" [ngClass]="hasPhotoId() ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                  ID: {{ hasPhotoId() ? 'OK' : 'REQUIRED' }}
                </span>
                <span class="badge" [ngClass]="hasSignature() ? 'bg-success' : 'bg-danger'">
                  <i class="bi" [ngClass]="hasSignature() ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                  Signature: {{ hasSignature() ? 'OK' : 'REQUIRED' }}
                </span>
              </div>
            </div>
          </div>

          <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 pt-3 border-top">
            <button type="button" class="btn btn-iem-outline" (click)="goToStep(1)">
              <i class="bi bi-arrow-left me-1"></i> Previous: Application Details (Step 1)
            </button>
            <button type="button" class="btn btn-iem-primary btn-lg px-4 py-2.5 fw-bold shadow-sm" (click)="goToStep(3)" [disabled]="!hasRequiredDocs()">
              <i class="bi bi-lock-fill me-1" *ngIf="!hasRequiredDocs()"></i>
              Proceed to Fee Payment <i class="bi bi-arrow-right ms-1"></i>
            </button>
          </div>

        </div>
      </div>

      <!-- ========================================================
           STEP 3: FEE PAYMENT GATEWAY CHECKOUT
           ======================================================== -->
      <div *ngIf="currentStep() === 3">
        <!-- When required documents are missing -->
        <div *ngIf="!hasRequiredDocs() && !paymentDone()" class="row justify-content-center my-4">
          <div class="col-md-8">
            <div class="p-4 bg-light rounded-4 border text-center shadow-sm">
              <i class="bi bi-shield-lock-fill text-danger display-4 d-block mb-3"></i>
              <h5 class="fw-bold text-danger">Fee Payment Locked</h5>
              <p class="text-muted mb-3">
                You cannot proceed with fee payment until you have uploaded all 5 mandatory admission documents:
              </p>
              <div class="d-flex flex-wrap justify-content-center gap-2 mb-4">
                <span class="badge p-2" [ngClass]="has10thMarksheet() ? 'bg-success' : 'bg-danger'">
                  <i class="bi" [ngClass]="has10thMarksheet() ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                  10th Marksheet: {{ has10thMarksheet() ? 'UPLOADED' : 'REQUIRED' }}
                </span>
                <span class="badge p-2" [ngClass]="has12thMarksheet() ? 'bg-success' : 'bg-danger'">
                  <i class="bi" [ngClass]="has12thMarksheet() ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                  12th Marksheet: {{ has12thMarksheet() ? 'UPLOADED' : 'REQUIRED' }}
                </span>
                <span class="badge p-2" [ngClass]="hasPhoto() ? 'bg-success' : 'bg-danger'">
                  <i class="bi" [ngClass]="hasPhoto() ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                  Passport Photo: {{ hasPhoto() ? 'UPLOADED' : 'REQUIRED' }}
                </span>
                <span class="badge p-2" [ngClass]="hasPhotoId() ? 'bg-success' : 'bg-danger'">
                  <i class="bi" [ngClass]="hasPhotoId() ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                  Photo ID: {{ hasPhotoId() ? 'UPLOADED' : 'REQUIRED' }}
                </span>
                <span class="badge p-2" [ngClass]="hasSignature() ? 'bg-success' : 'bg-danger'">
                  <i class="bi" [ngClass]="hasSignature() ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                  Signature: {{ hasSignature() ? 'UPLOADED' : 'REQUIRED' }}
                </span>
              </div>
              <button type="button" class="btn btn-iem-primary fw-bold" (click)="goToStep(2)">
                <i class="bi bi-cloud-arrow-up-fill me-1"></i> Upload Required Documents Now
              </button>
            </div>
          </div>
        </div>

        <!-- When documents are uploaded or payment already completed -->
        <div *ngIf="hasRequiredDocs() || paymentDone()">
          <div *ngIf="!paymentDone(); else receiptTpl">
          
            <div class="row g-4 justify-content-center mb-4">
              <div class="col-lg-8">
                
                <div class="card card-modern border-0 p-4 p-md-5 shadow-sm bg-white">
                  
                  <div class="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                    <div class="d-flex align-items-center gap-2.5">
                      <div class="bg-success text-white p-2.5 rounded-3 shadow-xs">
                        <i class="bi bi-shield-check fs-4"></i>
                    </div>
                    <div>
                      <h4 class="fw-bold text-dark mb-0">IEM Payment Gateway Checkout</h4>
                      <small class="text-muted">256-Bit Encrypted Payment Authorization</small>
                    </div>
                  </div>
                  <span class="badge bg-warning text-dark fw-bold px-3 py-1.5">Test Sandbox Active</span>
                </div>

                <!-- Order Summary Breakdown -->
                <div class="bg-light p-4 rounded-3 border mb-4">
                  <div class="d-flex justify-content-between small mb-2">
                    <span class="text-muted">Application Ref ID:</span>
                    <strong class="font-mono text-primary fs-6">{{ activeAppId() }}</strong>
                  </div>
                  <div class="d-flex justify-content-between small mb-2">
                    <span class="text-muted">Candidate Legal Name:</span>
                    <strong class="text-dark">{{ api.currentUser()?.fullName }}</strong>
                  </div>
                  <div class="d-flex justify-content-between small mb-2">
                    <span class="text-muted">Registered Email:</span>
                    <span class="text-dark font-mono">{{ api.currentUser()?.email }}</span>
                  </div>
                  <hr class="my-2.5">
                  <div class="d-flex justify-content-between align-items-center">
                    <span class="fw-bold text-dark fs-6">Application Processing Fee:</span>
                    <span class="fs-3 fw-extrabold text-success">₹ 1,000.00</span>
                  </div>
                </div>

                <!-- Payment Method Selector -->
                <div class="mb-4">
                  <label class="form-label mb-2">Select Payment Method *</label>
                  <div class="d-grid gap-2.5">
                    
                    <div class="p-3 border rounded-3 bg-white d-flex align-items-center gap-3 cursor-pointer shadow-xs"
                         [class.border-primary]="paymentMethod === 'UPI'"
                         [class.bg-light]="paymentMethod === 'UPI'">
                      <input class="form-check-input mt-0 ms-1" type="radio" name="payMethod" value="UPI" [(ngModel)]="paymentMethod" id="m1">
                      <label class="form-check-label small fw-bold text-dark w-100 cursor-pointer" for="m1">
                        <i class="bi bi-qr-code text-primary fs-5 me-2 align-middle"></i>
                        UPI Instant (Google Pay, PhonePe, Paytm, BHIM QR)
                      </label>
                    </div>

                    <div class="p-3 border rounded-3 bg-white d-flex align-items-center gap-3 cursor-pointer shadow-xs"
                         [class.border-primary]="paymentMethod === 'CARD'"
                         [class.bg-light]="paymentMethod === 'CARD'">
                      <input class="form-check-input mt-0 ms-1" type="radio" name="payMethod" value="CARD" [(ngModel)]="paymentMethod" id="m2">
                      <label class="form-check-label small fw-bold text-dark w-100 cursor-pointer" for="m2">
                        <i class="bi bi-credit-card-2-back-fill text-primary fs-5 me-2 align-middle"></i>
                        Credit / Debit Card (Visa, MasterCard, RuPay)
                      </label>
                    </div>

                    <div class="p-3 border rounded-3 bg-white d-flex align-items-center gap-3 cursor-pointer shadow-xs"
                         [class.border-primary]="paymentMethod === 'NETBANKING'"
                         [class.bg-light]="paymentMethod === 'NETBANKING'">
                      <input class="form-check-input mt-0 ms-1" type="radio" name="payMethod" value="NETBANKING" [(ngModel)]="paymentMethod" id="m3">
                      <label class="form-check-label small fw-bold text-dark w-100 cursor-pointer" for="m3">
                        <i class="bi bi-bank text-primary fs-5 me-2 align-middle"></i>
                        Internet Banking (SBI, HDFC, ICICI, Axis Bank)
                      </label>
                    </div>

                  </div>
                </div>

                <!-- Simulate failure toggle for testing -->
                <div class="form-check form-switch mb-4 small bg-light p-3 rounded-3 border">
                  <input class="form-check-input ms-0 me-2.5" type="checkbox" id="simFail" [(ngModel)]="simulateFailure">
                  <label class="form-check-label text-dark fw-semibold" for="simFail">
                    Simulate Gateway Decline / Insufficient Funds (for TC-S05 testing)
                  </label>
                </div>

                <button type="button" class="btn btn-success btn-lg w-100 py-3 fw-bold shadow" 
                        (click)="onPayFee()" [disabled]="processingPayment()">
                  <span class="spinner-border spinner-border-sm me-1.5" *ngIf="processingPayment()"></span>
                  <i class="bi bi-lock-fill me-1.5" *ngIf="!processingPayment()"></i>
                  Authorize & Settle ₹ 1,000.00
                </button>

              </div>

            </div>
          </div>

          <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 pt-3 border-top">
            <div class="d-flex flex-wrap gap-2">
              <button type="button" class="btn btn-iem-outline" (click)="goToStep(1)">
                <i class="bi bi-arrow-left me-1"></i> Previous: Application Details
              </button>
              <button type="button" class="btn btn-iem-outline" (click)="goToStep(2)">
                <i class="bi bi-arrow-left me-1"></i> Previous: Document Uploads
              </button>
            </div>
          </div>
        </div>

        <!-- PAYMENT SUCCESS RECEIPT -->
        <ng-template #receiptTpl>
          <div class="row justify-content-center">
            <div class="col-md-8 col-lg-6">
              
              <div class="card card-modern p-4 p-md-5 border-0 shadow-lg text-center bg-white">
                <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 shadow"
                     style="width: 64px; height: 64px; font-size: 2rem;">
                  <i class="bi bi-patch-check-fill"></i>
                </div>
                
                <h4 class="fw-bold text-dark mb-1">Fee Payment Settled Successfully!</h4>
                <p class="text-muted small mb-4">
                  Your application fee has been credited to the IEM Central Admissions Directorate ledger.
                </p>

                <div class="bg-light p-3.5 rounded-3 border text-start mb-4 font-mono small">
                  <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted">Invoice No:</span>
                    <strong class="text-dark">{{ paymentReceipt()?.receiptNo }}</strong>
                  </div>
                  <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted">Transaction ID:</span>
                    <strong class="text-primary">{{ paymentReceipt()?.transactionId }}</strong>
                  </div>
                  <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted">Application Ref:</span>
                    <strong class="text-dark">{{ paymentReceipt()?.applicationId }}</strong>
                  </div>
                  <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted">Amount Paid:</span>
                    <strong class="text-success fs-6">₹ {{ paymentReceipt()?.amount }}</strong>
                  </div>
                  <div class="d-flex justify-content-between pt-2 border-top">
                    <span class="text-muted">Gateway Status:</span>
                    <span class="badge bg-success">SUCCESS (SETTLED)</span>
                  </div>
                </div>

                <div class="d-flex gap-2 justify-content-center">
                  <a routerLink="/student" class="btn btn-iem-primary px-4 py-2.5 shadow-sm">
                    <i class="bi bi-speedometer2 me-1.5"></i> Go to Student Dashboard
                  </a>
                </div>
              </div>

            </div>
          </div>
        </ng-template>

      </div>

    </div>
  `
})
export class ApplyComponent implements OnInit {
  api = inject(ApiService);
  fb = inject(FirebaseService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  courses = signal<Course[]>([]);
  currentStep = signal<number>(1);
  activeSubSection = signal<number>(1);
  activeAppId = signal<string>('');
  loading = signal<boolean>(false);
  uploading = signal<boolean>(false);
  processingPayment = signal<boolean>(false);
  paymentDone = signal<boolean>(false);
  paymentReceipt = signal<any>(null);

  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  uploadedDocs = signal<any[]>([]);
  uploadDocType = 'MARKSHEET_10';
  selectedFile: File | null = null;
  photoFile: File | null = null;
  signatureFile: File | null = null;
  uploadingPhoto = signal<boolean>(false);
  uploadingSignature = signal<boolean>(false);

  paymentMethod = 'UPI';
  simulateFailure = false;

  form: any = {
    courseId: null,
    dateOfBirth: '',
    gender: '',
    guardianName: '',
    guardianPhone: '',
    address: '',
    tenthBoard: '',
    tenthYear: null,
    tenthPercentage: null,
    twelfthBoard: '',
    twelfthYear: null,
    twelfthPercentage: null,
    twelfthStream: ''
  };

  selectedCourseDetails = computed(() => {
    const id = this.form.courseId;
    if (!id) return null;
    return this.courses().find(c => c.courseId === Number(id)) || null;
  });

  projectedMeritScore = computed(() => {
    const t = Number(this.form.tenthPercentage);
    const tw = Number(this.form.twelfthPercentage);
    if (!t || !tw || isNaN(t) || isNaN(tw)) return null;
    return Number((0.6 * tw + 0.4 * t).toFixed(2));
  });

  ngOnInit(): void {
    if (!this.api.isAuthenticated()) {
      this.router.navigate(['/auth']);
      return;
    }

    this.loadCourses();

    // Check query params
    this.route.queryParams.subscribe(params => {
      if (params['courseId']) {
        this.form.courseId = Number(params['courseId']);
      }
      if (params['step']) {
        this.currentStep.set(Number(params['step']));
      }
      if (params['appId']) {
        this.activeAppId.set(params['appId']);
        this.loadApplicationDocs(params['appId']);
      }
    });

    // Check if there is an auto-saved draft in NoSQL
    this.api.getDraft().subscribe({
      next: (res) => {
        if (res.draft && !this.activeAppId()) {
          this.form = { ...this.form, ...res.draft };
          this.successMessage.set('Restored unsubmitted draft from NoSQL Document store.');
          setTimeout(() => this.successMessage.set(null), 3000);
        }
      }
    });
  }

  loadCourses(): void {
    this.api.getCourses().subscribe({
      next: (res) => {
        if (res.success) {
          this.courses.set(res.courses);
        }
      }
    });
  }

  saveNoSqlDraft(): void {
    this.api.saveDraft(this.form).subscribe({
      next: () => {
        const u = this.api.currentUser();
        if (u) {
          this.fb.syncDraftToFirestore(u.userId, this.form);
        }
        this.successMessage.set('Draft cached in Firebase Cloud Firestore NoSQL store.');
        setTimeout(() => this.successMessage.set(null), 2500);
      },
      error: (err) => this.errorMessage.set(err.error?.message || 'Failed to save draft.')
    });
  }

  scrollToSection(id: string, subSec: number): void {
    this.activeSubSection.set(subSec);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  canGoToStep(s: number): boolean {
    if (s === 1) return true;
    if (s === 2) return !!this.activeAppId() || this.currentStep() >= 2;
    if (s === 3) return !!this.activeAppId() || this.currentStep() >= 2;
    return false;
  }

  onSubmitStep1(): void {
    const missing: string[] = [];
    if (!this.form.courseId) missing.push('Target Course / Program');
    if (!this.form.dateOfBirth) missing.push('Date of Birth');
    if (!this.form.gender) missing.push('Gender');
    if (!this.form.guardianName || !String(this.form.guardianName).trim()) missing.push('Guardian / Father Name');
    if (!this.form.guardianPhone || !String(this.form.guardianPhone).trim()) missing.push('Guardian Mobile');
    if (!this.form.address || !String(this.form.address).trim()) missing.push('Residential Address');
    if (!this.form.tenthBoard || !String(this.form.tenthBoard).trim()) missing.push('Class 10 Board');
    if (!this.form.tenthYear || isNaN(Number(this.form.tenthYear))) missing.push('Class 10 Year of Passing');
    if (this.form.tenthPercentage === null || this.form.tenthPercentage === undefined || this.form.tenthPercentage === '' || isNaN(Number(this.form.tenthPercentage))) missing.push('Class 10 Percentage');
    if (!this.form.twelfthBoard || !String(this.form.twelfthBoard).trim()) missing.push('Class 12 Board');
    if (!this.form.twelfthYear || isNaN(Number(this.form.twelfthYear))) missing.push('Class 12 Year of Passing');
    if (this.form.twelfthPercentage === null || this.form.twelfthPercentage === undefined || this.form.twelfthPercentage === '' || isNaN(Number(this.form.twelfthPercentage))) missing.push('Class 12 Percentage');
    if (!this.form.twelfthStream || !String(this.form.twelfthStream).trim()) missing.push('Class 12 Stream');

    if (missing.length > 0) {
      this.errorMessage.set(`All application form fields are required. Please fill in: ${missing.join(', ')}.`);
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    if (this.activeAppId()) {
      // If already registered, update existing details and advance to documents
      this.api.updateApplication(this.activeAppId(), this.form).subscribe({
        next: (res) => {
          this.loading.set(false);
          this.successMessage.set(`Application ${this.activeAppId()} details updated.`);
          this.currentStep.set(2);
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(err.error?.message || 'Failed to update application details.');
        }
      });
    } else {
      // First-time application registration
      this.api.submitApplication(this.form).subscribe({
        next: (res) => {
          this.loading.set(false);
          this.activeAppId.set(res.applicationId);
          this.successMessage.set(`Application ${res.applicationId} registered in Firebase Cloud Firestore. Please upload documents.`);
          this.currentStep.set(2);
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(err.error?.message || 'Failed to submit application.');
        }
      });
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  onUploadFile(): void {
    if (!this.selectedFile || !this.activeAppId()) return;

    this.uploading.set(true);
    this.errorMessage.set(null);

    const formData = new FormData();
    formData.append('document', this.selectedFile);
    formData.append('applicationId', this.activeAppId());
    formData.append('docType', this.uploadDocType);

    this.api.uploadDocument(formData).subscribe({
      next: (res) => {
        this.uploading.set(false);
        this.successMessage.set(`Document stored in gs://iem-admission-404bn.firebasestorage.app/${res.bucketStorage?.subBucket || 'academic-docs'}`);
        this.selectedFile = null;
        this.loadApplicationDocs(this.activeAppId());
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        this.uploading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to upload document.');
      }
    });
  }

  onPhotoFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.photoFile = file;
    }
  }

  onSignatureFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.signatureFile = file;
    }
  }

  uploadPhoto(): void {
    if (!this.photoFile || !this.activeAppId()) return;
    this.uploadingPhoto.set(true);
    this.errorMessage.set(null);

    const formData = new FormData();
    formData.append('document', this.photoFile);
    formData.append('applicationId', this.activeAppId());
    formData.append('docType', 'PHOTO');

    this.api.uploadDocument(formData).subscribe({
      next: (res) => {
        this.uploadingPhoto.set(false);
        this.photoFile = null;
        this.successMessage.set('Passport Photograph uploaded successfully to candidate-media.');
        this.loadApplicationDocs(this.activeAppId());
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        this.uploadingPhoto.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to upload photo.');
      }
    });
  }

  uploadSignature(): void {
    if (!this.signatureFile || !this.activeAppId()) return;
    this.uploadingSignature.set(true);
    this.errorMessage.set(null);

    const formData = new FormData();
    formData.append('document', this.signatureFile);
    formData.append('applicationId', this.activeAppId());
    formData.append('docType', 'SIGNATURE');

    this.api.uploadDocument(formData).subscribe({
      next: (res) => {
        this.uploadingSignature.set(false);
        this.signatureFile = null;
        this.successMessage.set('Candidate Signature uploaded successfully to candidate-media.');
        this.loadApplicationDocs(this.activeAppId());
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => {
        this.uploadingSignature.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to upload signature.');
      }
    });
  }

  getDoc(type: string): any {
    const docs = this.uploadedDocs();
    if (type === 'PHOTO') {
      return docs.find((d: any) => ['PHOTO', 'PASSPORT_PHOTO'].includes(d.docType));
    }
    if (type === 'SIGNATURE') {
      return docs.find((d: any) => ['SIGNATURE', 'CANDIDATE_SIGNATURE'].includes(d.docType));
    }
    if (type === 'PHOTO_ID') {
      return docs.find((d: any) => ['PHOTO_ID', 'IDENTITY_PROOF'].includes(d.docType));
    }
    return docs.find((d: any) => d.docType === type);
  }

  hasDocType(type: string): boolean {
    return this.uploadedDocs().some((d: any) => d.docType === type);
  }

  has10thMarksheet(): boolean {
    return this.hasDocType('MARKSHEET_10');
  }

  has12thMarksheet(): boolean {
    return this.hasDocType('MARKSHEET_12');
  }

  hasPhoto(): boolean {
    return this.uploadedDocs().some((d: any) => ['PHOTO', 'PASSPORT_PHOTO'].includes(d.docType));
  }

  hasPhotoId(): boolean {
    return this.uploadedDocs().some((d: any) => ['PHOTO_ID', 'IDENTITY_PROOF'].includes(d.docType));
  }

  hasSignature(): boolean {
    return this.uploadedDocs().some((d: any) => ['SIGNATURE', 'CANDIDATE_SIGNATURE'].includes(d.docType));
  }

  hasRequiredDocs(): boolean {
    return this.has10thMarksheet() &&
           this.has12thMarksheet() &&
           this.hasPhoto() &&
           this.hasPhotoId() &&
           this.hasSignature();
  }

  loadApplicationDocs(appId: string): void {
    this.api.getApplicationById(appId).subscribe({
      next: (res) => {
        if (res.documents) {
          this.uploadedDocs.set(res.documents);
          // If applicant navigated directly to step 3 without required documents, redirect back to step 2
          if (this.currentStep() === 3 && !this.hasRequiredDocs()) {
            this.currentStep.set(2);
            this.errorMessage.set('Document prerequisite: You must upload all 5 mandatory documents (Class 10th and 12th marksheets, Passport Photo, Photo ID, and Signature) before proceeding with fee payment.');
          }
        }
      }
    });
  }

  onPayFee(): void {
    if (!this.hasRequiredDocs()) {
      this.errorMessage.set('Cannot proceed with payment: Mandatory documents (10th & 12th marksheets, Photo, Photo ID, and Signature) are missing.');
      this.currentStep.set(2);
      return;
    }

    this.processingPayment.set(true);
    this.errorMessage.set(null);

    // 1. Initiate
    this.api.initiatePayment(this.activeAppId(), this.paymentMethod).subscribe({
      next: (initRes) => {
        // 2. Authorize
        this.api.verifyPayment(
          initRes.payment.paymentId,
          initRes.gatewayOrder.orderId,
          this.paymentMethod,
          this.simulateFailure
        ).subscribe({
          next: (payRes) => {
            this.processingPayment.set(false);
            this.paymentDone.set(true);
            this.paymentReceipt.set(payRes.receipt);
          },
          error: (payErr) => {
            this.processingPayment.set(false);
            this.errorMessage.set(payErr.error?.message || 'Payment authorization declined.');
          }
        });
      },
      error: (initErr) => {
        this.processingPayment.set(false);
        this.errorMessage.set(initErr.error?.message || 'Failed to initiate payment.');
      }
    });
  }

  goToStep(s: number): void {
    if (s === 3 && !this.hasRequiredDocs()) {
      this.errorMessage.set('Payment locked: Please upload both Class 10th and 12th marksheets before proceeding to payment.');
      return;
    }
    this.currentStep.set(s);
    this.errorMessage.set(null);
  }
}
