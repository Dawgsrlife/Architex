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
  isPublic: boolean;
  githubUrl: string | null;
  deploymentUrl: string | null;
  
  history: HistoryState[];
  historyIndex: number;
  maxHistory: number;

  onNodesChange: OnNodesChange<ArchitectureNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (node: ArchitectureNode) => void;
  deleteNode: (id: string) => void;
  setNodes: (nodes: ArchitectureNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  setProjectName: (name: string) => void;
    setProjectId: (id: string | null) => void;
    setIsPublic: (isPublic: boolean) => void;
    setGithubUrl: (url: string | null) => void;
    setDeploymentUrl: (url: string | null) => void;
    clearCanvas: () => void;
  
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  pushHistory: () => void;
}

export const useArchitectureStore = create<ArchitectureStore>()(
  persist(
    (set, get) => ({
        nodes: [],
        edges: [],
        projectName: "Untitled Project",
        projectId: null,
        isPublic: false,
        githubUrl: null,
        deploymentUrl: null,
        
        history: [],
      historyIndex: -1,
      maxHistory: 50,

      pushHistory: () => {
        const { nodes, edges, history, historyIndex, maxHistory } = get();
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push({ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) });
        
        if (newHistory.length > maxHistory) {
          newHistory.shift();
        }
        
        set({
          history: newHistory,
          historyIndex: newHistory.length - 1,
        });
      },

      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
          const prevState = history[historyIndex - 1];
          set({
            nodes: prevState.nodes,
            edges: prevState.edges,
            historyIndex: historyIndex - 1,
          });
        }
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
          const nextState = history[historyIndex + 1];
          set({
            nodes: nextState.nodes,
            edges: nextState.edges,
            historyIndex: historyIndex + 1,
          });
        }
      },

      canUndo: () => {
        const { historyIndex } = get();
        return historyIndex > 0;
      },

      canRedo: () => {
        const { history, historyIndex } = get();
        return historyIndex < history.length - 1;
      },

      onNodesChange: (changes) => {
        const prevNodes = get().nodes;
        const newNodes = applyNodeChanges(changes, prevNodes) as ArchitectureNode[];
        
        const hasSignificantChange = changes.some(
          (c) => c.type === 'remove' || c.type === 'add'
        );
        
        set({ nodes: newNodes });
        
        if (hasSignificantChange) {
          get().pushHistory();
        }
      },

      onEdgesChange: (changes) => {
        const prevEdges = get().edges;
        const newEdges = applyEdgeChanges(changes, prevEdges);
        
        const hasSignificantChange = changes.some(
          (c) => c.type === 'remove' || c.type === 'add'
        );
        
        set({ edges: newEdges });
        
        if (hasSignificantChange) {
          get().pushHistory();
        }
      },

      onConnect: (connection: Connection) => {
        const { edges, pushHistory } = get();

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
        pushHistory();
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

      setIsPublic: (isPublic: boolean) => {
        set({ isPublic });
      },

      setGithubUrl: (url: string | null) => {
        set({ githubUrl: url });
      },

      setDeploymentUrl: (url: string | null) => {
        set({ deploymentUrl: url });
      },

      clearCanvas: () => {
        set({
          nodes: [],
          edges: [],
          projectName: "Untitled Project",
          projectId: null,
          isPublic: false,
          githubUrl: null,
          deploymentUrl: null,
          history: [{ nodes: [], edges: [] }],
          historyIndex: 0,
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
