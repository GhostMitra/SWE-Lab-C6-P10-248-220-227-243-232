import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';

export interface User {
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  role: 'APPLICANT' | 'ADMISSION_OFFICER' | 'ADMINISTRATOR';
  createdAt?: string;
  applicant?: any;
}

export interface Course {
  courseId: number;
  courseCode: string;
  courseName: string;
  degree: string;
  durationYears: number;
  eligibilityCriteria: string;
  minTenthPercentage: number;
  minTwelfthPercentage: number;
  seats: number;
  applicationFee: number;
  isOpen: number;
}

export interface Application {
  applicationId: string;
  userId: number;
  courseId: number;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  applicationDate: string;
  reviewRemarks?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  courseCode?: string;
  courseName?: string;
  degree?: string;
  applicationFee?: number;
  tenthPercentage?: number;
  twelfthPercentage?: number;
  paymentStatus?: string;
  transactionId?: string;
  readiness?: {
    formComplete: boolean;
    documentsUploaded: boolean;
    feePaid: boolean;
    isReady: boolean;
    uploadedDocumentsCount: number;
    paymentStatus: string;
  };
  documents?: any[];
  payment?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port === '4200')
    ? 'http://localhost:5000/api'
    : '/api';

  // Signals for reactive state
  currentUser = signal<User | null>(null);
  token = signal<string | null>(null);
  isAuthenticated = computed(() => !!this.currentUser());

  constructor(private http: HttpClient) {
    this.loadSession();
  }

  private loadSession(): void {
    const savedToken = localStorage.getItem('iem_token');
    const savedUser = localStorage.getItem('iem_user');
    if (savedToken && savedUser) {
      try {
        this.token.set(savedToken);
        this.currentUser.set(JSON.parse(savedUser));
      } catch (e) {
        this.logout();
      }
    }
  }

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    const token = this.token();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  // --- Auth APIs ---
  register(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/register`, data).pipe(
      tap(res => {
        if (res.success && res.token) {
          this.setSession(res.token, res.user);
        }
      })
    );
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/login`, credentials).pipe(
      tap(res => {
        if (res.success && res.token) {
          this.setSession(res.token, res.user);
        }
      })
    );
  }

  firebaseLogin(idToken: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/firebase-login`, { idToken }).pipe(
      tap(res => {
        if (res.success && res.token) {
          this.setSession(res.token, res.user);
        }
      })
    );
  }

  setSession(token: string, user: User): void {
    this.token.set(token);
    this.currentUser.set(user);
    localStorage.setItem('iem_token', token);
    localStorage.setItem('iem_user', JSON.stringify(user));
  }

  logout(): void {
    this.token.set(null);
    this.currentUser.set(null);
    localStorage.removeItem('iem_token');
    localStorage.removeItem('iem_user');
  }

  getMe(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/auth/me`, { headers: this.getHeaders() });
  }

  // --- Courses ---
  getCourses(): Observable<{ success: boolean; courses: Course[] }> {
    return this.http.get<{ success: boolean; courses: Course[] }>(`${this.baseUrl}/courses`);
  }

  createCourse(course: Partial<Course>): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/courses`, course, { headers: this.getHeaders() });
  }

  updateCourse(id: number, course: Partial<Course>): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/courses/${id}`, course, { headers: this.getHeaders() });
  }

  // --- Applications ---
  submitApplication(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/applications`, data, { headers: this.getHeaders() });
  }

  getMyApplications(): Observable<{ success: boolean; applications: Application[] }> {
    return this.http.get<{ success: boolean; applications: Application[] }>(`${this.baseUrl}/applications/my`, { headers: this.getHeaders() });
  }

  getAllApplications(filters: { status?: string; courseId?: string; search?: string } = {}): Observable<any> {
    let params = new HttpParams();
    if (filters.status) params = params.set('status', filters.status);
    if (filters.courseId) params = params.set('courseId', filters.courseId);
    if (filters.search) params = params.set('search', filters.search);
    return this.http.get<any>(`${this.baseUrl}/applications`, { headers: this.getHeaders(), params });
  }

  getApplicationById(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/applications/${id}`, { headers: this.getHeaders() });
  }

  updateApplicationStatus(id: string, status: string, reviewRemarks: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/applications/${id}/status`, { status, reviewRemarks }, { headers: this.getHeaders() });
  }

  getAdmitLetter(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/applications/${id}/admit-letter`, { headers: this.getHeaders() });
  }

  saveDraft(draft: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/applications/draft`, draft, { headers: this.getHeaders() });
  }

  getDraft(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/applications/draft`, { headers: this.getHeaders() });
  }

  // --- Documents & Storage Bucket ---
  uploadDocument(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/documents/upload`, formData, { headers: this.getHeaders() });
  }

  verifyDocument(documentId: number, verificationStatus: string, verificationNotes: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/documents/${documentId}/verify`, { verificationStatus, verificationNotes }, { headers: this.getHeaders() });
  }

  getBucketStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/storage/stats`);
  }

  listBucketFiles(subBucket?: string): Observable<any> {
    let params = new HttpParams();
    if (subBucket) params = params.set('subBucket', subBucket);
    return this.http.get<any>(`${this.baseUrl}/storage/files`, { headers: this.getHeaders(), params });
  }

  // --- Payment Gateway ---
  initiatePayment(applicationId: string, paymentMethod = 'UPI / CARD'): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/payments/initiate`, { applicationId, paymentMethod }, { headers: this.getHeaders() });
  }

  verifyPayment(paymentId: string, gatewayOrderId: string, paymentMethod = 'UPI / CARD', simulateFailure = false): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/payments/verify`, { paymentId, gatewayOrderId, paymentMethod, simulateFailure }, { headers: this.getHeaders() });
  }

  getPaymentReceipt(applicationId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/payments/${applicationId}/receipt`, { headers: this.getHeaders() });
  }

  // --- Admin & Analytics ---
  getAdminStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/admin/stats`, { headers: this.getHeaders() });
  }

  getUsers(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/admin/users`, { headers: this.getHeaders() });
  }

  getAuditTrail(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/admin/audit-trail`, { headers: this.getHeaders() });
  }

  getMeritList(courseId?: string): Observable<any> {
    let params = new HttpParams();
    if (courseId) params = params.set('courseId', courseId);
    return this.http.get<any>(`${this.baseUrl}/admin/merit-list`, { headers: this.getHeaders(), params });
  }

  getNoSqlOverview(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/nosql/overview`, { headers: this.getHeaders() });
  }

  getMyNotifications(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/notifications/my`, { headers: this.getHeaders() });
  }

  getHealth(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/health`);
  }
}
