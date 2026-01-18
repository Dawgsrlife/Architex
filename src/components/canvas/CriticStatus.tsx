"use client";

import React from "react";
import { useArchitectureStore, CriticIssue } from "@/stores/architecture-store";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Loader2, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Info
} from "lucide-react";
import { useState } from "react";

const severityConfig = {
  error: {
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  info: {
    icon: Info,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
};

function IssueItem({ issue }: { issue: CriticIssue }) {
  const config = severityConfig[issue.severity];
  const Icon = config.icon;

  return (
    <div className={`flex items-start gap-2 p-2 rounded-lg ${config.bg} ${config.border} border`}>
      <Icon className={`w-4 h-4 ${config.color} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-stone-200">{issue.message}</p>
        {issue.suggestion && (
          <p className="text-xs text-stone-400 mt-0.5">{issue.suggestion}</p>
        )}
      </div>
    </div>
  );
}

export default function CriticStatus() {
  const { criticResult, isCriticLoading, runCritic, nodes } = useArchitectureStore();
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine status
  const getStatusDisplay = () => {
    if (isCriticLoading) {
      return {
        icon: Loader2,
        label: "Validating...",
        color: "text-stone-400",
        bg: "bg-stone-800",
        border: "border-stone-700",
        animate: true,
      };
    }

    if (!criticResult) {
      // No validation run yet
      return {
        icon: AlertCircle,
        label: "Not validated",
        color: "text-stone-500",
        bg: "bg-stone-800/50",
        border: "border-stone-700/50",
        animate: false,
      };
    }

    if (criticResult.blocking) {
      return {
        icon: XCircle,
        label: "Blocked",
        color: "text-red-500",
        bg: "bg-red-500/10",
        border: "border-red-500/20",
        animate: false,
      };
    }

    if (!criticResult.passed && criticResult.issues.length > 0) {
      const hasWarnings = criticResult.issues.some(i => i.severity === "warning");
      if (hasWarnings) {
        return {
          icon: AlertTriangle,
          label: "Warnings",
          color: "text-amber-500",
          bg: "bg-amber-500/10",
          border: "border-amber-500/20",
          animate: false,
        };
      }
    }

    return {
      icon: CheckCircle2,
      label: "Ready",
      color: "text-green-500",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
      animate: false,
    };
  };

  const status = getStatusDisplay();
  const StatusIcon = status.icon;
  const hasIssues = criticResult && criticResult.issues.length > 0;

  return (
    <div className={`rounded-xl ${status.bg} ${status.border} border backdrop-blur-sm`}>
      {/* Header - always visible */}
      <button
        onClick={() => hasIssues && setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 px-3 py-2 w-full ${hasIssues ? "cursor-pointer" : "cursor-default"}`}
      >
        <StatusIcon className={`w-4 h-4 ${status.color} ${status.animate ? "animate-spin" : ""}`} />
        <span className={`text-xs font-medium ${status.color}`}>
          {status.label}
        </span>
        
        {criticResult && (
          <span className="text-xs text-stone-500">
            {criticResult.issues.length > 0 
              ? `(${criticResult.issues.length} issue${criticResult.issues.length > 1 ? "s" : ""})` 
              : ""}
          </span>
        )}

        {hasIssues && (
          <div className="ml-auto">
            {isExpanded ? (
              <ChevronUp className="w-3 h-3 text-stone-500" />
            ) : (
              <ChevronDown className="w-3 h-3 text-stone-500" />
            )}
          </div>
        )}
      </button>

      {/* Expanded issues list */}
      {isExpanded && criticResult && criticResult.issues.length > 0 && (
        <div className="px-3 pb-3 space-y-2 border-t border-stone-700/50 pt-2">
          {criticResult.issues.map((issue, idx) => (
            <IssueItem key={`${issue.code}-${idx}`} issue={issue} />
          ))}
          
          {criticResult.summary && (
            <p className="text-xs text-stone-500 pt-1">{criticResult.summary}</p>
          )}
        </div>
      )}

      {/* Validate button - only show if not loading and either no result or has changes */}
      {!isCriticLoading && nodes.length > 0 && (
        <div className="px-3 pb-2">
          <button
            onClick={() => runCritic()}
            className="w-full text-xs text-stone-400 hover:text-stone-200 py-1.5 rounded-lg hover:bg-stone-700/50 transition-colors"
          >
            {criticResult ? "Re-validate" : "Validate Architecture"}
          </button>
        </div>
      )}
    </div>
  );
}
