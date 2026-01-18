import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Database, Layout, Server, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper to get icon based on type
const getNodeIcon = (type: string) => {
    switch (type) {
        case 'frontend':
            return <Layout className="w-5 h-5" />;
        case 'backend':
            return <Server className="w-5 h-5" />;
        case 'database':
            return <Database className="w-5 h-5" />;
        default:
            return <Globe className="w-5 h-5" />;
    }
};

interface AppNodeData extends Record<string, unknown> {
    label: string;
    framework?: string;
}

const BaseNode = ({ data, selected, type }: NodeProps & { type: string }) => {
    const nodeData = data as AppNodeData;

    return (
        <div
            className={cn(
                "relative rounded-xl border bg-card/80 backdrop-blur-md px-4 py-3 shadow-sm transition-all duration-300 min-w-[180px]",
                selected ? "border-primary ring-2 ring-primary/20 shadow-lg scale-105" : "border-border hover:border-primary/50"
            )}
        >
            <div className="flex items-center gap-3 mb-2">
                <div className={cn(
                    "p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 text-primary",
                    type === 'frontend' && "from-blue-500/10 to-cyan-500/5 text-blue-500",
                    type === 'backend' && "from-purple-500/10 to-pink-500/5 text-purple-500",
                    type === 'database' && "from-emerald-500/10 to-green-500/5 text-emerald-500",
                )}>
                    {getNodeIcon(type)}
                </div>
                <div>
                    <h3 className="font-semibold text-sm leading-none">{nodeData.label}</h3>
                    <p className="text-[10px] text-muted-foreground mt-1 font-mono uppercase tracking-wider">
                        {type}
                    </p>
                </div>
            </div>

            {/* Metadata display */}
            <div className="space-y-1 mt-2">
                {nodeData.framework && (
                    <div className="flex items-center justify-between text-[10px] px-2 py-1 rounded bg-muted/50">
                        <span className="text-muted-foreground">Framework</span>
                        <span className="font-medium text-foreground">{nodeData.framework}</span>
                    </div>
                )}
            </div>

            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !-left-1.5 !bg-muted-foreground/30 !border-2 !border-background transition-colors hover:!bg-primary"
            />
            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !-right-1.5 !bg-muted-foreground/30 !border-2 !border-background transition-colors hover:!bg-primary"
            />
        </div>
    );
};

export const FrontendNode = memo((props: NodeProps) => <BaseNode {...props} type="frontend" />);
export const BackendNode = memo((props: NodeProps) => <BaseNode {...props} type="backend" />);
export const DatabaseNode = memo((props: NodeProps) => <BaseNode {...props} type="database" />);
