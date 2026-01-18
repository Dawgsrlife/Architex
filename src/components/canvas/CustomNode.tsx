"use client";

import React, { memo, useState } from "react";
import { Handle, Position, NodeProps, Node, useReactFlow } from "@xyflow/react";
import { Trash2, Box } from "lucide-react";
import type { ArchitectureNodeData } from "@/stores/architecture-store";

function isDarkColor(color: string): boolean {
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

function CustomNode({ data, selected, id }: NodeProps<Node<ArchitectureNodeData>>) {
  const isImageUrl = data.icon?.startsWith("http");
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const needsWhiteBg = isDarkColor(data.color);
  const { setNodes } = useReactFlow();

  const deleteNode = () => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
  };

  const handleStyle = {
    width: 12,
    height: 12,
    border: `2px solid ${data.color}`,
    backgroundColor: "white",
    cursor: "crosshair",
  };

  return (
    <div
      className={`
        px-4 py-3 rounded-xl border transition-all duration-200 min-w-[160px] relative bg-white
        ${selected
          ? "border-stone-900 shadow-lg scale-105"
          : "border-stone-200 hover:border-stone-300 hover:shadow-sm"
        }
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {(isHovered || selected) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteNode();
          }}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all shadow-lg hover:scale-110 z-10"
        >
          <Trash2 className="w-3 h-3 text-white" />
        </button>
      )}

      <Handle
        id="top"
        type="target"
        position={Position.Top}
        style={{ ...handleStyle, top: -6, opacity: isHovered || selected ? 1 : 0, transition: "opacity 0.2s" }}
      />

      <Handle
        id="left"
        type="target"
        position={Position.Left}
        style={{ ...handleStyle, left: -6, opacity: isHovered || selected ? 1 : 0, transition: "opacity 0.2s" }}
      />

      <div className="flex items-center gap-3">
        <div
          className={`flex items-center justify-center w-9 h-9 rounded-lg p-1.5 ${
            needsWhiteBg ? "bg-white border border-stone-200" : ""
          }`}
          style={{ backgroundColor: needsWhiteBg ? "white" : `${data.color}15` }}
        >
          {isImageUrl && !imageError ? (
            <img
              src={data.icon}
              alt={data.label}
              className="w-full h-full object-contain"
              onError={() => setImageError(true)}
            />
          ) : (
            <Box className="w-full h-full" style={{ color: data.color }} />
          )}
        </div>
        <div className="flex-1">
          <div className="font-medium text-sm text-stone-900">{data.label}</div>
          <div className="text-xs text-stone-500 capitalize">{data.category}</div>
        </div>
      </div>

      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        style={{ ...handleStyle, bottom: -6, opacity: isHovered || selected ? 1 : 0, transition: "opacity 0.2s" }}
      />

      <Handle
        id="right"
        type="source"
        position={Position.Right}
        style={{ ...handleStyle, right: -6, opacity: isHovered || selected ? 1 : 0, transition: "opacity 0.2s" }}
      />
    </div>
  );
}

export default memo(CustomNode);
