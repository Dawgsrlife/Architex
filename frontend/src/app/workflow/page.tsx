"use client";

import { useCallback } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  type Connection,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const initialNodes = [
  {
    id: "1",
    type: "input",
    data: { label: "Start: Define Intent" },
    position: { x: 250, y: 25 },
  },
  {
    id: "2",
    data: { label: "AI Code Generation" },
    position: { x: 250, y: 125 },
  },
  {
    id: "3",
    data: { label: "Review & Validate" },
    position: { x: 250, y: 225 },
  },
  {
    id: "4",
    type: "output",
    data: { label: "Deploy to Production" },
    position: { x: 250, y: 325 },
  },
];

const initialEdges = [
  { id: "e1-2", source: "1", target: "2", animated: true },
  { id: "e2-3", source: "2", target: "3", animated: true },
  { id: "e3-4", source: "3", target: "4", animated: true },
];

export default function WorkflowPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="h-screen w-full">
      <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm p-4 rounded-lg border">
        <h1 className="text-2xl font-bold mb-2">Workflow Builder</h1>
        <p className="text-sm text-muted-foreground">
          Drag and connect nodes to create your architecture workflow
        </p>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
