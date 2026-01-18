"use client";

import React, { useCallback, useState, useRef } from "react";
import { ReactFlow, Background, Controls, MiniMap, BackgroundVariant, NodeTypes, EdgeTypes, ConnectionMode, useReactFlow, Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useArchitectureStore } from "@/stores/architecture-store";
import CustomNode from "./CustomNode";
import CustomEdge from "./CustomEdge";
import { Undo2, Redo2, Maximize2, Trash2, Copy } from "lucide-react";

const nodeTypes: NodeTypes = { custom: CustomNode };
const edgeTypes: EdgeTypes = { custom: CustomEdge };

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onResetView: () => void;
  canUndo: boolean;
  canRedo: boolean;
  selectedNode?: Node | null;
  onDeleteNode?: () => void;
  onDuplicateNode?: () => void;
}

function ContextMenu({ x, y, onClose, onUndo, onRedo, onResetView, canUndo, canRedo, selectedNode, onDeleteNode, onDuplicateNode }: ContextMenuProps) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed z-50 bg-white border border-stone-200 rounded-xl shadow-lg py-1 min-w-[160px]" style={{ left: x, top: y }}>
        {selectedNode && (
          <>
            <button onClick={() => { onDuplicateNode?.(); onClose(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors"><Copy className="w-4 h-4" />Duplicate</button>
            <button onClick={() => { onDeleteNode?.(); onClose(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" />Delete</button>
            <div className="h-px bg-stone-100 my-1" />
          </>
        )}
        <button onClick={() => { onUndo(); onClose(); }} disabled={!canUndo} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"><Undo2 className="w-4 h-4" />Undo<span className="ml-auto text-xs text-stone-400">⌘Z</span></button>
        <button onClick={() => { onRedo(); onClose(); }} disabled={!canRedo} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"><Redo2 className="w-4 h-4" />Redo<span className="ml-auto text-xs text-stone-400">⌘Y</span></button>
        <div className="h-px bg-stone-100 my-1" />
        <button onClick={() => { onResetView(); onClose(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors"><Maximize2 className="w-4 h-4" />Reset View</button>
      </div>
    </>
  );
}

export default function ArchitectureCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, deleteNode, undo, redo, canUndo, canRedo } = useArchitectureStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node?: Node } | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView, getNode } = useReactFlow();

  const onDragOver = useCallback((event: React.DragEvent) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const componentData = event.dataTransfer.getData("application/reactflow");
    if (!componentData) return;
    const { componentId, label, category, icon, color } = JSON.parse(componentData);
    const reactFlowBounds = (event.target as HTMLElement).closest(".react-flow")?.getBoundingClientRect();
    if (!reactFlowBounds) return;
    const position = { x: event.clientX - reactFlowBounds.left - 80, y: event.clientY - reactFlowBounds.top - 30 };
    addNode({ id: `${componentId}-${Date.now()}`, type: "custom", position, data: { label, componentId, category, icon, color } });
  }, [addNode]);

  const onContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    const target = event.target as HTMLElement;
    const nodeElement = target.closest("[data-id]");
    let selectedNode: Node | undefined;
    if (nodeElement) {
      const nodeId = nodeElement.getAttribute("data-id");
      if (nodeId) selectedNode = getNode(nodeId);
    }
    setContextMenu({ x: event.clientX, y: event.clientY, node: selectedNode });
  }, [getNode]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (connectingFrom) {
      if (connectingFrom !== node.id) {
        onConnect({ source: connectingFrom, target: node.id, sourceHandle: null, targetHandle: null });
      }
      setConnectingFrom(null);
    } else {
      setConnectingFrom(node.id);
      setTimeout(() => setConnectingFrom(null), 3000);
    }
  }, [connectingFrom, onConnect]);

  const onPaneClick = useCallback(() => { setConnectingFrom(null); }, []);

  const handleDeleteNode = useCallback(() => {
    if (contextMenu?.node) deleteNode(contextMenu.node.id);
  }, [contextMenu, deleteNode]);

  const handleDuplicateNode = useCallback(() => {
    if (contextMenu?.node) {
      const node = contextMenu.node;
      const newNode = { ...node, id: `${node.data.componentId}-${Date.now()}`, position: { x: node.position.x + 50, y: node.position.y + 50 } };
      addNode(newNode);
    }
  }, [contextMenu, addNode]);

  return (
    <div ref={reactFlowWrapper} className="w-full h-full" onContextMenu={onContextMenu}>
      <ReactFlow nodes={nodes.map(n => ({ ...n, className: connectingFrom === n.id ? "ring-2 ring-stone-900 ring-offset-2 rounded-xl" : "" }))} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onDrop={onDrop} onDragOver={onDragOver} onNodeClick={onNodeClick} onPaneClick={onPaneClick} connectionMode={ConnectionMode.Loose} proOptions={{ hideAttribution: true }} nodeTypes={nodeTypes} edgeTypes={edgeTypes} fitView className="bg-stone-100" defaultEdgeOptions={{ type: "custom", animated: true }}>
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(168, 162, 158, 0.5)" />
        <Controls showInteractive={false} className="!bg-white !border-stone-200 !rounded-xl !shadow-sm [&>button]:!bg-white [&>button]:!rounded-lg [&>button]:!border [&>button]:!border-stone-200 [&>button]:!w-8 [&>button]:!h-8 [&>button]:hover:!bg-stone-50 [&>button]:!text-stone-600" />
        <MiniMap style={{ height: 100, width: 150 }} className="!bg-white/80 !border-stone-200 !rounded-lg !shadow-sm" maskColor="rgba(255, 255, 255, 0.7)" nodeColor={(node) => { const data = node.data as { color?: string }; return data.color ? `${data.color}` : "#a8a29e"; }} />
      </ReactFlow>
      {connectingFrom && <div className="absolute bottom-20 left-1/2 -translate-x-1/2 px-3 py-2 bg-stone-900 text-white text-sm rounded-lg shadow-lg">Click another node to connect</div>}
      {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)} onUndo={undo} onRedo={redo} onResetView={() => fitView({ duration: 300 })} canUndo={canUndo()} canRedo={canRedo()} selectedNode={contextMenu.node} onDeleteNode={handleDeleteNode} onDuplicateNode={handleDuplicateNode} />}
    </div>
  );
}