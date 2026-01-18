"use client";

import React, { memo, useState } from "react";
import { Handle, Position, NodeProps, Node, useReactFlow } from "@xyflow/react";
import { Trash2, Box } from "lucide-react";
import type { ArchitectureNodeData } from "@/stores/architecture-store";

function CustomNode({ data, selected, id }: NodeProps<Node<ArchitectureNodeData>>) {
  const isImageUrl = data.icon?.startsWith("http");
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { setNodes } = useReactFlow();

  const deleteNode = () => {
    setNodes((nodes) => nodes.filter((node) => node.id !== id));
  };

  return (
    <div
      className={`
        px-4 py-3 rounded-xl border transition-all duration-200 min-w-[160px] relative bg-white
        ${selected
          ? "border-stone-900 shadow-lg scale-105"
          : "border-stone-200 hover:border-stone-300 shadow-sm"
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
        type="source"
        position={Position.Top}
        className={`!w-3 !h-3 !border-2 !bg-white transition-opacity ${
          isHovered || selected ? "!opacity-100" : "!opacity-0"
        }`}
        style={{ borderColor: data.color, top: -6 }}
      />
      <Handle
        id="top-target"
        type="target"
        position={Position.Top}
        className={`!w-3 !h-3 !border-2 !bg-white transition-opacity ${
          isHovered || selected ? "!opacity-100" : "!opacity-0"
        }`}
        style={{ borderColor: data.color, top: -6 }}
      />

      <Handle
        id="left"
        type="source"
        position={Position.Left}
        className={`!w-3 !h-3 !border-2 !bg-white transition-opacity ${
          isHovered || selected ? "!opacity-100" : "!opacity-0"
        }`}
        style={{ borderColor: data.color, left: -6 }}
      />
      <Handle
        id="left-target"
        type="target"
        position={Position.Left}
        className={`!w-3 !h-3 !border-2 !bg-white transition-opacity ${
          isHovered || selected ? "!opacity-100" : "!opacity-0"
        }`}
        style={{ borderColor: data.color, left: -6 }}
      />

      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-lg p-1.5"
          style={{ backgroundColor: `${data.color}15` }}
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
          <div className="text-xs text-stone-400 capitalize">{data.category}</div>
        </div>
      </div>

      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        className={`!w-3 !h-3 !border-2 !bg-white transition-opacity ${
          isHovered || selected ? "!opacity-100" : "!opacity-0"
        }`}
        style={{ borderColor: data.color, bottom: -6 }}
      />
      <Handle
        id="bottom-target"
        type="target"
        position={Position.Bottom}
        className={`!w-3 !h-3 !border-2 !bg-white transition-opacity ${
          isHovered || selected ? "!opacity-100" : "!opacity-0"
        }`}
        style={{ borderColor: data.color, bottom: -6 }}
      />

      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className={`!w-3 !h-3 !border-2 !bg-white transition-opacity ${
          isHovered || selected ? "!opacity-100" : "!opacity-0"
        }`}
        style={{ borderColor: data.color, right: -6 }}
      />
      <Handle
        id="right-target"
        type="target"
        position={Position.Right}
        className={`!w-3 !h-3 !border-2 !bg-white transition-opacity ${
          isHovered || selected ? "!opacity-100" : "!opacity-0"
        }`}
        style={{ borderColor: data.color, right: -6 }}
      />
    </div>
  );
}

export default memo(CustomNode);
