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

interface HistoryState {
  nodes: ArchitectureNode[];
  edges: Edge[];
}

export interface ArchitectureStore {
  nodes: ArchitectureNode[];
  edges: Edge[];
  projectName: string;
  projectId: string | null;

  history: HistoryState[];
  historyIndex: number;
  isHistoryInitialized: boolean;

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

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  pushHistory: () => void;
  initHistory: () => void;
}

const MAX_HISTORY = 50;

export const useArchitectureStore = create<ArchitectureStore>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      projectName: "Untitled Project",
      projectId: null,
      history: [],
      historyIndex: -1,
      isHistoryInitialized: false,

      initHistory: () => {
        const { nodes, edges, isHistoryInitialized } = get();
        if (isHistoryInitialized) return;
        set({
          history: [{ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }],
          historyIndex: 0,
          isHistoryInitialized: true,
        });
      },

      pushHistory: () => {
        const { nodes, edges, history, historyIndex } = get();
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) });

        if (newHistory.length > MAX_HISTORY) {
          newHistory.shift();
        }

        set({
          history: newHistory,
          historyIndex: newHistory.length - 1,
        });
      },

      undo: () => {
        const { history, historyIndex, nodes, edges } = get();
        if (historyIndex <= 0) return;

        const currentHistory = [...history];
        currentHistory[historyIndex] = { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) };

        const prevState = currentHistory[historyIndex - 1];
        set({
          history: currentHistory,
          nodes: JSON.parse(JSON.stringify(prevState.nodes)),
          edges: JSON.parse(JSON.stringify(prevState.edges)),
          historyIndex: historyIndex - 1,
        });
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex >= history.length - 1) return;

        const nextState = history[historyIndex + 1];
        set({
          nodes: JSON.parse(JSON.stringify(nextState.nodes)),
          edges: JSON.parse(JSON.stringify(nextState.edges)),
          historyIndex: historyIndex + 1,
        });
      },

      canUndo: () => get().historyIndex > 0,
      canRedo: () => get().historyIndex < get().history.length - 1,

      onNodesChange: (changes) => {
        const hasSignificantChange = changes.some(
          (c) => c.type === "remove" || c.type === "add"
        );

        set({
          nodes: applyNodeChanges(changes, get().nodes) as ArchitectureNode[],
        });

        if (hasSignificantChange) {
          get().pushHistory();
        }
      },

      onEdgesChange: (changes) => {
        const hasSignificantChange = changes.some(
          (c) => c.type === "remove" || c.type === "add"
        );

        set({
          edges: applyEdgeChanges(changes, get().edges),
        });

        if (hasSignificantChange) {
          get().pushHistory();
        }
      },

      onConnect: (connection: Connection) => {
        const { edges } = get();

        if (!connection.source || !connection.target) return;
        if (connection.source === connection.target) return;

        // Remove the restriction that prevents multiple connections between the same nodes
        // React Flow's addEdge will handle duplicate edges (same source, target, and handles)

        set({
          edges: addEdge(connection, edges),
        });
        get().pushHistory();
      },

      addNode: (node: ArchitectureNode) => {
        set({
          nodes: [...get().nodes, node],
        });
        get().pushHistory();
      },

      deleteNode: (id: string) => {
        set({
          nodes: get().nodes.filter((node) => node.id !== id),
          edges: get().edges.filter(
            (edge) => edge.source !== id && edge.target !== id
          ),
        });
        get().pushHistory();
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
          history: [{ nodes: [], edges: [] }],
          historyIndex: 0,
          isHistoryInitialized: true,
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
