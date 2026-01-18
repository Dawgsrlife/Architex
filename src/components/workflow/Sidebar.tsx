'use client';

import React from 'react';
import { Layout, Server, Database, Globe, Box } from 'lucide-react';

export const Sidebar = () => {
    const onDragStart = (event: React.DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <aside className="w-64 bg-card border-r border-border p-4 flex flex-col gap-4 h-full">
            <div className="flex items-center gap-2 mb-4">
                <Box className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-lg">Components</h2>
            </div>

            <div className="space-y-4">
                <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Frontend</h3>
                    <div
                        className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 cursor-grab hover:bg-muted/80 hover:border-primary/50 transition-all active:cursor-grabbing"
                        onDragStart={(event) => onDragStart(event, 'frontend')}
                        draggable
                    >
                        <Layout className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium">Next.js App</span>
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Backend</h3>
                    <div
                        className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 cursor-grab hover:bg-muted/80 hover:border-primary/50 transition-all active:cursor-grabbing"
                        onDragStart={(event) => onDragStart(event, 'backend')}
                        draggable
                    >
                        <Server className="w-4 h-4 text-purple-500" />
                        <span className="text-sm font-medium">FastAPI Service</span>
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Database</h3>
                    <div
                        className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 cursor-grab hover:bg-muted/80 hover:border-primary/50 transition-all active:cursor-grabbing"
                        onDragStart={(event) => onDragStart(event, 'database')}
                        draggable
                    >
                        <Database className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-medium">PostgreSQL</span>
                    </div>
                </div>
            </div>

            <div className="mt-auto p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs text-blue-500 leading-relaxed">
                    Drag components onto the canvas to build your architecture. Connect them to define data flow.
                </p>
            </div>
        </aside>
    );
};
