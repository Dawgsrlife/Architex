import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Node,
  Edge,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  Connection,
} from "@xyflow/react";

export interface ArchitectureNodeData extends Record<string, unknown> {
  label: string;
  componentId: string;
  category: string;
  icon: string;
  color: string;
}

export type ArchitectureNode = Node<ArchitectureNodeData>;

export interface ArchitectureStore {
  nodes: ArchitectureNode[];
  edges: Edge[];
  projectName: string;
  projectId: string | null;

  onNodesChange: OnNodesChange<ArchitectureNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (node: ArchitectureNode) => void;
  deleteNode: (id: string) => void;
  setNodes: (nodes: ArchitectureNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  setProjectName: (name: string) => void;
  setProjectId: (id: string | null) => void;
  clearCanvas: () => void;
}

export const useArchitectureStore = create<ArchitectureStore>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      projectName: "Untitled Project",
      projectId: null,

      onNodesChange: (changes) => {
        set({
          nodes: applyNodeChanges(changes, get().nodes) as ArchitectureNode[],
        });
      },

      onEdgesChange: (changes) => {
        set({
          edges: applyEdgeChanges(changes, get().edges),
        });
      },

      onConnect: (connection: Connection) => {
        const { edges } = get();

        if (connection.source === connection.target) return;

        const existingEdge = edges.find(
          (edge: Edge) =>
            (edge.source === connection.source &&
              edge.target === connection.target) ||
            (edge.source === connection.target &&
              edge.target === connection.source)
        );

        if (existingEdge) return;

        set({
          edges: addEdge(connection, edges),
        });
      },

      addNode: (node: ArchitectureNode) => {
        set({
          nodes: [...get().nodes, node],
        });
      },

      deleteNode: (id: string) => {
        set({
          nodes: get().nodes.filter((node) => node.id !== id),
          edges: get().edges.filter(
            (edge) => edge.source !== id && edge.target !== id
          ),
        });
      },

      setNodes: (nodes: ArchitectureNode[]) => {
        set({ nodes });
      },

      setEdges: (edges: Edge[]) => {
        set({ edges });
      },

      setProjectName: (name: string) => {
        set({ projectName: name });
      },

      setProjectId: (id: string | null) => {
        set({ projectId: id });
      },

      clearCanvas: () => {
        set({
          nodes: [],
          edges: [],
          projectName: "Untitled Project",
          projectId: null,
        });
      },
    }),
    {
      name: "architex-canvas-storage",
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        projectName: state.projectName,
        projectId: state.projectId,
      }),
    }
  )
);
