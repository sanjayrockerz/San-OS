import { BaseService } from "./base.service";
import type { Repositories } from "@/lib/repositories";
import type { Tables } from "@/types/database";

export class ResourceService extends BaseService {
  constructor(repos: Repositories) {
    super(repos);
  }

  async createResource(
    userId: string,
    data: {
      title: string;
      description?: string;
      resource_type: string;
      mime_type?: string;
      size_bytes?: number;
      checksum?: string;
      storage_path?: string;
      thumbnail_path?: string;
      preview_path?: string;
      metadata?: any;
    },
  ): Promise<Tables<"resources">> {
    return this.repos.resources.create({
      user_id: userId,
      ...data,
    });
  }

  async getResource(resourceId: string): Promise<Tables<"resources"> | null> {
    return this.repos.resources.findById(resourceId);
  }

  async listRecent(userId: string, limit = 50): Promise<Tables<"resources">[]> {
    return this.repos.resources.findRecent(userId, limit);
  }

  async linkResource(
    resourceId: string,
    entityType: string,
    entityId: string,
    relationshipType: string = "attached_to",
  ): Promise<Tables<"resource_links">> {
    return this.repos.resourceLinks.create({
      resource_id: resourceId,
      entity_type: entityType,
      entity_id: entityId,
      relationship_type: relationshipType,
    });
  }

  async getLinksForEntity(
    entityType: string,
    entityId: string,
  ): Promise<(Tables<"resource_links"> & { resources: Tables<"resources"> })[]> {
    return this.repos.resourceLinks.findByEntity(entityType, entityId);
  }
}
