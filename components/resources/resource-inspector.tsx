"use client";

import { XIcon, DownloadIcon, Link2Icon, Share2Icon } from "lucide-react";
import { type Tables } from "@/types/database";
import { Button } from "@/components/ui/button";

export function ResourceInspector({ 
  resource, 
  onClose 
}: { 
  resource: Tables<"resources">;
  onClose: () => void;
}) {
  const metadata = resource.metadata as any;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b shrink-0">
        <h2 className="font-semibold text-sm truncate pr-4">{resource.title}</h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 h-8 w-8">
          <XIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Preview stub */}
        <div className="aspect-video bg-muted rounded-lg border flex items-center justify-center">
          <p className="text-xs text-muted-foreground">Preview Placeholder</p>
        </div>

        {/* Action Bar */}
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex-1">
            <DownloadIcon className="w-4 h-4 mr-2" /> Download
          </Button>
          <Button variant="outline" size="sm" className="px-3">
            <Share2Icon className="w-4 h-4" />
          </Button>
        </div>

        {/* AI Insights Layer */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground">AI Insights</h3>
          {resource.description && (
            <div className="text-sm bg-primary/5 p-3 rounded-md">
              <p className="leading-relaxed">{resource.description}</p>
            </div>
          )}
          {metadata?.aiEntities && metadata.aiEntities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {metadata.aiEntities.map((entity: string) => (
                <span key={entity} className="px-2 py-1 text-xs rounded-full bg-secondary text-secondary-foreground">
                  {entity}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Memory Links */}
        <div className="space-y-3 pt-4 border-t">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
            <Link2Icon className="w-3.5 h-3.5" /> Memory Graph
          </h3>
          <p className="text-xs text-muted-foreground">
            No connections found yet. When you link this to projects or meetings, they will appear here.
          </p>
        </div>

        {/* Meta Info */}
        <div className="space-y-3 pt-4 border-t text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type</span>
            <span className="font-medium uppercase">{resource.resource_type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Size</span>
            <span className="font-medium">{resource.size_bytes ? Math.round(resource.size_bytes / 1024) + " KB" : "--"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Added</span>
            <span className="font-medium">{new Date(resource.created_at).toLocaleDateString()}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
