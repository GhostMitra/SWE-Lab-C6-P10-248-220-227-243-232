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
    <div class="container py-4">
      <!-- Admin Header -->
      <div class="card card-custom p-4 mb-4 border-0 bg-white shadow-sm">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <div class="d-flex align-items-center gap-2">
              <h3 class="fw-bold text-dark mb-0">Central Admissions Executive Control & Analytics</h3>
              <span class="badge bg-danger text-uppercase">Screen 1 (Worksheet)</span>
            </div>
            <p class="text-muted small mb-0 mt-1">
              Administrator: <strong>{{ api.currentUser()?.fullName }}</strong> | Executive Control Module (0.0 IEM Admission Portal)
            </p>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary" (click)="loadAll()">
              <i class="bi bi-arrow-clockwise me-1"></i> Refresh System Telemetry
            </button>
          </div>
        </div>
      </div>

      <!-- KPI Telemetry Cards -->
      <div class="row g-3 mb-4">
        <div class="col-sm-6 col-xl-3">
          <div class="card card-custom p-3 border-0 bg-white">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <span class="text-muted small fw-bold text-uppercase">Total Applications</span>
                <h3 class="fw-bold text-dark mt-1 mb-0">{{ stats()?.totalApplications || 0 }}</h3>
              </div>
              <div class="bg-primary text-white p-2.5 rounded-3"><i class="bi bi-files fs-4"></i></div>
            </div>
            <small class="text-muted mt-2 d-block">Across all degree programs</small>
          </div>
        </div>

        <div class="col-sm-6 col-xl-3">
          <div class="card card-custom p-3 border-0 bg-white">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <span class="text-muted small fw-bold text-uppercase">Fee Revenue (INR)</span>
                <h3 class="fw-bold text-success mt-1 mb-0">₹ {{ stats()?.revenue?.totalRevenueInr || 0 }}</h3>
              </div>
              <div class="bg-success text-white p-2.5 rounded-3"><i class="bi bi-cash-stack fs-4"></i></div>
            </div>
            <small class="text-muted mt-2 d-block">{{ stats()?.revenue?.successfulPaymentsCount || 0 }} successful transactions</small>
          </div>
        </div>

        <div class="col-sm-6 col-xl-3">
          <div class="card card-custom p-3 border-0 bg-white">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <span class="text-muted small fw-bold text-uppercase">Storage Bucket</span>
                <h3 class="fw-bold text-info mt-1 mb-0">{{ stats()?.storageBucket?.totalObjects || 0 }} Files</h3>
              </div>
              <div class="bg-info text-white p-2.5 rounded-3"><i class="bi bi-cloud-check-fill fs-4"></i></div>
            </div>
            <small class="text-muted mt-2 d-block">{{ ((stats()?.storageBucket?.totalSizeBytes || 0) / 1024) | number:'1.1-1' }} KB stored in bucket</small>
          </div>
        </div>

        <div class="col-sm-6 col-xl-3">
          <div class="card card-custom p-3 border-0 bg-white">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <span class="text-muted small fw-bold text-uppercase">Firestore Database</span>
                <h3 class="fw-bold text-warning mt-1 mb-0">10 Collections</h3>
              </div>
              <div class="bg-warning text-dark p-2.5 rounded-3"><i class="bi bi-fire fs-4"></i></div>
            </div>
            <small class="text-muted mt-2 d-block">Pure NoSQL Cloud Database</small>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <ul class="nav nav-pills mb-4 bg-white p-1 rounded-3 border">
        <li class="nav-item">
          <button class="nav-link py-2 fw-semibold" [class.active]="activeTab() === 'MERIT'" (click)="activeTab.set('MERIT')">
            <i class="bi bi-trophy me-1"></i> Ranked Merit List
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link py-2 fw-semibold" [class.active]="activeTab() === 'BUCKET'" (click)="activeTab.set('BUCKET')">
            <i class="bi bi-cloud-arrow-up me-1"></i> Storage Bucket Objects
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link py-2 fw-semibold" [class.active]="activeTab() === 'USERS'" (click)="activeTab.set('USERS')">
            <i class="bi bi-people me-1"></i> User Management (Firestore)
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link py-2 fw-semibold" [class.active]="activeTab() === 'NOSQL'" (click)="activeTab.set('NOSQL')">
            <i class="bi bi-fire me-1"></i> Cloud Firestore Collections
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link py-2 fw-semibold" [class.active]="activeTab() === 'AUDIT'" (click)="activeTab.set('AUDIT')">
            <i class="bi bi-shield-shaded me-1"></i> System Audit Trail
          </button>
        </li>
      </ul>

      <!-- TAB 1: RANKED MERIT LIST -->
      <div *ngIf="activeTab() === 'MERIT'">
        <div class="card card-custom border-0 p-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 class="fw-bold text-dark mb-0">Official Admission Merit List</h5>
              <small class="text-muted">Rank calculated dynamically: Composite Score = 60% of 12th + 40% of 10th</small>
            </div>
          </div>

          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light small">
                <tr>
                  <th>Rank</th>
                  <th>Candidate</th>
                  <th>Course</th>
                  <th>10th %</th>
                  <th>12th %</th>
                  <th>Composite Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let m of meritList()">
                  <td>
                    <span class="badge" [ngClass]="m.rank === 1 ? 'bg-warning text-dark' : (m.rank === 2 ? 'bg-secondary' : 'bg-light text-dark border')">
                      #{{ m.rank }}
                    </span>
                  </td>
                  <td>
                    <div class="fw-bold">{{ m.fullName }}</div>
                    <small class="text-muted">{{ m.email }}</small>
                  </td>
                  <td><span class="badge bg-light text-dark border">{{ m.courseCode }}</span></td>
                  <td>{{ m.tenthPercentage }}%</td>
                  <td>{{ m.twelfthPercentage }}%</td>
                  <td><strong class="text-primary">{{ m.meritScore }} pts</strong></td>
                  <td>
                    <span class="badge-status" [ngClass]="{
                      'badge-submitted': m.status === 'SUBMITTED',
                      'badge-under-review': m.status === 'UNDER_REVIEW',
                      'badge-approved': m.status === 'APPROVED',
                      'badge-rejected': m.status === 'REJECTED'
                    }">{{ m.status }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 2: STORAGE BUCKET OBJECTS -->
      <div *ngIf="activeTab() === 'BUCKET'">
        <div class="card card-custom border-0 p-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 class="fw-bold text-dark mb-0">Cloud Storage Bucket: <code>gs://iem-admission-portal.appspot.com</code></h5>
              <small class="text-muted">Object storage repository separated into dedicated sub-buckets as per HLD Layer 4</small>
            </div>
          </div>

          <div class="row g-3 mb-4">
            <div class="col-md-3" *ngFor="let item of subBucketSummary() | keyvalue">
              <div class="p-3 bg-light rounded-3 border">
                <div class="small fw-bold text-secondary font-monospace">{{ item.key }}</div>
                <h5 class="fw-bold text-dark mt-1 mb-0">{{ item.value.count }} Objects</h5>
                <small class="text-muted">{{ (item.value.sizeBytes / 1024) | number:'1.1-1' }} KB</small>
              </div>
            </div>
          </div>

          <div class="table-responsive">
            <table class="table table-sm table-hover align-middle mb-0">
              <thead class="table-light small">
                <tr>
                  <th>Sub-Bucket Folder</th>
                  <th>Object Key / File Name</th>
                  <th>Size</th>
                  <th>Bucket URI</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let file of bucketFiles()">
                  <td><span class="badge bg-info text-dark font-monospace">{{ file.bucket }}</span></td>
                  <td class="small fw-semibold">{{ file.filename }}</td>
                  <td class="small text-muted">{{ (file.sizeBytes / 1024) | number:'1.1-1' }} KB</td>
                  <td class="small text-muted font-monospace" style="font-size: 0.72rem;">{{ file.bucketUri }}</td>
                  <td>
                    <a [href]="'http://localhost:5000' + file.downloadUrl" target="_blank" class="btn btn-sm btn-outline-primary py-0 px-2" style="font-size: 0.72rem;">
                      <i class="bi bi-box-arrow-up-right me-1"></i>Download / View
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 3: USER MANAGEMENT -->
      <div *ngIf="activeTab() === 'USERS'">
        <div class="card card-custom border-0 p-4">
          <h5 class="fw-bold text-dark mb-3">Firestore Users Collection (NoSQL Documents)</h5>
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light small">
                <tr>
                  <th>User ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>System Role</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let u of users()">
                  <td class="font-monospace">#{{ u.userId }}</td>
                  <td class="fw-bold">{{ u.fullName }}</td>
                  <td>{{ u.email }}</td>
                  <td>{{ u.phone || 'N/A' }}</td>
                  <td>
                    <span class="badge" [ngClass]="{
                      'bg-danger': u.role === 'ADMINISTRATOR',
                      'bg-info text-dark': u.role === 'ADMISSION_OFFICER',
                      'bg-primary': u.role === 'APPLICANT'
                    }">{{ u.role }}</span>
                  </td>
                  <td class="small text-muted">{{ u.createdAt | date:'short' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 4: FIREBASE FIRESTORE NOSQL DOCUMENT STORE -->
      <div *ngIf="activeTab() === 'NOSQL'">
        <div class="card card-custom border-0 p-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 class="fw-bold text-dark mb-0"><i class="bi bi-fire text-warning me-2"></i>Firebase Cloud Firestore (NoSQL Document Store)</h5>
              <small class="text-muted">High-speed draft caching, unformatted audit events, and asynchronous dispatch buffer</small>
            </div>
            <span class="badge bg-success">Cloud Firestore Active</span>
          </div>

          <div class="row g-4">
            <div class="col-md-6">
              <h6 class="fw-bold text-primary mb-2"><i class="bi bi-file-earmark-code me-1"></i> Recent Firestore Audit Logs (audit_logs collection)</h6>
              <div class="bg-light p-3 rounded-3 border small font-monospace" style="max-height: 340px; overflow-y: auto;">
                <div class="border-bottom pb-2 mb-2" *ngFor="let log of noSqlData()?.collections?.audit_logs?.sample">
                  <div class="text-primary fw-bold">{{ log.action }}</div>
                  <div class="text-muted">{{ log.timestamp }}</div>
                  <pre class="mb-0 mt-1 text-dark" style="font-size: 0.72rem;">{{ log | json }}</pre>
                </div>
              </div>
            </div>

            <div class="col-md-6">
              <h6 class="fw-bold text-primary mb-2"><i class="bi bi-inbox-fill me-1"></i> Firestore Queue (notification_queue collection)</h6>
              <div class="bg-light p-3 rounded-3 border small font-monospace" style="max-height: 340px; overflow-y: auto;">
                <div class="border-bottom pb-2 mb-2" *ngFor="let q of noSqlData()?.collections?.notification_queue?.sample">
                  <div class="fw-bold text-success">{{ q.queueId }} - {{ q.status }}</div>
                  <div class="text-muted">{{ q.createdAt }}</div>
                  <pre class="mb-0 mt-1 text-dark" style="font-size: 0.72rem;">{{ q | json }}</pre>
                </div>
                <div class="text-muted text-center py-4" *ngIf="!noSqlData()?.collections?.notification_queue?.sample?.length">
                  Notification queue currently clear.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 5: AUDIT TRAIL -->
      <div *ngIf="activeTab() === 'AUDIT'">
        <div class="card card-custom border-0 p-4">
          <h5 class="fw-bold text-dark mb-3">Firebase Cloud Firestore Audit Trail</h5>
          <div class="table-responsive">
            <table class="table table-sm table-hover align-middle mb-0">
              <thead class="table-light small">
                <tr>
                  <th>Audit ID</th>
                  <th>Actor</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Details</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let a of auditTrail()">
                  <td class="font-monospace">#{{ a.auditId }}</td>
                  <td class="fw-semibold">{{ a.actorEmail }}</td>
                  <td><span class="badge bg-secondary font-monospace">{{ a.actorRole }}</span></td>
                  <td><span class="badge bg-light text-dark border font-monospace">{{ a.action }}</span></td>
                  <td>{{ a.targetEntity }} <span *ngIf="a.targetId">({{ a.targetId }})</span></td>
                  <td class="small">{{ a.details }}</td>
                  <td class="small text-muted font-monospace">{{ a.createdAt | date:'short' }}</td>
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
