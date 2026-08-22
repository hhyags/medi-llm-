// MedFlow AI CRM — Centralized Authorization & Permission Matrix
import { UserRole } from '../../types/medflow';

export type AppResource = 'dashboard' | 'patients' | 'appointments' | 'calling' | 'records' | 'settings' | 'chat';
export type AppAction = 'read' | 'create' | 'update' | 'delete';

export interface PermissionRule {
  resource: AppResource;
  actions: AppAction[];
}

const PERMISSION_MATRIX: Record<UserRole, Record<AppResource, AppAction[]>> = {
  admin: {
    dashboard: ['read', 'create', 'update', 'delete'],
    patients: ['read', 'create', 'update', 'delete'],
    appointments: ['read', 'create', 'update', 'delete'],
    calling: ['read', 'create', 'update', 'delete'],
    records: ['read', 'create', 'update', 'delete'],
    settings: ['read', 'create', 'update', 'delete'],
    chat: ['read', 'create', 'update', 'delete'],
  },
  doctor: {
    dashboard: ['read'],
    patients: ['read'],
    appointments: ['read', 'update'],
    calling: ['read'],
    records: ['read', 'create', 'update'],
    settings: [], // Doctors have no settings access -> 403
    chat: ['read', 'create'],
  },
  receptionist: {
    dashboard: ['read'],
    patients: ['read', 'create', 'update'],
    appointments: ['read', 'create', 'update'],
    calling: ['read', 'create'],
    records: ['read'],
    settings: [], // Receptionists have no settings access -> 403
    chat: ['read', 'create'],
  },
  patient: {
    dashboard: ['read'],
    patients: ['read'], // Can only read own profile
    appointments: ['read'], // Can only read own visits
    calling: [], // Cannot access AI dispatch
    records: ['read'], // Can only read own records
    settings: [], // No settings access -> 403
    chat: ['read', 'create'],
  },
};

/**
 * Checks if a given role has permission to perform an action on a resource.
 * Example: hasPermission("doctor", "settings", "read") -> false
 * Example: hasPermission("admin", "patients", "create") -> true
 */
export function hasPermission(role: UserRole | undefined | null, resource: AppResource, action: AppAction = 'read'): boolean {
  if (!role) return false;
  const rolePermissions = PERMISSION_MATRIX[role];
  if (!rolePermissions) return false;
  const allowedActions = rolePermissions[resource];
  if (!allowedActions) return false;
  return allowedActions.includes(action);
}

/**
 * Determines whether a user role can view a specific top-level navigation route.
 */
export function canAccessRoute(role: UserRole | undefined | null, routePath: string): boolean {
  if (!role) return false;
  
  const cleanPath = routePath.replace(/^\//, '').split('/')[0] as AppResource;
  if (!cleanPath || cleanPath === ('dashboard' as any)) return true;
  
  return hasPermission(role, cleanPath, 'read');
}
