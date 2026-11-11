import { Component, OnInit, inject, signal } from '@angular/core';
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
    <div class="container py-4">
      <div class="card card-custom border-0 p-4 mb-4">
        <div class="d-flex flex-wrap justify-content-between align-items-center border-bottom pb-3 mb-4 gap-2">
          <div>
            <h3 class="fw-bold text-dark mb-0">Admission Application Portal</h3>
            <small class="text-muted">Fill Academic Data (Firestore NoSQL Draft) -> Upload Documents (Storage Bucket) -> Fee Payment</small>
          </div>
          <div>
            <span class="badge bg-primary text-uppercase px-3 py-1.5 fw-bold">Step {{ currentStep() }} of 3</span>
          </div>
        </div>

        <!-- Stepper Indicator -->
        <div class="stepper-container mb-4">
          <div class="stepper-step" [class.completed]="currentStep() > 1" [class.active]="currentStep() === 1">
            <div class="stepper-circle">1</div>
            <div class="stepper-title">Application Form</div>
          </div>
          <div class="stepper-step" [class.completed]="currentStep() > 2" [class.active]="currentStep() === 2">
            <div class="stepper-circle">2</div>
            <div class="stepper-title">Document Upload (Bucket)</div>
          </div>
          <div class="stepper-step" [class.completed]="paymentDone()" [class.active]="currentStep() === 3">
            <div class="stepper-circle">3</div>
            <div class="stepper-title">Fee Payment</div>
          </div>
        </div>

        <!-- Alerts -->
        <div class="alert alert-danger d-flex align-items-center gap-2 small" *ngIf="errorMessage()">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <div>{{ errorMessage() }}</div>
        </div>
        <div class="alert alert-success d-flex align-items-center gap-2 small" *ngIf="successMessage()">
          <i class="bi bi-check-circle-fill"></i>
          <div>{{ successMessage() }}</div>
        </div>

        <!-- STEP 1: APPLICATION FORM DETAILS -->
        <div *ngIf="currentStep() === 1">
          <form (ngSubmit)="onSubmitStep1()">
            <h5 class="fw-bold text-primary mb-3"><i class="bi bi-mortarboard-fill me-2"></i>1. Select Degree Program</h5>
            <div class="row g-3 mb-4">
              <div class="col-md-12">
                <label class="form-label small fw-bold">Target Course / Program *</label>
                <select class="form-select form-select-lg" [(ngModel)]="form.courseId" name="courseId" required>
                  <option [ngValue]="null" disabled>-- Select Academic Program --</option>
                  <option *ngFor="let c of courses()" [ngValue]="c.courseId">
                    {{ c.courseName }} ({{ c.courseCode }}) — Fee: ₹{{ c.applicationFee }}
                  </option>
                </select>
              </div>
            </div>

            <h5 class="fw-bold text-primary mb-3"><i class="bi bi-person-lines-fill me-2"></i>2. Personal Information</h5>
            <div class="row g-3 mb-4">
              <div class="col-md-4">
                <label class="form-label small fw-bold">Date of Birth *</label>
                <input type="date" class="form-control" [(ngModel)]="form.dateOfBirth" name="dateOfBirth" required>
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Gender *</label>
                <select class="form-select" [(ngModel)]="form.gender" name="gender" required>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Guardian / Father Name *</label>
                <input type="text" class="form-control" [(ngModel)]="form.guardianName" name="guardianName" placeholder="e.g. Subhas Mitra" required>
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Guardian Mobile</label>
                <input type="tel" class="form-control" [(ngModel)]="form.guardianPhone" name="guardianPhone" placeholder="9831122334">
              </div>
              <div class="col-md-8">
                <label class="form-label small fw-bold">Residential Address *</label>
                <input type="text" class="form-control" [(ngModel)]="form.address" name="address" placeholder="House/Street, City, PIN Code, State" required>
              </div>
            </div>

            <h5 class="fw-bold text-primary mb-3"><i class="bi bi-award-fill me-2"></i>3. Academic Qualifications</h5>
            <div class="row g-3 mb-4">
              <div class="col-md-3">
                <label class="form-label small fw-bold">Class 10 Board *</label>
                <input type="text" class="form-control" [(ngModel)]="form.tenthBoard" name="tenthBoard" placeholder="CBSE / ICSE / State" required>
              </div>
              <div class="col-md-3">
                <label class="form-label small fw-bold">Class 10 Year</label>
                <input type="number" class="form-control" [(ngModel)]="form.tenthYear" name="tenthYear" placeholder="2022">
              </div>
              <div class="col-md-3">
                <label class="form-label small fw-bold">Class 10 Percentage *</label>
                <input type="number" step="0.01" class="form-control" [(ngModel)]="form.tenthPercentage" name="tenthPercentage" placeholder="e.g. 91.5" required>
              </div>
              <div class="col-md-3">
                <label class="form-label small fw-bold">12th Stream</label>
                <input type="text" class="form-control" [(ngModel)]="form.twelfthStream" name="twelfthStream" placeholder="Science (PCM)">
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Class 12 Board *</label>
                <input type="text" class="form-control" [(ngModel)]="form.twelfthBoard" name="twelfthBoard" placeholder="CBSE / ISC / State" required>
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Class 12 Year</label>
                <input type="number" class="form-control" [(ngModel)]="form.twelfthYear" name="twelfthYear" placeholder="2024">
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Class 12 Percentage *</label>
                <input type="number" step="0.01" class="form-control" [(ngModel)]="form.twelfthPercentage" name="twelfthPercentage" placeholder="e.g. 93.4" required>
              </div>
            </div>

            <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 pt-3 border-top">
              <button type="button" class="btn btn-outline-secondary" (click)="saveNoSqlDraft()">
                <i class="bi bi-hdd-network me-1"></i> Auto-Save Draft to NoSQL Store
              </button>
              <button type="submit" class="btn btn-iem-primary px-4 fw-bold" [disabled]="loading()">
                <span class="spinner-border spinner-border-sm me-1" *ngIf="loading()"></span>
                Submit Form & Proceed to Documents <i class="bi bi-arrow-right ms-1"></i>
              </button>
            </div>
          </form>
        </div>

        <!-- STEP 2: DOCUMENT UPLOAD INTERFACE (STORAGE BUCKET) -->
        <div *ngIf="currentStep() === 2">
          <div class="alert alert-primary py-2.5 px-3 mb-4 small d-flex align-items-center gap-2">
            <i class="bi bi-cloud-arrow-up-fill fs-4"></i>
            <div>
              <strong>Cloud Object Storage:</strong> Documents are streamed directly into our dedicated 
              <code>gs://iem-admission-404bn.firebasestorage.app</code> bucket and indexed into Firebase Cloud Firestore.
            </div>
          </div>

          <div class="row g-4 mb-4">
            <div class="col-lg-5">
              <div class="p-3 bg-light rounded-3 border">
                <h6 class="fw-bold text-dark mb-3">Upload Admission Document</h6>
                
                <div class="mb-3">
                  <label class="form-label small fw-bold">Select Document Category *</label>
                  <select class="form-select" [(ngModel)]="uploadDocType">
                    <option value="MARKSHEET_10">Class 10th Secondary Marksheet (PDF)</option>
                    <option value="MARKSHEET_12">Class 12th Higher Secondary Marksheet (PDF)</option>
                    <option value="IDENTITY_PROOF">Identity Proof (Aadhaar / Passport / Voter ID)</option>
                    <option value="PHOTO_SIGNATURE">Passport Photograph & Signature</option>
                  </select>
                </div>

                <div class="mb-3">
                  <label class="form-label small fw-bold">Choose File (PDF, PNG, JPG - Max 10MB) *</label>
                  <input type="file" class="form-control" (change)="onFileSelected($event)">
                </div>

                <button type="button" class="btn btn-iem-primary w-100 fw-bold" (click)="onUploadFile()" [disabled]="uploading() || !selectedFile">
                  <span class="spinner-border spinner-border-sm me-1" *ngIf="uploading()"></span>
                  <i class="bi bi-cloud-upload me-1" *ngIf="!uploading()"></i>
                  Upload to Storage Bucket
                </button>
              </div>
            </div>

            <div class="col-lg-7">
              <h6 class="fw-bold text-dark mb-3">Uploaded Documents for Application {{ activeAppId() }}</h6>
              <div class="table-responsive" *ngIf="uploadedDocs().length > 0; else noDocsTable">
                <table class="table table-sm table-bordered align-middle">
                  <thead class="table-light small">
                    <tr>
                      <th>Document</th>
                      <th>File Name</th>
                      <th>Size</th>
                      <th>Bucket Location</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let d of uploadedDocs()">
                      <td><span class="badge bg-secondary font-monospace">{{ d.docType }}</span></td>
                      <td class="small fw-semibold">{{ d.fileName }}</td>
                      <td class="small text-muted">{{ (d.fileSize / 1024) | number:'1.1-1' }} KB</td>
                      <td class="small text-muted font-monospace" style="font-size: 0.72rem;">gs://iem-bucket/{{ d.docType }}</td>
                      <td>
                        <a [href]="'http://localhost:5000' + d.filePath" target="_blank" class="btn btn-sm btn-outline-primary py-0 px-2" style="font-size: 0.72rem;">
                          <i class="bi bi-eye"></i> View
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <ng-template #noDocsTable>
                <div class="alert alert-light border text-center py-4 text-muted small">
                  <i class="bi bi-file-earmark-arrow-up fs-3 d-block mb-1"></i>
                  No documents uploaded to the bucket yet. Upload at least your 10th and 12th marksheets to fulfill application readiness.
                </div>
              </ng-template>
            </div>
          </div>

          <div class="d-flex justify-content-between align-items-center pt-3 border-top">
            <button type="button" class="btn btn-outline-secondary" (click)="goToStep(1)">
              <i class="bi bi-arrow-left me-1"></i> Back to Form
            </button>
            <button type="button" class="btn btn-iem-primary px-4 fw-bold" (click)="goToStep(3)">
              Proceed to Fee Payment <i class="bi bi-arrow-right ms-1"></i>
            </button>
          </div>
        </div>

        <!-- STEP 3: FEE PAYMENT PORTAL & GATEWAY -->
        <div *ngIf="currentStep() === 3">
          <div *ngIf="!paymentDone(); else receiptTpl">
            <div class="row g-4 justify-content-center mb-4">
              <div class="col-md-7">
                <div class="p-4 bg-light rounded-3 border">
                  <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="fw-bold text-dark mb-0"><i class="bi bi-shield-check text-success me-2"></i>IEM Payment Gateway Checkout</h5>
                    <span class="badge bg-warning text-dark fw-bold">Test Sandbox</span>
                  </div>

                  <div class="bg-white p-3 rounded-3 border mb-3">
                    <div class="d-flex justify-content-between small mb-2">
                      <span class="text-muted">Application ID:</span>
                      <strong class="font-monospace">{{ activeAppId() }}</strong>
                    </div>
                    <div class="d-flex justify-content-between small mb-2">
                      <span class="text-muted">Candidate:</span>
                      <strong>{{ api.currentUser()?.fullName }}</strong>
                    </div>
                    <div class="d-flex justify-content-between small mb-2">
                      <span class="text-muted">Transaction Currency:</span>
                      <strong>INR (₹)</strong>
                    </div>
                    <hr class="my-2">
                    <div class="d-flex justify-content-between align-items-center">
                      <span class="fw-bold">Total Application Fee:</span>
                      <span class="fs-4 fw-bold text-success">₹ 1,000.00</span>
                    </div>
                  </div>

                  <!-- Select Payment Method -->
                  <div class="mb-3">
                    <label class="form-label small fw-bold">Payment Method</label>
                    <div class="d-grid gap-2">
                      <div class="form-check p-2.5 border rounded-3 bg-white d-flex align-items-center gap-2">
                        <input class="form-check-input ms-1" type="radio" name="payMethod" value="UPI" [(ngModel)]="paymentMethod" id="m1">
                        <label class="form-check-label small fw-bold" for="m1">
                          <i class="bi bi-qr-code me-1 text-primary"></i> UPI (Google Pay, PhonePe, Paytm, BHIM)
                        </label>
                      </div>
                      <div class="form-check p-2.5 border rounded-3 bg-white d-flex align-items-center gap-2">
                        <input class="form-check-input ms-1" type="radio" name="payMethod" value="CARD" [(ngModel)]="paymentMethod" id="m2">
                        <label class="form-check-label small fw-bold" for="m2">
                          <i class="bi bi-credit-card-2-back-fill me-1 text-primary"></i> Credit / Debit Card (Visa, MasterCard, RuPay)
                        </label>
                      </div>
                      <div class="form-check p-2.5 border rounded-3 bg-white d-flex align-items-center gap-2">
                        <input class="form-check-input ms-1" type="radio" name="payMethod" value="NETBANKING" [(ngModel)]="paymentMethod" id="m3">
                        <label class="form-check-label small fw-bold" for="m3">
                          <i class="bi bi-bank me-1 text-primary"></i> NetBanking (SBI, HDFC, ICICI, Axis)
                        </label>
                      </div>
                    </div>
                  </div>

                  <!-- Simulate failure toggle for testing -->
                  <div class="form-check form-switch mb-3 small">
                    <input class="form-check-input" type="checkbox" id="simFail" [(ngModel)]="simulateFailure">
                    <label class="form-check-label text-muted" for="simFail">
                      Simulate Gateway Decline / Insufficient Funds (for TC-S05 testing)
                    </label>
                  </div>

                  <button type="button" class="btn btn-success btn-lg w-100 fw-bold shadow-sm" (click)="onPayFee()" [disabled]="processingPayment()">
                    <span class="spinner-border spinner-border-sm me-1" *ngIf="processingPayment()"></span>
                    <i class="bi bi-lock-fill me-1" *ngIf="!processingPayment()"></i>
                    Authorize & Pay ₹ 1,000.00
                  </button>
                </div>
              </div>
            </div>

            <div class="d-flex justify-content-between align-items-center pt-3 border-top">
              <button type="button" class="btn btn-outline-secondary" (click)="goToStep(2)">
                <i class="bi bi-arrow-left me-1"></i> Back to Documents
              </button>
            </div>
          </div>

          <!-- Payment Success Receipt -->
          <ng-template #receiptTpl>
            <div class="row justify-content-center">
              <div class="col-md-7">
                <div class="card p-4 border-0 shadow-sm text-center bg-white">
                  <div class="text-success mb-2"><i class="bi bi-patch-check-fill display-3"></i></div>
                  <h4 class="fw-bold text-dark">Payment Authorized Successfully!</h4>
                  <p class="text-muted small">Application fee has been credited to IEM Admissions Directorate ledger.</p>

                  <div class="bg-light p-3 rounded-3 border text-start mb-3 font-monospace small">
                    <div class="d-flex justify-content-between mb-1">
                      <span>Receipt Invoice:</span>
                      <strong>{{ paymentReceipt()?.receiptNo }}</strong>
                    </div>
                    <div class="d-flex justify-content-between mb-1">
                      <span>Transaction ID:</span>
                      <strong class="text-primary">{{ paymentReceipt()?.transactionId }}</strong>
                    </div>
                    <div class="d-flex justify-content-between mb-1">
                      <span>Application ID:</span>
                      <strong>{{ paymentReceipt()?.applicationId }}</strong>
                    </div>
                    <div class="d-flex justify-content-between mb-1">
                      <span>Amount Paid:</span>
                      <strong class="text-success">₹ {{ paymentReceipt()?.amount }}</strong>
                    </div>
                    <div class="d-flex justify-content-between">
                      <span>Payment Status:</span>
                      <span class="badge bg-success">SETTLED (SUCCESS)</span>
                    </div>
                  </div>

                  <div class="d-flex gap-2 justify-content-center">
                    <a routerLink="/student" class="btn btn-iem-primary">
                      <i class="bi bi-speedometer2 me-1"></i> Go to Student Dashboard
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </ng-template>
        </div>

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

  paymentMethod = 'UPI';
  simulateFailure = false;

  form: any = {
    courseId: null,
    dateOfBirth: '2004-06-15',
    gender: 'Male',
    guardianName: 'Subhas Mitra',
    guardianPhone: '9831122334',
    address: 'Salt Lake Sector V, Kolkata - 700091',
    tenthBoard: 'CBSE',
    tenthYear: 2022,
    tenthPercentage: 92.4,
    twelfthBoard: 'CBSE',
    twelfthYear: 2024,
    twelfthPercentage: 94.0,
    twelfthStream: 'Science (PCM)'
  };

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
          if (!this.form.courseId && res.courses.length > 0) {
            this.form.courseId = res.courses[0].courseId;
          }
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

  onSubmitStep1(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

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
        this.successMessage.set(`Document stored in gs://iem-admission-404bn.firebasestorage.app/${res.bucketStorage.subBucket}`);
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

  loadApplicationDocs(appId: string): void {
    this.api.getApplicationById(appId).subscribe({
      next: (res) => {
        if (res.documents) {
          this.uploadedDocs.set(res.documents);
        }
      }
    });
  }

  onPayFee(): void {
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
    this.currentStep.set(s);
    this.errorMessage.set(null);
  }
}
