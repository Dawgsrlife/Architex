'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    BackgroundVariant,
    Panel,
    useReactFlow,
    ReactFlowProvider,
    NodeChange,
    EdgeChange,
    applyNodeChanges,
    applyEdgeChanges
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { FrontendNode, BackendNode, DatabaseNode } from './CustomNodes';
import { useSocket } from '@/hooks/useSocket';
import { ReviewModal } from './ReviewModal';
import { Loader2, Play, Plus, Save } from 'lucide-react';
import { toast } from 'sonner';
import { api, API_URL, AuthRequiredError } from '@/lib/api';
import { ensureProjectExists } from '@/lib/project';

const nodeTypes = {
    frontend: FrontendNode,
    backend: BackendNode,
    database: DatabaseNode,
};

const INITIAL_NODES: Node[] = [
    {
        id: '1',
        type: 'frontend',
        position: { x: 100, y: 100 },
        data: { label: 'Next.js App', framework: 'Next.js 14' },
    },
    {
        id: '2',
        type: 'backend',
        position: { x: 400, y: 100 },
        data: { label: 'API Gateway', framework: 'FastAPI' },
    },
];

const INITIAL_EDGES = [
    { id: 'e1-2', source: '1', target: '2', animated: true },
];

let id = 3;
const getId = () => `${id++}`;

function Flow() {
    const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
    const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
    const [isGenerating, setIsGenerating] = useState(false);
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { screenToFlowPosition } = useReactFlow();

    // Socket connection to backend
    // Use API_URL for socket connection
    const { socket, isConnected, lastMessage } = useSocket(API_URL);

    const [showReview, setShowReview] = useState(false);
    const [reviewData, setReviewData] = useState<any>(null);
    const [currentJobId, setCurrentJobId] = useState<string | null>(null);
    const [isApproving, setIsApproving] = useState(false);

    useEffect(() => {
        if (lastMessage) {
            console.log("Received via socket:", lastMessage);
            // Handle streaming updates here (e.g. log output)
            if (lastMessage.type === 'log') {
                toast(lastMessage.message);
                // Check for review signal
                if (lastMessage.message === 'REVIEW_REQUIRED' && lastMessage.job_id) {
                    console.log("Review required for job:", lastMessage.job_id);
                    setCurrentJobId(lastMessage.job_id);
                    // Fetch job details using api client
                    api.get<{ result?: unknown; generation_result?: unknown }>(`/api/jobs/${lastMessage.job_id}`)
                        .then(({ data, error }) => {
                            if (error) {
                                console.error("Failed to fetch job details for review:", error);
                                toast.error("Failed to load review data.");
                                return;
                            }
                            if (data?.result || data?.generation_result) {
                                setReviewData(data.generation_result || data.result);
                                setShowReview(true);
                            }
                        })
                        .catch(error => {
                            console.error("Failed to fetch job details for review:", error);
                            toast.error("Failed to load review data.");
                        });
                }
            }
        }
    }, [lastMessage]);

    // Removed duplicate onNodesChange definitions

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
        [setEdges],
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');

            // check if the dropped element is valid
            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode: Node = {
                id: getId(),
                type,
                position,
                data: {
                    label: `${type} node`,
                    framework: type === 'frontend' ? 'Next.js' : type === 'backend' ? 'FastAPI' : 'PostgreSQL'
                },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [screenToFlowPosition, setNodes],
    );

    const handleApprove = async () => {
        if (!currentJobId) return;
        setIsApproving(true);
        try {
            const { error } = await api.post(`/api/jobs/${currentJobId}/approve`);
            if (error) throw new Error(error);
            toast.success("Design approved! Building project...");
            setShowReview(false);
        } catch (error) {
            if (error instanceof AuthRequiredError) {
                toast.error("Please log in to approve jobs.");
            } else {
                toast.error("Failed to approve job");
            }
            console.error(error);
        } finally {
            setIsApproving(false);
        }
    };

    const handleReject = () => {
        setShowReview(false);
        toast.info("Job execution cancelled.");
    };

    // Track projectId locally (would ideally come from architecture-store)
    const [projectId, setProjectId] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsGenerating(true);
        toast.info("Starting architecture generation...");

        try {
            // INVARIANT: A job cannot be created unless a projectId exists
            const validProjectId = await ensureProjectExists(projectId, 'Canvas Project');

            // Persist the projectId for future job submissions
            if (!projectId) {
                setProjectId(validProjectId);
                toast.info("Project created for this session");
            }

            const flow = {
                nodes,
                edges,
                viewport: { x: 0, y: 0, zoom: 1 }
            };

            const payload = {
                name: "New Architecture",
                description: "Generated via Visual Editor",
                nodes: nodes,
                edges: edges,
                metadata: {
                    flow_data: flow
                },
                components: nodes.map((n: Node) => (n.data as { label: string }).label),
                frameworks: nodes.map((n: Node) => (n.data as { framework?: string }).framework).filter((f: string | undefined): f is string => !!f)
            };

            // projectId is now GUARANTEED to be non-null
            const { data, error } = await api.post<{ job_id: string }>('/api/jobs', {
                architecture_spec: payload,
                project_id: validProjectId
            });

            if (error || !data) {
                throw new Error(error || 'Failed to start job');
            }

            toast.success(`Job started: ${data.job_id}`);

        } catch (error) {
            if (error instanceof AuthRequiredError) {
                toast.error("Please log in to generate code.");
            } else {
                toast.error("Failed to generate architecture");
            }
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="w-full h-full" ref={reactFlowWrapper}>
            <ReviewModal
                open={showReview}
                onOpenChange={setShowReview}
                fileTree={reviewData}
                onApprove={handleApprove}
                onReject={handleReject}
                isApproving={isApproving}
            />
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                nodeTypes={nodeTypes}
                fitView
                className="bg-background/95"
            >
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                <Controls />
                <MiniMap className='!bg-muted' />

                <Panel position="top-right" className="flex gap-2">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${isConnected ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
                        {isConnected ? 'Connected' : 'Connecting...'}
                    </div>
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-primary/25"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Play className="mr-2 h-4 w-4 fill-current" />
                                Generate Code
                            </>
                        )}
                    </Button>
                </Panel>
            </ReactFlow>
        </div>
    );
}

export default function Editor() {
    return (
        <ReactFlowProvider>
            <Flow />
        </ReactFlowProvider>
    );
}
