import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, Application } from '../../services/api.service';

@Component({
  selector: 'app-officer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container py-4">
      <!-- Officer Header -->
      <div class="card card-custom p-4 mb-4 border-0 bg-white shadow-sm">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <div class="d-flex align-items-center gap-2">
              <h3 class="fw-bold text-dark mb-0">Admission Officer Evaluation Portal</h3>
              <span class="badge bg-info text-dark text-uppercase">Screen 2 (Worksheet)</span>
            </div>
            <p class="text-muted small mb-0 mt-1">
              Officer: <strong>{{ api.currentUser()?.fullName }}</strong> ({{ api.currentUser()?.email }}) | Central Admissions Cell
            </p>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary" (click)="loadApplications()">
              <i class="bi bi-arrow-clockwise me-1"></i> Refresh Queue
            </button>
          </div>
        </div>
      </div>

      <!-- Filter & Search Bar -->
      <div class="card card-custom p-3 mb-4 border-0 bg-white shadow-sm">
        <div class="row g-2 align-items-center">
          <div class="col-md-5">
            <div class="input-group">
              <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control" [(ngModel)]="searchQuery" (input)="filterList()" placeholder="Search by Candidate Name, Email, or App ID...">
            </div>
          </div>
          <div class="col-md-4">
            <select class="form-select" [(ngModel)]="statusFilter" (change)="filterList()">
              <option value="">All Application Statuses</option>
              <option value="SUBMITTED">SUBMITTED (Pending Review)</option>
              <option value="UNDER_REVIEW">UNDER_REVIEW</option>
              <option value="APPROVED">APPROVED (Admit Granted)</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
          <div class="col-md-3 text-end text-muted small">
            Showing <strong>{{ filteredApplications().length }}</strong> applications
          </div>
        </div>
      </div>

      <!-- Applications Table -->
      <div class="card card-custom border-0 p-3 mb-4">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light small">
              <tr>
                <th>App ID</th>
                <th>Candidate Name</th>
                <th>Course / Program</th>
                <th>10th / 12th Marks</th>
                <th>Fee Status</th>
                <th>Decision Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let a of filteredApplications()">
                <td class="font-monospace fw-bold text-primary">{{ a.applicationId }}</td>
                <td>
                  <div class="fw-semibold">{{ a.fullName }}</div>
                  <div class="text-muted" style="font-size: 0.75rem;">{{ a.email }}</div>
                </td>
                <td>
                  <span class="badge bg-light text-dark border">{{ a.courseCode }}</span>
                  <div class="text-muted" style="font-size: 0.72rem;">{{ a.courseName }}</div>
                </td>
                <td>
                  <div class="small">10th: <strong>{{ a.tenthPercentage || 'N/A' }}%</strong></div>
                  <div class="small">12th: <strong>{{ a.twelfthPercentage || 'N/A' }}%</strong></div>
                </td>
                <td>
                  <span class="badge" [ngClass]="a.paymentStatus === 'SUCCESS' ? 'bg-success' : 'bg-warning text-dark'">
                    {{ a.paymentStatus === 'SUCCESS' ? 'PAID' : 'PENDING' }}
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
                <td>
                  <button class="btn btn-sm btn-iem-primary py-1 px-2.5" (click)="openDossier(a)">
                    <i class="bi bi-folder-check me-1"></i> Review Dossier
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- APPLICATION DOSSIER MODAL / DRAWER -->
      <div class="card card-custom border-0 p-4 border-top border-4 border-primary shadow-lg mb-4" *ngIf="selectedDossier()">
        <div class="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
          <div>
            <h5 class="fw-bold text-dark mb-0">Applicant Dossier Evaluation — {{ selectedDossier()?.application?.applicationId }}</h5>
            <small class="text-muted">Relational Record from SQL DB & Cloud Storage Bucket</small>
          </div>
          <button class="btn btn-sm btn-outline-secondary" (click)="selectedDossier.set(null)">
            <i class="bi bi-x-lg"></i> Close
          </button>
        </div>

        <div class="row g-4 mb-4">
          <!-- Student Profile -->
          <div class="col-md-6">
            <h6 class="fw-bold text-primary mb-2"><i class="bi bi-person-badge-fill me-1"></i> Candidate Profile</h6>
            <div class="p-3 bg-light rounded-3 border small">
              <div class="mb-1"><strong>Name:</strong> {{ selectedDossier()?.application?.fullName }}</div>
              <div class="mb-1"><strong>Email:</strong> {{ selectedDossier()?.application?.email }}</div>
              <div class="mb-1"><strong>Phone:</strong> {{ selectedDossier()?.application?.phone || 'N/A' }}</div>
              <div class="mb-1"><strong>DOB:</strong> {{ selectedDossier()?.application?.dateOfBirth || 'N/A' }}</div>
              <div class="mb-1"><strong>Gender:</strong> {{ selectedDossier()?.application?.gender || 'N/A' }}</div>
              <div class="mb-1"><strong>Address:</strong> {{ selectedDossier()?.application?.address || 'N/A' }}</div>
              <div class="mb-1"><strong>Guardian:</strong> {{ selectedDossier()?.application?.guardianName || 'N/A' }}</div>
              <div><strong>Program:</strong> {{ selectedDossier()?.application?.courseName }} ({{ selectedDossier()?.application?.courseCode }})</div>
            </div>
          </div>

          <!-- Academic Marks & Readiness -->
          <div class="col-md-6">
            <h6 class="fw-bold text-primary mb-2"><i class="bi bi-check2-square me-1"></i> Academic Readiness Check</h6>
            <div class="p-3 bg-light rounded-3 border small">
              <div class="mb-1"><strong>10th Secondary:</strong> {{ selectedDossier()?.application?.tenthPercentage }}% (Board: {{ selectedDossier()?.application?.tenthBoard || 'CBSE' }})</div>
              <div class="mb-1"><strong>12th Higher Sec.:</strong> {{ selectedDossier()?.application?.twelfthPercentage }}% (Board: {{ selectedDossier()?.application?.twelfthBoard || 'CBSE' }}, Stream: {{ selectedDossier()?.application?.twelfthStream || 'PCM' }})</div>
              <hr class="my-2">
              <div class="mb-1"><strong>Fee Payment:</strong> <span class="badge bg-success" *ngIf="selectedDossier()?.payment?.status === 'SUCCESS'">PAID (Txn: {{ selectedDossier()?.payment?.transactionId }})</span></div>
              <div class="mb-1"><strong>Readiness (Basis Path):</strong> <span class="badge" [ngClass]="selectedDossier()?.readiness?.isReady ? 'bg-success' : 'bg-warning text-dark'">{{ selectedDossier()?.readiness?.isReady ? 'READY' : 'INCOMPLETE' }}</span></div>
              <div class="text-muted mt-2" *ngIf="selectedDossier()?.application?.reviewRemarks">
                <strong>Current Notes:</strong> {{ selectedDossier()?.application?.reviewRemarks }}
              </div>
            </div>
          </div>
        </div>

        <!-- Document Verification Checklist (Storage Bucket Files) -->
        <div class="mb-4">
          <h6 class="fw-bold text-primary mb-2"><i class="bi bi-cloud-arrow-down-fill me-1"></i> Document Authentication Checklist (Storage Bucket)</h6>
          <div class="table-responsive">
            <table class="table table-sm table-bordered align-middle">
              <thead class="table-light small">
                <tr>
                  <th>Doc Type</th>
                  <th>File Name</th>
                  <th>Storage Bucket URI</th>
                  <th>Status</th>
                  <th>Verification Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let doc of selectedDossier()?.documents">
                  <td><span class="badge bg-secondary font-monospace">{{ doc.docType }}</span></td>
                  <td class="small fw-semibold">{{ doc.fileName }}</td>
                  <td class="small font-monospace text-muted" style="font-size: 0.72rem;">gs://iem-admission-portal.appspot.com</td>
                  <td>
                    <span class="badge" [ngClass]="{
                      'bg-success': doc.verificationStatus === 'VERIFIED',
                      'bg-warning text-dark': doc.verificationStatus === 'PENDING',
                      'bg-danger': doc.verificationStatus === 'REJECTED'
                    }">
                      {{ doc.verificationStatus }}
                    </span>
                  </td>
                  <td>
                    <div class="d-flex gap-1">
                      <a [href]="'http://localhost:5000' + doc.filePath" target="_blank" class="btn btn-sm btn-outline-primary py-0 px-2" style="font-size: 0.72rem;">
                        <i class="bi bi-eye"></i> View
                      </a>
                      <button class="btn btn-sm btn-outline-success py-0 px-2" style="font-size: 0.72rem;" (click)="verifyDoc(doc.documentId, 'VERIFIED')">
                        <i class="bi bi-check"></i> Verify
                      </button>
                      <button class="btn btn-sm btn-outline-danger py-0 px-2" style="font-size: 0.72rem;" (click)="verifyDoc(doc.documentId, 'REJECTED')">
                        <i class="bi bi-x"></i> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- DECISION ACTION PANEL -->
        <div class="p-3 bg-white border rounded-3">
          <h6 class="fw-bold text-dark mb-2"><i class="bi bi-pen-fill text-warning me-1"></i> Record Admission Committee Decision</h6>
          <div class="mb-3">
            <label class="form-label small fw-bold">Evaluation Remarks / Feedback Notes *</label>
            <textarea class="form-control" rows="2" [(ngModel)]="decisionRemarks" placeholder="Enter reason for approval or rejection (e.g. Meets cutoff, marksheets authenticated...)"></textarea>
          </div>
          <div class="d-flex flex-wrap gap-2 justify-content-end">
            <button class="btn btn-outline-secondary" (click)="updateStatus('UNDER_REVIEW')">
              <i class="bi bi-hourglass-split me-1"></i> Mark Under Review
            </button>
            <button class="btn btn-danger" (click)="updateStatus('REJECTED')">
              <i class="bi bi-x-circle-fill me-1"></i> Reject Application
            </button>
            <button class="btn btn-success fw-bold px-4" (click)="updateStatus('APPROVED')">
              <i class="bi bi-check-circle-fill me-1"></i> Approve & Generate Official Admit Letter
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

  searchQuery = '';
  statusFilter = '';
  decisionRemarks = '';

  ngOnInit(): void {
    if (!this.api.isAuthenticated()) {
      this.router.navigate(['/auth']);
      return;
    }
    this.loadApplications();
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
    this.api.getApplicationById(app.applicationId).subscribe({
      next: (res) => {
        if (res.success) {
          this.selectedDossier.set(res);
          this.decisionRemarks = res.application.reviewRemarks || 'Academic criteria verified. Approved for admission.';
        }
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
