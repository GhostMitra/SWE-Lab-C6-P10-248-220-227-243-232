import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ApiService } from '../services/api.service';

/**
 * Role-Based Access Control (RBAC) Route Guard
 * Enforces page access rules based on authenticated user role:
 * - APPLICANT: /student, /apply
 * - OFFICER / ADMISSION_OFFICER: /officer, /admin (read)
 * - ADMINISTRATOR: /admin, /officer
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const api = inject(ApiService);
  const router = inject(Router);

  const user = api.currentUser();
  const token = api.token();

  // 1. Check if user is authenticated
  if (!user || !token) {
    console.warn(`[RBAC Guard] Access Denied to ${state.url}: User is not authenticated.`);
    router.navigate(['/auth'], { queryParams: { returnUrl: state.url, error: 'auth_required' } });
    return false;
  }

  // 2. Check if route has role restrictions
  const requiredRoles: string[] = route.data?.['roles'] || [];
  if (requiredRoles.length === 0) {
    return true; // Public or unrestricted authenticated route
  }

  const userRole = (user.role || '').toUpperCase();
  const normalizedUserRole = (userRole === 'OFFICER' ? 'ADMISSION_OFFICER' : (userRole === 'ADMIN' ? 'ADMINISTRATOR' : userRole));

  const hasAccess = requiredRoles.some(r => {
    const roleUpper = r.toUpperCase();
    const normalizedReq = (roleUpper === 'OFFICER' ? 'ADMISSION_OFFICER' : (roleUpper === 'ADMIN' ? 'ADMINISTRATOR' : roleUpper));
    return normalizedReq === normalizedUserRole || (userRole === 'ADMINISTRATOR' && roleUpper === 'ADMISSION_OFFICER');
  });

  if (!hasAccess) {
    console.warn(`[RBAC Guard] Access Forbidden to ${state.url}: User role '${userRole}' not in [${requiredRoles.join(', ')}]`);
    
    // Redirect to user's authorized home
    if (userRole === 'ADMINISTRATOR') {
      router.navigate(['/admin']);
    } else if (userRole === 'ADMISSION_OFFICER' || userRole === 'OFFICER') {
      router.navigate(['/officer']);
    } else {
      router.navigate(['/student']);
    }
    return false;
  }

  return true;
};
