"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  FileCode2, 
  FolderTree, 
  ChevronDown, 
  ChevronRight,
  Loader2,
  ArrowRight
} from "lucide-react";

interface FileInstruction {
  path: string;
  purpose: string;
  file_type: string;
  must_include: string[];
  must_not_include: string[];
  source_nodes: string[];
}

interface GenerationPlan {
  files: FileInstruction[];
  readme_mapping: Record<string, string[]>;
  total_files: number;
}

interface ProvenanceMappingProps {
  architectureSpec: {
    name: string;
    description: string;
    nodes: Array<{ id: string; data: { label: string; color?: string } }>;
    edges: Array<{ id: string; source: string; target: string }>;
    metadata?: { intent?: string };
  };
  onClose?: () => void;
}

export default function ProvenanceMapping({ architectureSpec, onClose: _onClose }: ProvenanceMappingProps) {
  const [plan, setPlan] = useState<GenerationPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const fetchPlan = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:8000/api/architecture/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          architecture_spec: architectureSpec,
          intent: architectureSpec.metadata?.intent || architectureSpec.description
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate plan");
      }

      const data = await response.json();
      setPlan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [architectureSpec]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // Group files by source node
  const getFilesForNode = (nodeId: string): FileInstruction[] => {
    if (!plan) return [];
    return plan.files.filter(f => f.source_nodes.includes(nodeId));
  };

  // Get node label by ID
  const getNodeLabel = (nodeId: string): string => {
    const node = architectureSpec.nodes.find(n => n.id === nodeId);
    return node?.data.label || nodeId;
  };

  const getNodeColor = (nodeId: string): string => {
    const node = architectureSpec.nodes.find(n => n.id === nodeId);
    return node?.data.color || "#6b7280";
  };

  // File type colors
  const fileTypeColors: Record<string, string> = {
    page: "text-blue-400",
    component: "text-cyan-400",
    api: "text-green-400",
    model: "text-purple-400",
    config: "text-amber-400",
    util: "text-stone-400",
    style: "text-pink-400",
  };

  if (loading) {
    return (
      <div className="bg-stone-900/50 border border-stone-800/40 rounded-xl p-8 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 text-stone-500 animate-spin" />
        <p className="text-sm text-stone-500">Generating file mapping...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={fetchPlan}
          className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="bg-stone-900/30 border border-stone-800/30 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-stone-800/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-medium text-white">Provenance Mapping</h3>
        </div>
        <span className="text-xs text-stone-500">{plan.total_files} files</span>
      </div>

      {/* Mapping */}
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {architectureSpec.nodes.map((node) => {
          const files = getFilesForNode(node.id);
          const isExpanded = expandedNodes.has(node.id);

          if (files.length === 0) return null;

          return (
            <div key={node.id} className="space-y-1">
              <button
                onClick={() => toggleNode(node.id)}
                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-stone-800/50 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-stone-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-stone-500" />
                )}
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getNodeColor(node.id) }}
                />
                <span className="text-sm text-stone-200 flex-1 text-left">
                  {getNodeLabel(node.id)}
                </span>
                <ArrowRight className="w-3 h-3 text-stone-600" />
                <span className="text-xs text-stone-500">
                  {files.length} file{files.length !== 1 ? "s" : ""}
                </span>
              </button>

              {isExpanded && (
                <div className="ml-6 pl-4 border-l border-stone-800 space-y-1">
                  {files.map((file) => (
                    <div
                      key={file.path}
                      className="flex items-start gap-2 py-1.5 px-2 rounded-lg hover:bg-stone-800/30"
                    >
                      <FileCode2 className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${fileTypeColors[file.file_type] || "text-stone-400"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-stone-300 font-mono truncate">
                          {file.path}
                        </p>
                        <p className="text-xs text-stone-600 truncate">
                          {file.purpose}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer with README mapping summary */}
      {Object.keys(plan.readme_mapping).length > 0 && (
        <div className="p-4 border-t border-stone-800/30 bg-stone-900/20">
          <h4 className="text-xs font-medium text-stone-400 mb-2">README Sections</h4>
          <div className="flex flex-wrap gap-1">
            {Object.keys(plan.readme_mapping).map((section) => (
              <span
                key={section}
                className="text-xs px-2 py-0.5 bg-stone-800 text-stone-400 rounded-full"
              >
                {section}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
