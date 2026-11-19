import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, Application } from '../../services/api.service';

@Component({
  selector: 'app-officer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container py-4 my-2">
      
      <!-- OFFICER HEADER & METRICS BAR -->
      <div class="card card-modern p-4 mb-4 border-0 shadow-sm bg-white">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
          
          <div class="d-flex align-items-center gap-3">
            <div class="bg-info text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm"
                 style="width: 52px; height: 52px; font-size: 1.25rem; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%) !important;">
              <i class="bi bi-clipboard-check fs-3"></i>
            </div>
            <div>
              <div class="d-flex align-items-center gap-2">
                <h3 class="fw-bold text-dark mb-0">Admission Officer Evaluation Desk</h3>
                <span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 px-2.5 py-1">
                  Screen 2 (Worksheet)
                </span>
              </div>
              <p class="text-muted small mb-0 mt-1">
                Officer: <strong>{{ api.currentUser()?.fullName }}</strong> ({{ api.currentUser()?.email }}) • 
                <span class="text-dark font-mono">Central Admissions Cell</span>
              </p>
            </div>
          </div>

          <div class="d-flex gap-2">
            <button class="btn btn-iem-outline btn-sm shadow-xs" (click)="loadApplications()">
              <i class="bi bi-arrow-clockwise me-1"></i> Refresh Queue
            </button>
          </div>

        </div>

        <!-- Queue Telemetry Counter Chips -->
        <div class="row g-3 mt-3 pt-3 border-top">
          <div class="col-sm-4">
            <div class="p-2.5 bg-light rounded-3 border d-flex justify-content-between align-items-center">
              <span class="small text-muted font-semibold">Total In Queue:</span>
              <span class="fw-bold fs-6 text-dark">{{ applications().length }}</span>
            </div>
          </div>
          <div class="col-sm-4">
            <div class="p-2.5 bg-light rounded-3 border d-flex justify-content-between align-items-center">
              <span class="small text-muted font-semibold">Pending / Under Review:</span>
              <span class="badge bg-warning text-dark font-bold fs-7">{{ pendingCount() }}</span>
            </div>
          </div>
          <div class="col-sm-4">
            <div class="p-2.5 bg-light rounded-3 border d-flex justify-content-between align-items-center">
              <span class="small text-muted font-semibold">Approved (Admit Issued):</span>
              <span class="badge bg-success font-bold fs-7">{{ approvedCount() }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- FILTER & SEARCH BAR -->
      <div class="card card-modern p-3.5 mb-4 border-0 shadow-sm bg-white">
        <div class="row g-3 align-items-center">
          
          <div class="col-md-5">
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input type="search" class="form-control" [(ngModel)]="searchQuery" (input)="filterList()"
                     placeholder="Search Candidate Name, Email, or Application ID..." aria-label="Search Applications">
            </div>
          </div>

          <div class="col-md-4">
            <select class="form-select" [(ngModel)]="statusFilter" (change)="filterList()" aria-label="Filter by Status">
              <option value="">All Application Statuses ({{ applications().length }})</option>
              <option value="SUBMITTED">SUBMITTED (Pending Officer Action)</option>
              <option value="UNDER_REVIEW">UNDER_REVIEW (Documents Auditing)</option>
              <option value="APPROVED">APPROVED (Admit Granted)</option>
              <option value="REJECTED">REJECTED (Cutoff / Credential Issue)</option>
            </select>
          </div>

          <div class="col-md-3 text-md-end text-muted small">
            Showing <strong class="text-dark">{{ filteredApplications().length }}</strong> applications
          </div>

        </div>
      </div>

      <!-- APPLICATIONS QUEUE TABLE -->
      <div class="card card-modern border-0 p-0 shadow-sm mb-4 overflow-hidden">
        <div class="table-modern-wrapper">
          <table class="table-modern">
            <thead>
              <tr>
                <th>App ID</th>
                <th>Candidate Dossier</th>
                <th>Target Program</th>
                <th>10th / 12th Board Marks</th>
                <th>Fee Status</th>
                <th>Evaluation Status</th>
                <th class="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let a of filteredApplications()">
                <td class="font-mono fw-bold text-primary">
                  <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 font-mono">
                    {{ a.applicationId }}
                  </span>
                </td>

                <td>
                  <div class="d-flex align-items-center gap-2">
                    <div class="bg-light text-primary border rounded-circle d-flex align-items-center justify-content-center fw-bold"
                         style="width: 32px; height: 32px; font-size: 0.78rem;">
                      {{ a.fullName?.charAt(0) || 'C' }}
                    </div>
                    <div>
                      <div class="fw-bold text-dark">{{ a.fullName }}</div>
                      <div class="text-muted" style="font-size: 0.76rem;">{{ a.email }}</div>
                    </div>
                  </div>
                </td>

                <td>
                  <span class="badge bg-light text-dark border font-mono">{{ a.courseCode }}</span>
                  <div class="text-muted" style="font-size: 0.75rem;">{{ a.courseName }}</div>
                </td>

                <td>
                  <div class="small">10th: <strong>{{ a.tenthPercentage || a.marks10th || 'N/A' }}%</strong></div>
                  <div class="small">12th: <strong>{{ a.twelfthPercentage || a.marks12th || 'N/A' }}%</strong></div>
                </td>

                <td>
                  <span class="badge" [ngClass]="isFeePaid(a) ? 'bg-success' : 'bg-warning text-dark'">
                    <i class="bi" [ngClass]="isFeePaid(a) ? 'bi-check-circle-fill' : 'bi-clock-fill'"></i>
                    {{ isFeePaid(a) ? 'PAID' : 'PENDING' }}
                  </span>
                </td>

                <td>
                  <span class="badge-status" [ngClass]="{
                    'badge-submitted': a.status === 'SUBMITTED',
                    'badge-under-review': a.status === 'UNDER_REVIEW',
                    'badge-approved': a.status === 'APPROVED',
                    'badge-rejected': a.status === 'REJECTED'
                  }">
                    {{ a.status }}
                  </span>
                </td>

                <td class="text-end">
                  <button class="btn btn-sm btn-iem-primary py-1.5 px-3 shadow-xs" 
                          [disabled]="loadingDossier() === a.applicationId" 
                          (click)="openDossier(a)">
                    <span *ngIf="loadingDossier() === a.applicationId" class="spinner-border spinner-border-sm me-1" role="status"></span>
                    <i *ngIf="loadingDossier() !== a.applicationId" class="bi bi-folder2-open me-1"></i>
                    {{ loadingDossier() === a.applicationId ? 'Loading...' : 'Review Dossier' }}
                  </button>
                </td>

              </tr>

              <tr *ngIf="filteredApplications().length === 0">
                <td colspan="7" class="text-center py-5 text-muted">
                  <i class="bi bi-inbox fs-2 d-block mb-2 text-secondary"></i>
                  No applications found matching the selected filter criteria.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- CANDIDATE DOSSIER EVALUATION DRAWER / PANEL -->
      <div class="card card-modern border-0 p-4 p-md-5 shadow-xl mb-4 border-top border-4 border-primary" *ngIf="selectedDossier()" id="dossier-panel">
        
        <div class="d-flex justify-content-between align-items-center border-bottom pb-3.5 mb-4">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="badge bg-primary text-white font-mono px-2.5 py-1">DOSSIER INSPECTION</span>
              <h4 class="fw-bold text-dark mb-0">{{ selectedDossier()?.application?.applicationId }}</h4>
            </div>
            <small class="text-muted">Live Sync from Firebase Cloud Firestore & Cloud Storage Bucket</small>
          </div>
          <button class="btn btn-sm btn-outline-secondary px-3" (click)="selectedDossier.set(null)">
            <i class="bi bi-x-lg me-1"></i> Close Dossier
          </button>
        </div>

        <!-- Candidate Profile & Academic Grid -->
        <div class="row g-4 mb-4">
          
          <!-- Candidate Bio -->
          <div class="col-md-6">
            <h6 class="fw-bold text-primary mb-2.5">
              <i class="bi bi-person-lines-fill me-1.5"></i> Candidate Profile & Contacts
            </h6>
            <div class="p-3.5 bg-light rounded-3 border small">
              <div class="mb-2"><strong>Full Name:</strong> {{ selectedDossier()?.application?.fullName || selectedDossier()?.application?.applicantName || 'Applicant' }}</div>
              <div class="mb-2"><strong>Email:</strong> {{ selectedDossier()?.application?.email || selectedDossier()?.application?.applicantEmail || 'N/A' }}</div>
              <div class="mb-2"><strong>Phone:</strong> {{ selectedDossier()?.application?.phone || selectedDossier()?.application?.applicantPhone || selectedDossier()?.application?.guardianPhone || 'N/A' }}</div>
              <div class="mb-2"><strong>DOB:</strong> {{ selectedDossier()?.application?.dateOfBirth || 'N/A' }}</div>
              <div class="mb-2"><strong>Gender:</strong> {{ selectedDossier()?.application?.gender || 'N/A' }}</div>
              <div class="mb-2"><strong>Address:</strong> {{ selectedDossier()?.application?.address || 'N/A' }}</div>
              <div class="mb-2"><strong>Guardian:</strong> {{ selectedDossier()?.application?.guardianName || 'N/A' }}</div>
              <div><strong>Program:</strong> {{ selectedDossier()?.application?.courseName }} ({{ selectedDossier()?.application?.courseCode }})</div>
            </div>
          </div>

          <!-- Academic Marks & Eligibility -->
          <div class="col-md-6">
            <h6 class="fw-bold text-primary mb-2.5">
              <i class="bi bi-patch-check-fill me-1.5"></i> Academic Qualification & Basis Path
            </h6>
            <div class="p-3.5 bg-light rounded-3 border small">
              <div class="mb-2">
                <strong>10th Secondary:</strong> 
                <span class="fs-6 fw-bold text-dark ms-1">{{ selectedDossier()?.application?.tenthPercentage || selectedDossier()?.application?.marks10th || 'N/A' }}%</span>
                <span class="text-muted ms-1">({{ selectedDossier()?.application?.tenthBoard || 'CBSE' }})</span>
              </div>
              <div class="mb-2">
                <strong>12th Higher Sec.:</strong> 
                <span class="fs-6 fw-bold text-dark ms-1">{{ selectedDossier()?.application?.twelfthPercentage || selectedDossier()?.application?.marks12th || 'N/A' }}%</span>
                <span class="text-muted ms-1">({{ selectedDossier()?.application?.twelfthBoard || 'CBSE' }}, {{ selectedDossier()?.application?.twelfthStream || 'PCM' }})</span>
              </div>
              <div class="mb-2">
                <strong>Merit Score:</strong>
                <span class="badge bg-primary fs-7 ms-1.5">{{ selectedDossier()?.application?.meritScore || 'N/A' }} Points</span>
                <span class="text-muted ms-1">(Category: {{ selectedDossier()?.application?.category || 'GENERAL' }})</span>
              </div>
              
              <hr class="my-2.5">
              <div class="mb-2">
                <strong>Fee Payment Status:</strong>
                <span class="badge bg-success ms-1.5" *ngIf="isFeePaid(selectedDossier()?.application || selectedDossier())">
                  PAID (Txn: {{ selectedDossier()?.payment?.transactionId || 'SETTLED' }})
                </span>
                <span class="badge bg-warning text-dark ms-1.5" *ngIf="!isFeePaid(selectedDossier()?.application || selectedDossier())">
                  PENDING
                </span>
              </div>
              
              <div>
                <strong>Readiness (Basis Path Audit):</strong> 
                <span class="badge ms-1.5" [ngClass]="selectedDossier()?.readiness?.isReady ? 'bg-success' : 'bg-warning text-dark'">
                  {{ selectedDossier()?.readiness?.isReady ? 'READY FOR ADMISSION' : 'INCOMPLETE DOSSIER' }}
                </span>
              </div>
              <div class="text-muted mt-2" *ngIf="selectedDossier()?.application?.reviewRemarks">
                <strong>Current Notes:</strong> {{ selectedDossier()?.application?.reviewRemarks }}
              </div>
            </div>
          </div>
        </div>

        <!-- DOCUMENT VERIFICATION CHECKLIST (CLOUD STORAGE BUCKET) -->
        <div class="mb-4">
          <div class="d-flex justify-content-between align-items-center mb-2.5">
            <h6 class="fw-bold text-primary mb-0">
              <i class="bi bi-cloud-arrow-down-fill me-1.5"></i> Document Authentication Checklist (Storage Bucket)
            </h6>
            <span class="badge bg-light text-muted border font-mono" style="font-size: 0.72rem;">
              Bucket: academic-docs & verification-certs
            </span>
          </div>

          <div class="table-modern-wrapper">
            <table class="table-modern">
              <thead>
                <tr>
                  <th>Doc Type</th>
                  <th>File Name</th>
                  <th>Storage Bucket Location</th>
                  <th>Current Status</th>
                  <th class="text-end">Verification Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let doc of selectedDossier()?.documents">
                  <td><span class="badge bg-secondary bg-opacity-20 text-dark font-mono border">{{ doc.docType }}</span></td>
                  <td class="small fw-semibold">{{ doc.fileName }}</td>
                  <td class="small font-mono text-muted" style="font-size: 0.72rem;">gs://iem-bucket/{{ doc.docType }}</td>
                  <td>
                    <span class="badge" [ngClass]="{
                      'bg-success': doc.verificationStatus === 'VERIFIED',
                      'bg-warning text-dark': doc.verificationStatus === 'PENDING',
                      'bg-danger': doc.verificationStatus === 'REJECTED'
                    }">
                      {{ doc.verificationStatus }}
                    </span>
                  </td>
                  <td class="text-end">
                    <div class="d-inline-flex gap-1.5">
                      <a [href]="api.getFileUrl(doc.filePath)" target="_blank" class="btn btn-sm btn-outline-primary py-1 px-2" style="font-size: 0.76rem;">
                        <i class="bi bi-eye"></i> View
                      </a>
                      <button class="btn btn-sm btn-outline-success py-1 px-2" style="font-size: 0.76rem;" (click)="verifyDoc(doc.documentId, 'VERIFIED')">
                        <i class="bi bi-check-lg"></i> Verify
                      </button>
                      <button class="btn btn-sm btn-outline-danger py-1 px-2" style="font-size: 0.76rem;" (click)="verifyDoc(doc.documentId, 'REJECTED')">
                        <i class="bi bi-x-lg"></i> Reject
                      </button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="!selectedDossier()?.documents?.length">
                  <td colspan="5" class="text-center py-4 text-muted small">
                    No documents uploaded to Cloud Storage bucket for this application yet.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- DECISION ACTION CONTROL PANEL -->
        <div class="p-4 bg-light border rounded-3 shadow-xs">
          <h6 class="fw-bold text-dark mb-2">
            <i class="bi bi-pen-fill text-warning me-1.5"></i> Record Admissions Committee Decision
          </h6>
          
          <div class="mb-3">
            <label for="officer-remarks" class="form-label">Committee Remarks / Feedback Justification *</label>
            <textarea id="officer-remarks" class="form-control" rows="2" [(ngModel)]="decisionRemarks"
                      placeholder="Enter reason for approval or rejection (e.g. Meets 12th board cutoff, marksheets authenticated...)"></textarea>
          </div>

          <div class="d-flex flex-wrap gap-2.5 justify-content-end">
            <button class="btn btn-iem-outline btn-sm px-3" (click)="updateStatus('UNDER_REVIEW')">
              <i class="bi bi-hourglass-split me-1 text-warning"></i> Mark Under Review
            </button>
            <button class="btn btn-outline-danger btn-sm px-3" (click)="updateStatus('REJECTED')">
              <i class="bi bi-x-circle me-1"></i> Reject Application
            </button>
            <button class="btn btn-success btn-sm px-4 fw-bold shadow-sm" (click)="updateStatus('APPROVED')">
              <i class="bi bi-check-circle-fill me-1.5"></i> Approve & Generate Official Admit Letter
            </button>
          </div>
        </div>

      </div>

    </div>
  `
})
export class OfficerComponent implements OnInit {
  api = inject(ApiService);
  router = inject(Router);

  applications = signal<Application[]>([]);
  filteredApplications = signal<Application[]>([]);
  selectedDossier = signal<any>(null);
  loadingDossier = signal<string | null>(null);

  searchQuery = '';
  statusFilter = '';
  decisionRemarks = '';

  pendingCount = computed(() => {
    return this.applications().filter(a => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW').length;
  });

  approvedCount = computed(() => {
    return this.applications().filter(a => a.status === 'APPROVED' || a.status === 'COMPLETED').length;
  });

  ngOnInit(): void {
    if (!this.api.isAuthenticated()) {
      this.router.navigate(['/auth']);
      return;
    }
    this.loadApplications();
  }

  isFeePaid(app: any): boolean {
    if (!app) return false;
    if (app.paymentStatus === 'PAID' || app.paymentStatus === 'SUCCESS') return true;
    if (app.readiness?.feePaid) return true;
    const s = app.payment?.status;
    return s === 'SUCCESS' || s === 'COMPLETED' || s === 'PAID';
  }

  loadApplications(): void {
    this.api.getAllApplications().subscribe({
      next: (res) => {
        if (res.success) {
          this.applications.set(res.applications);
          this.filterList();
        }
      }
    });
  }

  filterList(): void {
    const q = this.searchQuery.toLowerCase();
    const sf = this.statusFilter;

    const list = this.applications().filter(a => {
      const matchSearch = !q || (a.fullName?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q) || a.applicationId?.toLowerCase().includes(q));
      const matchStatus = !sf || a.status === sf;
      return matchSearch && matchStatus;
    });

    this.filteredApplications.set(list);
  }

  openDossier(app: Application): void {
    this.loadingDossier.set(app.applicationId);
    this.api.getApplicationById(app.applicationId).subscribe({
      next: (res) => {
        this.loadingDossier.set(null);
        if (res.success) {
          this.selectedDossier.set(res);
          this.decisionRemarks = res.application.reviewRemarks || 'Academic criteria verified. Approved for admission.';
          setTimeout(() => {
            const el = document.getElementById('dossier-panel');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 80);
        }
      },
      error: (err) => {
        this.loadingDossier.set(null);
        alert(err.error?.message || 'Failed to load applicant dossier.');
      }
    });
  }

  verifyDoc(docId: number, status: string): void {
    this.api.verifyDocument(docId, status, `Verified by Officer ${this.api.currentUser()?.fullName}`).subscribe({
      next: () => {
        if (this.selectedDossier()) {
          this.openDossier(this.selectedDossier().application);
        }
      }
    });
  }

  updateStatus(status: string): void {
    const appId = this.selectedDossier()?.application?.applicationId;
    if (!appId) return;

    this.api.updateApplicationStatus(appId, status, this.decisionRemarks).subscribe({
      next: (res) => {
        alert(`Application ${appId} status updated to ${status}!`);
        this.selectedDossier.set(null);
        this.loadApplications();
      },
      error: (err) => alert(err.error?.message || 'Failed to update status.')
    });
  }
}
