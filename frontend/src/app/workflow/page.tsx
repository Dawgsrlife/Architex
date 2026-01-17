"use client";

import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";

const initialNodes = [
  {
    id: "1",
    type: "input",
    data: { label: "Define Architecture Spec" },
    position: { x: 250, y: 25 },
  },
  {
    id: "2",
    data: { label: "AI Code Generation (Gemini)" },
    position: { x: 250, y: 125 },
  },
  {
    id: "3",
    data: { label: "GitHub Repository" },
    position: { x: 250, y: 225 },
  },
  {
    id: "4",
    type: "output",
    data: { label: "Deployed Code" },
    position: { x: 250, y: 325 },
  },
];

const initialEdges = [
  { id: "e1-2", source: "1", target: "2", animated: true },
  { id: "e2-3", source: "2", target: "3", animated: true },
  { id: "e3-4", source: "3", target: "4", animated: true },
];

export default function WorkflowPage() {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isGenerating, setIsGenerating] = useState(false);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const pollJobStatus = useCallback(async (jobId: string, token: string) => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/jobs/${jobId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch job status");
        }

        const data = await response.json();
        setJobStatus(data.status);

        if (data.status === "done" || data.status === "failed") {
          setIsGenerating(false);
          return true;
        }

        return false;
      } catch (error) {
        console.error("Error polling job status:", error);
        return false;
      }
    };

    // Poll every 3 seconds
    const interval = setInterval(async () => {
      const isDone = await checkStatus();
      if (isDone) {
        clearInterval(interval);
      }
    }, 3000);

    // Initial check
    await checkStatus();
  }, []);

  const handleGenerate = async () => {
    const token = localStorage.getItem("auth_token");

    if (!token) {
      router.push("/");
      return;
    }

    setIsGenerating(true);
    setJobStatus("pending");

    try {
      // Build architecture spec from workflow
      const architectureSpec = {
        name: "Generated Project",
        description: "Architecture generated from workflow diagram",
        components: nodes.map((node) => node.data.label as string),
        frameworks: ["React", "Next.js", "TailwindCSS"],
        metadata: {
          nodes: nodes.length,
          edges: edges.length,
        },
      };

      // Submit job
      const response = await fetch("http://localhost:8000/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          architecture_spec: architectureSpec,
          project_id: projectId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create job");
      }

      const data = await response.json();
      setCurrentJobId(data.job_id);

      // Start polling for job status
      await pollJobStatus(data.job_id, token);
    } catch (error) {
      console.error("Error generating architecture:", error);
      setIsGenerating(false);
      setJobStatus("failed");
    }
  };

  return (
    <div className="h-screen w-full">
      <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm p-4 rounded-lg border max-w-md">
        <h1 className="text-2xl font-bold mb-2">Workflow Builder</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Design your architecture workflow and generate code
        </p>

        <div className="space-y-2">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? "Generating..." : "Generate Architecture"}
          </Button>

          {jobStatus && (
            <div className="text-sm">
              <span className="font-semibold">Status: </span>
              <span
                className={`${
                  jobStatus === "done"
                    ? "text-green-600"
                    : jobStatus === "failed"
                    ? "text-red-600"
                    : jobStatus === "running"
                    ? "text-blue-600"
                    : "text-yellow-600"
                }`}
              >
                {jobStatus}
              </span>
            </div>
          )}

          {currentJobId && (
            <div className="text-xs text-muted-foreground">
              Job ID: {currentJobId}
            </div>
          )}

          <Button
            variant="outline"
            onClick={() => router.push("/projects")}
            className="w-full"
          >
            Back to Projects
          </Button>
        </div>
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
