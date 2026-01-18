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

// Critic result from backend
export interface CriticIssue {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  suggestion?: string;
  node_id?: string;
}

export interface CriticResult {
  passed: boolean;
  blocking: boolean;
  issues: CriticIssue[];
  summary: string;
}

export interface ArchitectureStore {
  nodes: ArchitectureNode[];
  edges: Edge[];
  projectName: string;
  projectId: string | null;
  prompt: string; // User's intent/description for what they want to build
  
  // Critic state
  criticResult: CriticResult | null;
  isCriticLoading: boolean;
  
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
  setPrompt: (prompt: string) => void;
  setCriticResult: (result: CriticResult | null) => void;
  setIsCriticLoading: (loading: boolean) => void;
  runCritic: () => Promise<void>;
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
      prompt: "",
      criticResult: null,
      isCriticLoading: false,
      history: [],
      historyIndex: -1,
      isHistoryInitialized: false,

      setPrompt: (prompt: string) => {
        set({ prompt, criticResult: null }); // Clear critic when prompt changes
      },

      setCriticResult: (result: CriticResult | null) => {
        set({ criticResult: result });
      },

      setIsCriticLoading: (loading: boolean) => {
        set({ isCriticLoading: loading });
      },

      runCritic: async () => {
        const { nodes, edges, prompt } = get();
        
        // Don't run if no nodes
        if (nodes.length === 0) {
          set({ 
            criticResult: { 
              passed: false, 
              blocking: true, 
              issues: [{ severity: "error", code: "NO_NODES", message: "Add components to your architecture", suggestion: "Drag components from the library onto the canvas" }],
              summary: "Empty architecture"
            }
          });
          return;
        }

        set({ isCriticLoading: true });

        try {
          // Build architecture spec from canvas state
          const architectureSpec = {
            name: get().projectName,
            description: prompt || "No description provided",
            nodes: nodes.map(n => ({
              id: n.id,
              type: n.type,
              data: n.data
            })),
            edges: edges.map(e => ({
              id: e.id,
              source: e.source,
              target: e.target
            })),
            metadata: {
              intent: prompt
            }
          };

          const response = await fetch("http://localhost:8000/api/architecture/critique/quick", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              architecture_spec: architectureSpec,
              intent: prompt 
            })
          });

          if (!response.ok) {
            throw new Error("Failed to run critic");
          }

          const result = await response.json();
          set({ criticResult: result });
        } catch (error) {
          console.error("Critic error:", error);
          set({ 
            criticResult: {
              passed: false,
              blocking: false,
              issues: [{ severity: "warning", code: "CRITIC_ERROR", message: "Could not validate architecture", suggestion: "Backend may be offline" }],
              summary: "Validation unavailable"
            }
          });
        } finally {
          set({ isCriticLoading: false });
        }
      },

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
          prompt: "",
          criticResult: null,
          isCriticLoading: false,
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
        prompt: state.prompt,
      }),
    }
  )
);
