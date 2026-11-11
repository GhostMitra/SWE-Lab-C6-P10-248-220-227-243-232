import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';
import { AuthComponent } from './components/auth/auth';
import { StudentComponent } from './components/student/student';
import { ApplyComponent } from './components/apply/apply';
import { OfficerComponent } from './components/officer/officer';
import { AdminComponent } from './components/admin/admin';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'IEM Admission Portal | Programs & Catalog' },
  { path: 'auth', component: AuthComponent, title: 'Authentication | IEM Portal' },
  { path: 'student', component: StudentComponent, title: 'Student Dashboard | IEM Portal' },
  { path: 'apply', component: ApplyComponent, title: 'Application & Payment | IEM Portal' },
  { path: 'officer', component: OfficerComponent, title: 'Officer Evaluation | IEM Portal' },
  { path: 'admin', component: AdminComponent, title: 'Admin Console & Analytics | IEM Portal' },
  { path: '**', redirectTo: '' }
];
