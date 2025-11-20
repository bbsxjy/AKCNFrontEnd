/**
 * Permission utility functions for role-based access control (RBAC)
 */

export type UserRole = 'admin' | 'manager' | 'editor' | 'viewer'

export interface RoutePermission {
  roles: UserRole[]
  requireAll?: boolean
}

/**
 * Permission definitions for each role
 */
export const ROLE_PERMISSIONS = {
  admin: {
    // Admin has all permissions
    canViewDashboard: true,
    canViewApplications: true,
    canEditApplications: true,
    canDeleteApplications: true,
    canViewMyTasks: true,
    canViewAudit: true,  // Only admin can view audit
    canViewImport: true,
    canViewReports: true,
    canManageUsers: true,  // Only admin can manage users
    canAssignTasks: true,
    canManageAnnouncements: true,
    canUseMCPEdit: true,  // Can use MCP edit commands
    canUseMCPQuery: true
  },
  manager: {
    // Manager has all permissions except audit logs
    canViewDashboard: true,
    canViewApplications: true,
    canEditApplications: true,
    canDeleteApplications: true,
    canViewMyTasks: true,
    canViewAudit: false,  // Manager cannot view audit
    canViewImport: true,
    canViewReports: true,
    canManageUsers: false,
    canAssignTasks: true,  // Manager can assign tasks
    canManageAnnouncements: true,  // Manager can manage announcements
    canUseMCPEdit: true,  // Can use MCP edit commands
    canUseMCPQuery: true
  },
  editor: {
    // Editor can only edit assigned applications
    canViewDashboard: true,
    canViewApplications: true,
    canEditApplications: true,  // But only assigned ones (checked in component)
    canDeleteApplications: false,
    canViewMyTasks: true,
    canViewAudit: false,
    canViewImport: false,
    canViewReports: false,
    canManageUsers: false,
    canAssignTasks: false,
    canManageAnnouncements: false,
    canUseMCPEdit: false,  // Cannot use MCP edit commands
    canUseMCPQuery: true
  },
  viewer: {
    // Viewer can only view dashboard and applications
    canViewDashboard: true,
    canViewApplications: true,
    canEditApplications: false,
    canDeleteApplications: false,
    canViewMyTasks: false,
    canViewAudit: false,
    canViewImport: false,
    canViewReports: false,
    canManageUsers: false,
    canAssignTasks: false,
    canManageAnnouncements: false,
    canUseMCPEdit: false,
    canUseMCPQuery: true
  }
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: keyof typeof ROLE_PERMISSIONS.admin): boolean {
  if (!role || !ROLE_PERMISSIONS[role]) {
    return false
  }
  return ROLE_PERMISSIONS[role][permission] === true
}

/**
 * Check if user can access a specific route
 */
export function canAccessRoute(userRole: UserRole, routeName: string): boolean {
  const roleRouteAccess: Record<string, UserRole[]> = {
    'Dashboard': ['admin', 'manager', 'editor', 'viewer'],
    'Applications': ['admin', 'manager', 'editor', 'viewer'],
    'MyTasks': ['admin', 'manager', 'editor'],
    'SubTasks': ['admin', 'manager', 'editor'],
    'Audit': ['admin'],  // Only admin
    'Import': ['admin', 'manager'],
    'Reports': ['admin', 'manager', 'viewer'],
    'CloudNative': ['admin', 'manager', 'viewer'],  // Cloud Native Dashboard
    'UserManagement': ['admin'],  // Only admin
    'Announcements': ['admin', 'manager'],  // Admin and Manager
    'MCPAgent': ['admin', 'manager', 'editor', 'viewer']
  }

  const allowedRoles = roleRouteAccess[routeName]
  if (!allowedRoles) {
    return true  // If not defined, allow access
  }

  return allowedRoles.includes(userRole)
}

/**
 * Check if user can edit a specific application
 * @param userRole User's role
 * @param userId User's ID
 * @param application Application object to check
 */
export function canEditApplication(
  userRole: UserRole,
  userId: number | string,
  application: any
): boolean {
  // Admin and manager can edit all applications
  if (userRole === 'admin' || userRole === 'manager') {
    return true
  }

  // Editor can only edit applications assigned to them
  if (userRole === 'editor') {
    // Check if application is assigned to this user
    // This checks dev_owner and ops_owner fields
    const devOwner = application.dev_owner || ''
    const opsOwner = application.ops_owner || ''
    const currentUserName = String(userId).toLowerCase()

    return (
      devOwner.toLowerCase().includes(currentUserName) ||
      opsOwner.toLowerCase().includes(currentUserName)
    )
  }

  // Viewer cannot edit
  return false
}

/**
 * Get display-friendly role name
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    admin: '管理员',
    manager: '经理',
    editor: '编辑者',
    viewer: '查看者'
  }
  return roleNames[role] || role
}

/**
 * Get all available roles
 */
export function getAllRoles(): UserRole[] {
  return ['admin', 'manager', 'editor', 'viewer']
}
