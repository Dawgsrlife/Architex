"use client";

import React, { useCallback, useState, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  NodeTypes,
  EdgeTypes,
  ConnectionMode,
  useReactFlow,
  Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useArchitectureStore, ArchitectureNode } from "@/stores/architecture-store";
import CustomNode from "./CustomNode";
import CustomEdge from "./CustomEdge";
import { Undo2, Redo2, Maximize2 } from "lucide-react";

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onFitView: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

function ContextMenu({ x, y, onClose, onUndo, onRedo, onFitView, canUndo, canRedo }: ContextMenuProps) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div 
        className="fixed z-50 bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden py-1 min-w-[160px]"
        style={{ left: x, top: y }}
      >
        <button 
          onClick={() => { onUndo(); onClose(); }}
          disabled={!canUndo}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Undo2 className="w-4 h-4" />
          Undo
          <span className="ml-auto text-xs text-stone-400">Ctrl+Z</span>
        </button>
        <button 
          onClick={() => { onRedo(); onClose(); }}
          disabled={!canRedo}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Redo2 className="w-4 h-4" />
          Redo
          <span className="ml-auto text-xs text-stone-400">Ctrl+Y</span>
        </button>
        <div className="h-px bg-stone-100 my-1" />
        <button 
          onClick={() => { onFitView(); onClose(); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
          Fit View
        </button>
      </div>
    </>
  );
}

function CanvasContent() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useArchitectureStore();

  const { fitView, setEdges } = useReactFlow();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [connectingNode, setConnectingNode] = useState<string | null>(null);

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

      const newNode: ArchitectureNode = {
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

  const onContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY });
  }, []);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (connectingNode && connectingNode !== node.id) {
      const existingEdge = edges.find(
        (edge) =>
          (edge.source === connectingNode && edge.target === node.id) ||
          (edge.source === node.id && edge.target === connectingNode)
      );

      if (!existingEdge) {
        const newEdge = {
          id: `edge-${connectingNode}-${node.id}`,
          source: connectingNode,
          target: node.id,
          type: "custom",
          animated: true,
        };
        setEdges((eds) => [...eds, newEdge]);
      }
      setConnectingNode(null);
    } else if (!connectingNode) {
      setConnectingNode(node.id);
      setTimeout(() => setConnectingNode(null), 3000);
    } else {
      setConnectingNode(null);
    }
  }, [connectingNode, edges, setEdges]);

  const onPaneClick = useCallback(() => {
    setConnectingNode(null);
  }, []);

  return (
    <div className="w-full h-full relative">
      {connectingNode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 bg-stone-900 text-white rounded-full text-sm shadow-lg">
          Click another node to connect
        </div>
      )}
      <ReactFlow
        nodes={nodes.map(n => ({
          ...n,
          style: connectingNode === n.id ? { boxShadow: '0 0 0 3px #1c1917' } : undefined
        }))}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onContextMenu={onContextMenu}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        connectionMode={ConnectionMode.Loose}
        proOptions={{ hideAttribution: true }}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="bg-stone-100"
        defaultEdgeOptions={{
          type: "custom",
          animated: true,
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(168, 162, 158, 0.4)"
        />
        <Controls
          showInteractive={false}
          className="!bg-white !border-stone-200 !rounded-lg !shadow-sm [&>button]:!bg-white [&>button]:!rounded-lg [&>button]:!border [&>button]:!border-stone-200 [&>button]:!w-8 [&>button]:!h-8 [&>button]:hover:!bg-stone-50 [&>button]:!text-stone-500"
        />
        <MiniMap
          style={{ height: 100, width: 150 }}
          className="!bg-white !border-stone-200 !rounded-lg !shadow-sm"
          maskColor="rgba(245, 245, 244, 0.8)"
          nodeColor={(node) => {
            const data = node.data as { color?: string };
            return data.color ? data.color : "#a8a29e";
          }}
        />
      </ReactFlow>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onUndo={undo}
          onRedo={redo}
          onFitView={() => fitView({ duration: 300 })}
          canUndo={canUndo()}
          canRedo={canRedo()}
        />
      )}
    </div>
  );
}

export default function ArchitectureCanvas() {
  return <CanvasContent />;
}
