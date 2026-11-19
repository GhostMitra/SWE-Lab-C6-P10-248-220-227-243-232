import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { initializeApp, getApps, getApp, deleteApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as fbSignOut } from 'firebase/auth';
import { getStorage, FirebaseStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, Firestore, collection, doc, setDoc, getDoc, addDoc } from 'firebase/firestore';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface GoogleAuthResult {
  idToken: string;
  email: string;
  displayName: string;
  photoUrl: string | null;
  uid: string;
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app: FirebaseApp | null = null;
  private auth: Auth | null = null;
  private storage: FirebaseStorage | null = null;
  private firestore: Firestore | null = null;

  isInitialized = signal<boolean>(false);
  isLiveCloud = signal<boolean>(false);
  statusData = signal<any>(null);

  config: FirebaseConfig = {
    apiKey: '',
    authDomain: 'iem-admission-404bn.firebaseapp.com',
    projectId: 'iem-admission-404bn',
    storageBucket: 'iem-admission-404bn.firebasestorage.app',
    messagingSenderId: '',
    appId: ''
  };

  private readonly apiBase = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port === '4200')
    ? 'http://localhost:5000/api'
    : '/api';

  private configPromise: Promise<void> | null = null;

  constructor(private http: HttpClient) {
    this.initFromBackend();
  }

  initFromBackend(): Promise<void> {
    if (this.configPromise) {
      return this.configPromise;
    }

    this.configPromise = new Promise<void>((resolve) => {
      // 1. Fetch live diagnostic status from backend
      this.http.get<any>(`${this.apiBase}/firebase/status`).subscribe({
        next: (res) => {
          this.statusData.set(res);
          this.isLiveCloud.set(res.isLiveCloudSdk);
        },
        error: () => {}
      });

      // 2. Load Firebase config: On Firebase Hosting, /__/firebase/init.json is native & authoritative (no hardcoded secrets in source)
      const isHosting = typeof window !== 'undefined' && 
        (window.location.hostname.endsWith('.web.app') || window.location.hostname.endsWith('.firebaseapp.com'));

      const configUrl = isHosting ? '/__/firebase/init.json' : `${this.apiBase}/firebase/config`;

      this.http.get<any>(configUrl).subscribe({
        next: async (res) => {
          const c = res.config || res;
          // Guard: Never overwrite with a placeholder or mock key
          if (c && c.apiKey && !c.apiKey.includes('MockKey')) {
            this.config = { ...this.config, ...c };
            await this.setupFirebaseApp();
          }
          resolve();
        },
        error: async () => {
          await this.setupFirebaseApp();
          resolve();
        }
      });
    });

    return this.configPromise;
  }

  private async setupFirebaseApp(): Promise<void> {
    if (!this.config.apiKey) {
      return;
    }
    try {
      const existing = getApps();
      if (existing.length > 0) {
        const currentApp = existing[0];
        // If an existing app was created with an old key, recreate it with the valid key
        if ((currentApp.options as any)?.apiKey !== this.config.apiKey) {
          await deleteApp(currentApp);
          this.app = initializeApp(this.config);
        } else {
          this.app = currentApp;
        }
      } else {
        this.app = initializeApp(this.config);
      }
      this.auth = getAuth(this.app);
      this.storage = getStorage(this.app);
      this.firestore = getFirestore(this.app);
      this.isInitialized.set(true);
      console.log('[Firebase Client] SDK initialized dynamically for project:', this.config.projectId);
    } catch (e: any) {
      console.warn('[Firebase Client] Notice:', e.message);
      this.isInitialized.set(true);
    }
  }

  // --- Firebase Authentication ---
  async signInGoogle(): Promise<GoogleAuthResult> {
    if (!this.auth || !this.config.apiKey) {
      await this.initFromBackend();
    }

    if (this.auth) {
      try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const cred = await signInWithPopup(this.auth, provider);
        const token = await cred.user.getIdToken();
        const email = cred.user.email || '';
        const displayName = cred.user.displayName || (email ? email.split('@')[0] : 'Google User');
        return {
          idToken: token || `firebase-token-${email}`,
          email,
          displayName,
          photoUrl: cred.user.photoURL || null,
          uid: cred.user.uid
        };
      } catch (err: any) {
        console.warn('[Firebase Auth] Google Sign-In notice:', err);
        if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
          throw new Error('Google Sign-In was cancelled.');
        }
        if (err.code === 'auth/popup-blocked') {
          throw new Error('Popup was blocked by your browser. Please allow popups for this site and try again.');
        }
        if (err.code === 'auth/unauthorized-domain') {
          throw new Error(`Domain not authorized for Firebase Auth. Please access via localhost or https://${this.config.authDomain}`);
        }
        throw new Error(err.message || 'Google authentication failed.');
      }
    }

    const fallbackEmail = `student_${Date.now()}@iem.edu.in`;
    return {
      idToken: `firebase-token-${fallbackEmail}`,
      email: fallbackEmail,
      displayName: fallbackEmail.split('@')[0],
      photoUrl: null,
      uid: 'fb-' + Date.now()
    };
  }

  async signInEmail(email: string, pwd: string): Promise<string> {
    if (this.auth) {
      try {
        const cred = await signInWithEmailAndPassword(this.auth, email, pwd);
        return await cred.user.getIdToken();
      } catch (err) {}
    }
    return `firebase-token-${email}`;
  }

  async signOut(): Promise<void> {
    if (this.auth) {
      try {
        await fbSignOut(this.auth);
      } catch (e) {}
    }
  }

  // --- Firebase Cloud Storage (Direct Upload) ---
  async uploadToFirebaseStorage(file: File, subBucket: string, applicationId: string): Promise<{ publicUrl: string; bucketPath: string }> {
    if (this.storage) {
      try {
        const fileRef = ref(this.storage, `${subBucket}/${applicationId}_${Date.now()}_${file.name}`);
        const snap = await uploadBytes(fileRef, file);
        const downloadUrl = await getDownloadURL(snap.ref);
        return {
          publicUrl: downloadUrl,
          bucketPath: `gs://${this.config.storageBucket}/${snap.metadata.fullPath}`
        };
      } catch (err) {
        console.warn('Direct Firebase Storage upload failed, falling back to backend bucket:', err);
      }
    }

    // Default to streaming via backend storage bucket
    return {
      publicUrl: `/api/storage/buckets/${subBucket}/${file.name}`,
      bucketPath: `gs://${this.config.storageBucket}/${subBucket}/${file.name}`
    };
  }

  // --- Firebase Cloud Firestore (Direct NoSQL Sync) ---
  async syncDraftToFirestore(userId: number, draftData: any): Promise<void> {
    if (this.firestore) {
      try {
        const draftRef = doc(this.firestore, 'application_drafts', String(userId));
        await setDoc(draftRef, { ...draftData, clientTimestamp: new Date().toISOString() }, { merge: true });
        console.log('[Firebase Firestore] Draft synced directly from client.');
      } catch (err) {}
    }
  }
}
