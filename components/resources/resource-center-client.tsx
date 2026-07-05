"use client";

import { useState } from "react";
import { type Tables } from "@/types/database";
import { ResourceInspector } from "./resource-inspector";
import { FileIcon, ImageIcon, FileTextIcon, VideoIcon, AudioLinesIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Resource = Tables<"resources">;

export function ResourceCenterClient({ initialResources }: { initialResources: Resource[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const getIcon = (type: string) => {
    switch (type) {
      case "image": return <ImageIcon className="w-8 h-8 text-blue-500" />;
      case "pdf":
      case "document": return <FileTextIcon className="w-8 h-8 text-orange-500" />;
      case "video": return <VideoIcon className="w-8 h-8 text-purple-500" />;
      case "audio":
      case "voice_note": return <AudioLinesIcon className="w-8 h-8 text-green-500" />;
      default: return <FileIcon className="w-8 h-8 text-gray-500" />;
    }
  };

  const selectedResource = initialResources.find(r => r.id === selectedId);

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Main Grid Pane */}
      <div className={cn("flex-1 h-full overflow-y-auto p-6 transition-all duration-300 ease-in-out", selectedId ? "pr-0" : "")}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {initialResources.map(resource => (
            <div
              key={resource.id}
              onClick={() => setSelectedId(resource.id)}
              className={cn(
                "group relative aspect-square rounded-xl border p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all",
                "hover:shadow-md hover:border-primary/50 bg-card",
                selectedId === resource.id ? "ring-2 ring-primary border-primary bg-primary/5" : ""
              )}
            >
              <div className="mb-3 transition-transform group-hover:scale-110">
                {getIcon(resource.resource_type)}
              </div>
              <h3 className="text-sm font-medium line-clamp-2 w-full">{resource.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 uppercase">
                {resource.resource_type}
              </p>
            </div>
          ))}
          
          {initialResources.length === 0 && (
            <div className="col-span-full h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl">
              <FileIcon className="w-12 h-12 mb-4 opacity-50" />
              <p>No resources found. Upload your first file to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right split-pane Inspector */}
      {selectedResource && (
        <div className="w-[400px] shrink-0 h-full border-l bg-card animate-in slide-in-from-right-16 duration-300">
          <ResourceInspector 
            resource={selectedResource} 
            onClose={() => setSelectedId(null)} 
          />
        </div>
      )}
    </div>
  );
}
