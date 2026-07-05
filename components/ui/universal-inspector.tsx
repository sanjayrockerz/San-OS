"use client";

import { useEffect, useState } from "react";
import { getSurroundingContextAction } from "@/app/(app)/memory-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Network, Link2, FileText, Bot, BrainCircuit } from "lucide-react";

export function UniversalInspector({ entityType, entityId }: { entityType: string, entityId: string }) {
  const [context, setContext] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadContext() {
      try {
        setLoading(true);
        setError(null);
        const data = await getSurroundingContextAction(entityType, entityId);
        setContext(data);
      } catch (e) {
        setError("Failed to load context");
      } finally {
        setLoading(false);
      }
    }
    loadContext();
  }, [entityType, entityId]);

  if (loading) {
    return (
      <Card className="w-full h-full border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden rounded-xl">
        <CardHeader className="bg-zinc-900 border-b border-zinc-800">
          <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            <BrainCircuit className="w-4 h-4" /> Memory OS Inspector
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <Skeleton className="h-4 w-3/4 bg-zinc-800" />
          <Skeleton className="h-20 w-full bg-zinc-800" />
          <Skeleton className="h-10 w-full bg-zinc-800" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full h-full border-red-900 bg-zinc-950 text-red-500 flex items-center justify-center">
        {error}
      </Card>
    );
  }

  const { graph, groupedContext } = context;

  return (
    <Card className="w-full h-full border-zinc-800 bg-zinc-950/50 backdrop-blur-xl text-zinc-100 shadow-2xl overflow-hidden rounded-xl flex flex-col">
      <CardHeader className="bg-zinc-900/80 border-b border-zinc-800 py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-blue-400" /> Universal Inspector
          </CardTitle>
          <Badge variant="outline" className="text-xs bg-blue-950 border-blue-900 text-blue-300">
            {graph?.nodes?.length || 0} nodes
          </Badge>
        </div>
      </CardHeader>
      
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-6">
          {/* Active Entity Info */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Bot className="w-3 h-3" /> Target Entity
            </h3>
            <div className="p-3 bg-zinc-900 rounded-md border border-zinc-800">
              <p className="text-sm font-medium text-zinc-200 capitalize">{entityType}</p>
              <p className="text-xs text-zinc-500 font-mono mt-1 break-all">{entityId}</p>
            </div>
          </div>

          {/* Connected Context */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Network className="w-3 h-3" /> Inferred Relationships
            </h3>
            
            {Object.keys(groupedContext || {}).length === 0 ? (
              <p className="text-sm text-zinc-600 italic px-2">No connected memories found.</p>
            ) : (
              Object.entries(groupedContext).map(([type, ids]: [string, any]) => (
                <div key={type} className="space-y-2">
                  <h4 className="text-xs font-medium text-zinc-400 capitalize flex items-center gap-2">
                    <Link2 className="w-3 h-3" /> {type}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {ids.map((id: string) => (
                      <Badge key={id} variant="secondary" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors">
                        {id.substring(0, 8)}...
                      </Badge>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Extracted Edges */}
          {graph?.edges && graph.edges.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-3 h-3" /> Edge Metadata
              </h3>
              <div className="space-y-2">
                {graph.edges.map((edge: any) => (
                  <div key={edge.id} className="text-xs p-2 bg-zinc-900 rounded border border-zinc-800 text-zinc-400">
                    <span className="text-blue-400">{edge.relationship_type}</span> — Confidence: {(edge.confidence * 100).toFixed(0)}%
                    {edge.evidence && <p className="text-zinc-500 mt-1">"{edge.evidence}"</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
