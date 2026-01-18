"use client";

import React, { useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  NodeTypes,
  EdgeTypes,
  ConnectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useArchitectureStore } from "@/stores/architecture-store";
import CustomNode from "./CustomNode";
import CustomEdge from "./CustomEdge";

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

export default function ArchitectureCanvas() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
  } = useArchitectureStore();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const componentData = event.dataTransfer.getData("application/reactflow");
      if (!componentData) return;

      const { componentId, label, category, icon, color } = JSON.parse(componentData);

      const reactFlowBounds = (event.target as HTMLElement)
        .closest(".react-flow")
        ?.getBoundingClientRect();

      if (!reactFlowBounds) return;

      const position = {
        x: event.clientX - reactFlowBounds.left - 80,
        y: event.clientY - reactFlowBounds.top - 30,
      };

      const newNode = {
        id: `${componentId}-${Date.now()}`,
        type: "custom",
        position,
        data: {
          label,
          componentId,
          category,
          icon,
          color,
        },
      };

      addNode(newNode);
    },
    [addNode]
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        connectionMode={ConnectionMode.Loose}
        proOptions={{ hideAttribution: true }}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="bg-stone-950"
        defaultEdgeOptions={{
          type: "custom",
          animated: true,
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="rgba(120, 113, 108, 0.3)"
        />
        <Controls
          showInteractive={false}
          className="!bg-stone-900/80 !border-stone-700 !rounded-xl !shadow-lg [&>button]:!bg-stone-800 [&>button]:!rounded-lg [&>button]:!border [&>button]:!border-stone-700 [&>button]:!w-8 [&>button]:!h-8 [&>button]:hover:!bg-stone-700 [&>button]:!text-stone-300"
        />
        <MiniMap
          style={{ height: 100, width: 150 }}
          className="!bg-stone-900/50 !border-stone-700 !rounded-lg !shadow-lg"
          maskColor="rgba(0, 0, 0, 0.5)"
          nodeColor={(node) => {
            const data = node.data as { color?: string };
            return data.color ? `${data.color}80` : "#57534e";
          }}
        />
      </ReactFlow>
    </div>
  );
}
