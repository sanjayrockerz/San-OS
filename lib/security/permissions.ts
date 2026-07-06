export type Permission =
  | "read:own"
  | "write:own"
  | "delete:own"
  | "read:workspace"
  | "write:workspace"
  | "admin:workspace"
  | "read:any"
  | "write:any"
  | "admin:system";

export type ResourceType =
  | "problem"
  | "concept"
  | "knowledge"
  | "project"
  | "client"
  | "invoice"
  | "pipeline"
  | "finance"
  | "time_block"
  | "goal"
  | "iit_assignment"
  | "roadmap"
  | "revision"
  | "memory"
  | "notification";

export interface AccessRequest {
  userId: string;
  resourceType: ResourceType;
  resourceId: string;
  permission: Permission;
  workspaceId?: string;
}

export interface AccessDecision {
  granted: boolean;
  reason: string;
  requiredPermission: Permission;
}

export class PermissionGuard {
  verifyOwnership(userId: string, resourceUserId: string): boolean {
    return userId === resourceUserId;
  }

  verifyWorkspaceAccess(
    userId: string,
    workspaceMemberIds: string[],
  ): boolean {
    return workspaceMemberIds.includes(userId);
  }

  verify(request: AccessRequest): AccessDecision {
    switch (request.permission) {
      case "read:own":
      case "write:own":
      case "delete:own":
        return {
          granted: true,
          reason: "Self-access granted",
          requiredPermission: request.permission,
        };
      case "read:workspace":
      case "write:workspace":
      case "admin:workspace":
        return {
          granted: !!request.workspaceId,
          reason: request.workspaceId
            ? `Workspace access via ${request.workspaceId}`
            : "No workspace context",
          requiredPermission: request.permission,
        };
      default:
        return {
          granted: false,
          reason: `Permission ${request.permission} not implemented`,
          requiredPermission: request.permission,
        };
    }
  }

  async auditLog(
    request: AccessRequest,
    decision: AccessDecision,
  ): Promise<void> {
    try {
      const { captureEvent } = await import("@/lib/observability/logger");
      captureEvent("security.access_check", {
        userId: request.userId,
        resourceType: request.resourceType,
        resourceId: request.resourceId,
        permission: request.permission,
        granted: decision.granted,
        reason: decision.reason,
      });
    } catch {
      // fail-soft
    }
  }
}
