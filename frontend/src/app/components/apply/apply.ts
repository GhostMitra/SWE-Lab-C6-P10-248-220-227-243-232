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
                <label class="form-label small fw-bold">Guardian Mobile *</label>
                <input type="tel" class="form-control" [(ngModel)]="form.guardianPhone" name="guardianPhone" placeholder="9831122334" required>
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
                <label class="form-label small fw-bold">Class 10 Year of Passing *</label>
                <input type="number" class="form-control" [(ngModel)]="form.tenthYear" name="tenthYear" placeholder="2022" required>
              </div>
              <div class="col-md-3">
                <label class="form-label small fw-bold">Class 10 Percentage *</label>
                <input type="number" step="0.01" class="form-control" [(ngModel)]="form.tenthPercentage" name="tenthPercentage" placeholder="e.g. 91.5" required>
              </div>
              <div class="col-md-3">
                <label class="form-label small fw-bold">Class 12 Stream *</label>
                <input type="text" class="form-control" [(ngModel)]="form.twelfthStream" name="twelfthStream" placeholder="Science (PCM)" required>
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Class 12 Board *</label>
                <input type="text" class="form-control" [(ngModel)]="form.twelfthBoard" name="twelfthBoard" placeholder="CBSE / ISC / State" required>
              </div>
              <div class="col-md-4">
                <label class="form-label small fw-bold">Class 12 Year of Passing *</label>
                <input type="number" class="form-control" [(ngModel)]="form.twelfthYear" name="twelfthYear" placeholder="2024" required>
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
            <div class="col-lg-5">
              <div class="p-3 bg-light rounded-3 border">
                <h6 class="fw-bold text-dark mb-3">Upload Academic / Proof Document</h6>
                
                <div class="mb-3">
                  <label class="form-label small fw-bold">Select Document Category *</label>
                  <select class="form-select" [(ngModel)]="uploadDocType">
                    <option value="MARKSHEET_10">Class 10th Secondary Marksheet (PDF) *</option>
                    <option value="MARKSHEET_12">Class 12th Higher Secondary Marksheet (PDF) *</option>
                    <option value="PHOTO_ID">Government Photo ID (Aadhaar / Passport / Voter ID) *</option>
                    <option value="OTHER_CERTIFICATE">Other Supporting Certificate (Optional)</option>
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
              <h6 class="fw-bold text-dark mb-3">All Uploaded Documents for Application {{ activeAppId() }}</h6>
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
                      <td class="small text-muted font-monospace" style="font-size: 0.72rem;">gs://iem-admission-404bn.firebasestorage.app</td>
                      <td>
                        <a [href]="api.getFileUrl(d.filePath)" target="_blank" class="btn btn-sm btn-outline-primary py-0 px-2" style="font-size: 0.72rem;">
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
                  No documents uploaded to the bucket yet.
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
                  10th Marksheet: {{ has10thMarksheet() ? 'OK' : 'REQUIRED' }}
                </span>
                <span class="badge" [ngClass]="has12thMarksheet() ? 'bg-success' : 'bg-danger'">
                  <i class="bi" [ngClass]="has12thMarksheet() ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                  12th Marksheet: {{ has12thMarksheet() ? 'OK' : 'REQUIRED' }}
                </span>
                <span class="badge" [ngClass]="hasPhoto() ? 'bg-success' : 'bg-danger'">
                  <i class="bi" [ngClass]="hasPhoto() ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                  Photo: {{ hasPhoto() ? 'OK' : 'REQUIRED' }}
                </span>
                <span class="badge" [ngClass]="hasPhotoId() ? 'bg-success' : 'bg-danger'">
                  <i class="bi" [ngClass]="hasPhotoId() ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                  Photo ID: {{ hasPhotoId() ? 'OK' : 'REQUIRED' }}
                </span>
                <span class="badge" [ngClass]="hasSignature() ? 'bg-success' : 'bg-danger'">
                  <i class="bi" [ngClass]="hasSignature() ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                  Signature: {{ hasSignature() ? 'OK' : 'REQUIRED' }}
                </span>
              </div>
            </div>
          </div>

          <div class="d-flex justify-content-between align-items-center pt-3 border-top">
            <button type="button" class="btn btn-outline-secondary" (click)="goToStep(1)">
              <i class="bi bi-arrow-left me-1"></i> Back to Form
            </button>
            <button type="button" class="btn btn-iem-primary px-4 fw-bold" (click)="goToStep(3)" [disabled]="!hasRequiredDocs()">
              <i class="bi bi-lock-fill me-1" *ngIf="!hasRequiredDocs()"></i>
              Proceed to Fee Payment <i class="bi bi-arrow-right ms-1"></i>
            </button>
          </div>
        </div>

        <!-- STEP 3: FEE PAYMENT PORTAL & GATEWAY -->
        <div *ngIf="currentStep() === 3">
          <!-- When required documents are missing -->
          <div *ngIf="!hasRequiredDocs() && !paymentDone()" class="row justify-content-center my-4">
            <div class="col-md-8">
              <div class="p-4 bg-light rounded-3 border text-center shadow-sm">
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
  photoFile: File | null = null;
  signatureFile: File | null = null;
  uploadingPhoto = signal<boolean>(false);
  uploadingSignature = signal<boolean>(false);

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
