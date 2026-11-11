import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';
import { AuthComponent } from './components/auth/auth';
import { StudentComponent } from './components/student/student';
import { ApplyComponent } from './components/apply/apply';
import { OfficerComponent } from './components/officer/officer';
import { AdminComponent } from './components/admin/admin';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'IEM Admission Portal | Programs & Catalog' },
  { path: 'auth', component: AuthComponent, title: 'Authentication | IEM Portal' },
  { 
    path: 'student', 
    component: StudentComponent, 
    title: 'Student Dashboard | IEM Portal',
    canActivate: [roleGuard],
    data: { roles: ['APPLICANT', 'ADMINISTRATOR'] }
  },
  { 
    path: 'apply', 
    component: ApplyComponent, 
    title: 'Application & Payment | IEM Portal',
    canActivate: [roleGuard],
    data: { roles: ['APPLICANT', 'ADMINISTRATOR'] }
  },
  { 
    path: 'officer', 
    component: OfficerComponent, 
    title: 'Officer Evaluation | IEM Portal',
    canActivate: [roleGuard],
    data: { roles: ['ADMISSION_OFFICER', 'ADMINISTRATOR'] }
  },
  { 
    path: 'admin', 
    component: AdminComponent, 
    title: 'Admin Console & Analytics | IEM Portal',
    canActivate: [roleGuard],
    data: { roles: ['ADMINISTRATOR'] }
  },
  { path: '**', redirectTo: '' }
];
