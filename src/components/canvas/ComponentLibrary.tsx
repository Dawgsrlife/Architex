"use client";

import React, { useState } from "react";
import { COMPONENT_LIBRARY } from "@/data/components-data";
import {
  ChevronDown,
  ChevronRight,
  Search,
  Box,
  Server,
  Palette,
  Database,
  Cloud,
  Brain,
  Lock,
  Zap,
  Mail,
  Package,
  RefreshCw,
  Activity,
  Search as SearchIcon,
  CreditCard,
  LucideIcon,
} from "lucide-react";

function isDarkColor(color: string): boolean {
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

const iconMap: Record<string, LucideIcon> = {
  server: Server,
  palette: Palette,
  database: Database,
  cloud: Cloud,
  brain: Brain,
  lock: Lock,
  zap: Zap,
  mail: Mail,
  package: Package,
  "refresh-cw": RefreshCw,
  activity: Activity,
  search: SearchIcon,
  "credit-card": CreditCard,
};

export default function ComponentLibrary() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["backend", "frontend", "database", "hosting"])
  );
  const [searchQuery, setSearchQuery] = useState("");

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const onDragStart = (
    event: React.DragEvent,
    componentId: string,
    label: string,
    category: string,
    icon: string,
    color: string
  ) => {
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify({ componentId, label, category, icon, color })
    );
    event.dataTransfer.effectAllowed = "move";
  };

  const filteredLibrary = COMPONENT_LIBRARY.map((category) => ({
    ...category,
    components: category.components.filter((comp) =>
      comp.name.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((category) => category.components.length > 0);

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-stone-100">
        <h2 className="text-sm font-semibold text-stone-900 mb-3">Components</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-stone-50 border border-stone-200 text-stone-900 text-sm placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/5 focus:border-stone-300 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {filteredLibrary.map((category) => {
          const IconComponent = iconMap[category.icon];
          return (
            <div key={category.id} className="mb-1">
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors text-left"
              >
                {expandedCategories.has(category.id) ? (
                  <ChevronDown className="w-4 h-4 text-stone-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-stone-400" />
                )}
                {IconComponent && (
                  <IconComponent className="w-4 h-4 text-stone-500" />
                )}
                <span className="text-sm font-medium text-stone-700">
                  {category.name}
                </span>
                <span className="ml-auto text-xs text-stone-400">
                  {category.components.length}
                </span>
              </button>

              {expandedCategories.has(category.id) && (
                <div className="mt-1 ml-2 space-y-0.5">
                  {category.components.map((component) => (
                    <div
                      key={component.id}
                      draggable
                      onDragStart={(e) =>
                        onDragStart(
                          e,
                          component.id,
                          component.name,
                          category.id,
                          component.icon,
                          component.color
                        )
                      }
                      className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing hover:bg-stone-50 transition-all duration-200 border border-transparent hover:border-stone-200"
                    >
                      <ComponentIcon
                        icon={component.icon}
                        color={component.color}
                        name={component.name}
                      />
                      <span className="text-sm text-stone-600 truncate">
                        {component.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-stone-100">
        <p className="text-xs text-stone-400 text-center">
          Drag components to canvas
        </p>
      </div>
    </div>
  );
}

function ComponentIcon({
  icon,
  color,
  name,
}: {
  icon: string;
  color: string;
  name: string;
}) {
  const [imageError, setImageError] = useState(false);
  const isImageUrl = icon.startsWith("http");
  const needsWhiteBg = isDarkColor(color);

  return (
    <div
      className={`flex items-center justify-center w-7 h-7 rounded-md p-1 flex-shrink-0 ${
        needsWhiteBg ? "bg-white border border-stone-200" : ""
      }`}
      style={{ backgroundColor: needsWhiteBg ? "white" : `${color}15` }}
    >
      {isImageUrl && !imageError ? (
        <img
          src={icon}
          alt={name}
          className="w-full h-full object-contain"
          onError={() => setImageError(true)}
        />
      ) : (
        <Box className="w-full h-full" style={{ color }} />
      )}
    </div>
  );
}
