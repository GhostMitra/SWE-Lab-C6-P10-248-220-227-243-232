import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container py-4 my-2">
      
      <!-- ADMIN EXECUTIVE BANNER -->
      <div class="card card-modern p-4 mb-4 border-0 shadow-sm bg-white">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
          
          <div class="d-flex align-items-center gap-3">
            <div class="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm"
                 style="width: 52px; height: 52px; font-size: 1.25rem; background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%) !important;">
              <i class="bi bi-shield-lock fs-3"></i>
            </div>
            <div>
              <div class="d-flex align-items-center gap-2">
                <h3 class="fw-bold text-dark mb-0">Admissions Executive Telemetry & Analytics</h3>
                <span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2.5 py-1">
                  Screen 1 (Worksheet)
                </span>
              </div>
              <p class="text-muted small mb-0 mt-1">
                Executive Administrator: <strong>{{ api.currentUser()?.fullName }}</strong> ({{ api.currentUser()?.email }}) • 
                <span class="text-dark font-mono">Central Admissions Board</span>
              </p>
            </div>
          </div>

          <div class="d-flex gap-2">
            <button class="btn btn-iem-outline btn-sm shadow-xs" (click)="loadAll()">
              <i class="bi bi-arrow-clockwise me-1"></i> Refresh Telemetry
            </button>
          </div>

        </div>
      </div>

      <!-- KPI METRIC TILES (4 CARDS) -->
      <div class="row g-3 mb-4">
        
        <!-- Total Applications -->
        <div class="col-sm-6 col-xl-3">
          <div class="kpi-card h-100">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <span class="text-muted small fw-bold text-uppercase" style="font-size: 0.72rem; letter-spacing: 0.05em;">
                  Total Applications
                </span>
                <h2 class="fw-extrabold text-dark mt-1 mb-0">{{ stats()?.totalApplications || 0 }}</h2>
              </div>
              <div class="kpi-icon-box bg-primary bg-opacity-10 text-primary">
                <i class="bi bi-files"></i>
              </div>
            </div>
            <div class="d-flex align-items-center gap-1.5 mt-2.5 small text-muted">
              <i class="bi bi-check-circle-fill text-success"></i> Across 5 degree programs
            </div>
          </div>
        </div>

        <!-- Revenue Collected -->
        <div class="col-sm-6 col-xl-3">
          <div class="kpi-card h-100">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <span class="text-muted small fw-bold text-uppercase" style="font-size: 0.72rem; letter-spacing: 0.05em;">
                  Fee Revenue (INR)
                </span>
                <h2 class="fw-extrabold text-success mt-1 mb-0">₹ {{ stats()?.revenue?.totalRevenueInr || 0 }}</h2>
              </div>
              <div class="kpi-icon-box bg-success bg-opacity-10 text-success">
                <i class="bi bi-cash-stack"></i>
              </div>
            </div>
            <div class="d-flex align-items-center gap-1.5 mt-2.5 small text-muted">
              <i class="bi bi-credit-card-fill text-primary"></i> {{ stats()?.revenue?.successfulPaymentsCount || 0 }} settled orders
            </div>
          </div>
        </div>

        <!-- Storage Bucket Objects -->
        <div class="col-sm-6 col-xl-3">
          <div class="kpi-card h-100">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <span class="text-muted small fw-bold text-uppercase" style="font-size: 0.72rem; letter-spacing: 0.05em;">
                  Storage Bucket
                </span>
                <h2 class="fw-extrabold text-info mt-1 mb-0">{{ stats()?.storageBucket?.totalObjects || 0 }} Files</h2>
              </div>
              <div class="kpi-icon-box bg-info bg-opacity-10 text-info">
                <i class="bi bi-cloud-arrow-up-fill"></i>
              </div>
            </div>
            <div class="d-flex align-items-center gap-1.5 mt-2.5 small text-muted">
              <i class="bi bi-hdd-fill text-secondary"></i> {{ ((stats()?.storageBucket?.totalSizeBytes || 0) / 1024) | number:'1.1-1' }} KB encrypted
            </div>
          </div>
        </div>

        <!-- Firestore NoSQL -->
        <div class="col-sm-6 col-xl-3">
          <div class="kpi-card h-100">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <span class="text-muted small fw-bold text-uppercase" style="font-size: 0.72rem; letter-spacing: 0.05em;">
                  Firestore NoSQL
                </span>
                <h2 class="fw-extrabold text-warning mt-1 mb-0">10 Collections</h2>
              </div>
              <div class="kpi-icon-box bg-warning bg-opacity-10 text-warning">
                <i class="bi bi-fire"></i>
              </div>
            </div>
            <div class="d-flex align-items-center gap-1.5 mt-2.5 small text-muted">
              <span class="status-dot status-dot-active"></span> Live Multi-Collection Store
            </div>
          </div>
        </div>

      </div>

      <!-- NAVIGATION TABS -->
      <div class="nav-pills-modern d-flex flex-wrap mb-4 shadow-xs">
        <button class="nav-link border-0" [class.active]="activeTab() === 'MERIT'" (click)="activeTab.set('MERIT')">
          <i class="bi bi-trophy-fill me-1.5 text-warning"></i> Ranked Merit List
        </button>
        <button class="nav-link border-0" [class.active]="activeTab() === 'BUCKET'" (click)="activeTab.set('BUCKET')">
          <i class="bi bi-cloud-arrow-up-fill me-1.5 text-info"></i> Storage Bucket Explorer
        </button>
        <button class="nav-link border-0" [class.active]="activeTab() === 'USERS'" (click)="activeTab.set('USERS')">
          <i class="bi bi-people-fill me-1.5 text-primary"></i> Users Directory
        </button>
        <button class="nav-link border-0" [class.active]="activeTab() === 'NOSQL'" (click)="activeTab.set('NOSQL')">
          <i class="bi bi-fire me-1.5 text-warning"></i> Firestore Collections
        </button>
        <button class="nav-link border-0" [class.active]="activeTab() === 'AUDIT'" (click)="activeTab.set('AUDIT')">
          <i class="bi bi-shield-shaded me-1.5 text-danger"></i> System Audit Trail
        </button>
      </div>

      <!-- TAB 1: RANKED MERIT LIST -->
      <div *ngIf="activeTab() === 'MERIT'">
        <div class="card card-modern border-0 p-4 shadow-sm bg-white">
          
          <div class="d-flex flex-wrap justify-content-between align-items-center mb-3.5 gap-2">
            <div>
              <h5 class="fw-bold text-dark mb-1">Official Admission Composite Merit List</h5>
              <small class="text-muted">
                Dynamically calculated: <span class="badge bg-light text-dark border font-mono">Merit Score = 0.60 * 12th% + 0.40 * 10th%</span>
              </small>
            </div>
            <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1 small">
              {{ meritList().length }} Candidates Ranked
            </span>
          </div>

          <div class="table-modern-wrapper">
            <table class="table-modern">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Candidate Dossier</th>
                  <th>Applied Course</th>
                  <th>10th Secondary %</th>
                  <th>12th Higher Sec. %</th>
                  <th>Composite Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let m of meritList()">
                  
                  <td>
                    <span class="badge fs-7 px-2.5 py-1" [ngClass]="{
                      'bg-warning text-dark fw-extrabold shadow-xs': m.rank === 1,
                      'bg-secondary text-white fw-bold': m.rank === 2,
                      'bg-dark text-white fw-bold': m.rank === 3,
                      'bg-light text-dark border': m.rank > 3
                    }">
                      <i class="bi" [ngClass]="m.rank === 1 ? 'bi-trophy-fill text-dark' : 'bi-hash'"></i>
                      {{ m.rank }}
                    </span>
                  </td>

                  <td>
                    <div class="fw-bold text-dark">{{ m.fullName }}</div>
                    <small class="text-muted font-mono" style="font-size: 0.74rem;">{{ m.email }}</small>
                  </td>

                  <td>
                    <span class="badge bg-light text-dark border font-mono">{{ m.courseCode }}</span>
                  </td>

                  <td class="fw-semibold">{{ m.tenthPercentage }}%</td>
                  <td class="fw-semibold">{{ m.twelfthPercentage }}%</td>

                  <td>
                    <strong class="text-primary fs-6">{{ m.meritScore }} pts</strong>
                  </td>

                  <td>
                    <span class="badge-status" [ngClass]="{
                      'badge-submitted': m.status === 'SUBMITTED',
                      'badge-under-review': m.status === 'UNDER_REVIEW',
                      'badge-approved': m.status === 'APPROVED',
                      'badge-rejected': m.status === 'REJECTED'
                    }">
                      {{ m.status }}
                    </span>
                  </td>

                </tr>
                <tr *ngIf="!meritList().length">
                  <td colspan="7" class="text-center py-5 text-muted">
                    No candidates found in merit ranking.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>

      <!-- TAB 2: STORAGE BUCKET EXPLORER -->
      <div *ngIf="activeTab() === 'BUCKET'">
        <div class="card card-modern border-0 p-4 shadow-sm bg-white">
          
          <div class="d-flex justify-content-between align-items-center mb-3.5">
            <div>
              <h5 class="fw-bold text-dark mb-1">
                Cloud Storage Bucket: <code class="text-primary">gs://iem-admission-404bn.firebasestorage.app</code>
              </h5>
              <small class="text-muted">Partitioned cloud storage repository as specified in HLD Layer 4</small>
            </div>
          </div>

          <!-- Sub-bucket Volume Overview -->
          <div class="row g-3 mb-4">
            <div class="col-md-3" *ngFor="let item of subBucketSummary() | keyvalue">
              <div class="p-3 bg-light rounded-3 border h-100">
                <div class="small fw-bold text-secondary font-mono mb-1">/{{ item.key }}</div>
                <h5 class="fw-bold text-dark mb-0">{{ item.value.count }} Files</h5>
                <small class="text-muted">{{ (item.value.sizeBytes / 1024) | number:'1.1-1' }} KB stored</small>
              </div>
            </div>
          </div>

          <div class="table-modern-wrapper">
            <table class="table-modern">
              <thead>
                <tr>
                  <th>Partition Sub-Bucket</th>
                  <th>File Name / Key</th>
                  <th>Size</th>
                  <th>Storage Bucket URI</th>
                  <th class="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let file of bucketFiles()">
                  <td><span class="badge bg-info bg-opacity-15 text-dark font-mono border">{{ file.bucket }}</span></td>
                  <td class="small fw-semibold">{{ file.filename }}</td>
                  <td class="small text-muted">{{ (file.sizeBytes / 1024) | number:'1.1-1' }} KB</td>
                  <td class="small text-muted font-mono" style="font-size: 0.72rem;">{{ file.bucketUri }}</td>
                  <td class="text-end">
                    <a [href]="api.getFileUrl(file.downloadUrl)" target="_blank" class="btn btn-sm btn-outline-primary py-1 px-2.5" style="font-size: 0.76rem;">
                      <i class="bi bi-download me-1"></i> View / Download
                    </a>
                  </td>
                </tr>
                <tr *ngIf="!bucketFiles().length">
                  <td colspan="5" class="text-center py-4 text-muted">No files in storage bucket.</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>

      <!-- TAB 3: USERS DIRECTORY -->
      <div *ngIf="activeTab() === 'USERS'">
        <div class="card card-modern border-0 p-4 shadow-sm bg-white">
          <div class="d-flex justify-content-between align-items-center mb-3.5">
            <div>
              <h5 class="fw-bold text-dark mb-1">Firestore Users Collection (NoSQL Documents)</h5>
              <small class="text-muted">User authentication and system RBAC entities stored in Cloud Firestore</small>
            </div>
            <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2.5 py-1">
              {{ users().length }} Registered Users
            </span>
          </div>

          <div class="table-modern-wrapper">
            <table class="table-modern">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Full Name</th>
                  <th>Email Address</th>
                  <th>Mobile</th>
                  <th>Role Designation</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let u of users()">
                  <td class="font-mono text-muted">#{{ u.userId }}</td>
                  <td class="fw-bold text-dark">{{ u.fullName }}</td>
                  <td>{{ u.email }}</td>
                  <td>{{ u.phone || 'N/A' }}</td>
                  <td>
                    <span class="badge" [ngClass]="{
                      'bg-danger': u.role === 'ADMINISTRATOR',
                      'bg-info text-dark': u.role === 'ADMISSION_OFFICER',
                      'bg-primary': u.role === 'APPLICANT'
                    }">{{ u.role }}</span>
                  </td>
                  <td class="small text-muted font-mono">{{ u.createdAt | date:'short' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 4: FIRESTORE NOSQL OVERVIEW -->
      <div *ngIf="activeTab() === 'NOSQL'">
        <div class="card card-modern border-0 p-4 shadow-sm bg-white">
          <div class="d-flex justify-content-between align-items-center mb-3.5">
            <div>
              <h5 class="fw-bold text-dark mb-1"><i class="bi bi-fire text-warning me-2"></i>Firebase Cloud Firestore NoSQL Store</h5>
              <small class="text-muted">Real-time draft syncing, audit event collection, and async notification buffer</small>
            </div>
            <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1">
              Cloud Firestore nam5
            </span>
          </div>

          <div class="row g-4">
            <div class="col-md-6">
              <h6 class="fw-bold text-primary mb-2">
                <i class="bi bi-journal-code me-1"></i> audit_logs Collection (Sample Documents)
              </h6>
              <div class="bg-dark text-white p-3 rounded-3 small font-mono" style="max-height: 380px; overflow-y: auto;">
                <div class="border-bottom border-secondary pb-2 mb-2" *ngFor="let log of noSqlData()?.collections?.audit_logs?.sample">
                  <div class="text-warning fw-bold">{{ log.action }}</div>
                  <div class="text-white-50" style="font-size: 0.72rem;">{{ log.timestamp }}</div>
                  <pre class="mb-0 mt-1 text-info" style="font-size: 0.72rem;">{{ log | json }}</pre>
                </div>
              </div>
            </div>

            <div class="col-md-6">
              <h6 class="fw-bold text-primary mb-2">
                <i class="bi bi-inbox-fill me-1"></i> notification_queue Collection
              </h6>
              <div class="bg-dark text-white p-3 rounded-3 small font-mono" style="max-height: 380px; overflow-y: auto;">
                <div class="border-bottom border-secondary pb-2 mb-2" *ngFor="let q of noSqlData()?.collections?.notification_queue?.sample">
                  <div class="fw-bold text-success">{{ q.queueId }} - {{ q.status }}</div>
                  <div class="text-white-50" style="font-size: 0.72rem;">{{ q.createdAt }}</div>
                  <pre class="mb-0 mt-1 text-info" style="font-size: 0.72rem;">{{ q | json }}</pre>
                </div>
                <div class="text-white-50 text-center py-4" *ngIf="!noSqlData()?.collections?.notification_queue?.sample?.length">
                  Notification queue currently clear.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 5: SYSTEM AUDIT TRAIL -->
      <div *ngIf="activeTab() === 'AUDIT'">
        <div class="card card-modern border-0 p-4 shadow-sm bg-white">
          <div class="d-flex justify-content-between align-items-center mb-3.5">
            <div>
              <h5 class="fw-bold text-dark mb-1">System Security Audit Trail</h5>
              <small class="text-muted">Immutable ledger tracking security events, role logins, and decision changes</small>
            </div>
          </div>

          <div class="table-modern-wrapper">
            <table class="table-modern">
              <thead>
                <tr>
                  <th>Audit ID</th>
                  <th>Actor Email</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Target Entity</th>
                  <th>Details</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let a of auditTrail()">
                  <td class="font-mono text-muted">#{{ a.auditId }}</td>
                  <td class="fw-semibold text-dark">{{ a.actorEmail }}</td>
                  <td><span class="badge bg-secondary bg-opacity-20 text-dark font-mono border">{{ a.actorRole }}</span></td>
                  <td><span class="badge bg-light text-primary border font-mono">{{ a.action }}</span></td>
                  <td>{{ a.targetEntity }} <span class="font-mono text-muted" *ngIf="a.targetId">({{ a.targetId }})</span></td>
                  <td class="small">{{ a.details }}</td>
                  <td class="small text-muted font-mono">{{ a.createdAt | date:'short' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  `
})
export class AdminComponent implements OnInit {
  api = inject(ApiService);
  router = inject(Router);

  activeTab = signal<string>('MERIT');
  stats = signal<any>(null);
  meritList = signal<any[]>([]);
  bucketFiles = signal<any[]>([]);
  subBucketSummary = signal<any>({});
  users = signal<any[]>([]);
  auditTrail = signal<any[]>([]);
  noSqlData = signal<any>(null);

  ngOnInit(): void {
    if (!this.api.isAuthenticated()) {
      this.router.navigate(['/auth']);
      return;
    }
    this.loadAll();
  }

  loadAll(): void {
    this.api.getAdminStats().subscribe({
      next: (res) => {
        if (res.success) {
          this.stats.set(res.stats);
          this.subBucketSummary.set(res.stats.storageBucket?.subBuckets || {});
        }
      }
    });

    this.api.getMeritList().subscribe({
      next: (res) => {
        if (res.success) this.meritList.set(res.meritList);
      }
    });

    this.api.listBucketFiles().subscribe({
      next: (res) => {
        if (res.success) this.bucketFiles.set(res.files);
      }
    });

    this.api.getUsers().subscribe({
      next: (res) => {
        if (res.success) this.users.set(res.users);
      }
    });

    this.api.getAuditTrail().subscribe({
      next: (res) => {
        if (res.success) this.auditTrail.set(res.firestoreAuditLogs || res.sqlAuditTrail || []);
      }
    });

    this.api.getNoSqlOverview().subscribe({
      next: (res) => {
        if (res.success) this.noSqlData.set(res);
      }
    });
  }
}
