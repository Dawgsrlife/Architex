import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { File, Folder, Check, X, Loader2 } from "lucide-react";

interface ReviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fileTree: any;
    onApprove: () => void;
    onReject: () => void;
    isApproving: boolean;
}

const FileTreeItem = ({ name, content, depth = 0 }: { name: string; content: any; depth?: number }) => {
    const isFile = typeof content === 'string';

    return (
        <div style={{ marginLeft: depth * 16 }} className="py-1">
            <div className="flex items-center gap-2 text-sm">
                {isFile ? (
                    <File className="w-4 h-4 text-blue-500" />
                ) : (
                    <Folder className="w-4 h-4 text-yellow-500" />
                )}
                <span className={isFile ? "text-foreground" : "font-medium text-foreground/80"}>
                    {name}
                </span>
            </div>
            {!isFile && Object.entries(content).map(([key, value]) => (
                <FileTreeItem key={key} name={key} content={value} depth={depth + 1} />
            ))}
        </div>
    );
};

// Helper to convert flat path keys to nested object
const buildTree = (files: Record<string, string>) => {
    const root: any = {};
    Object.keys(files).forEach(path => {
        const parts = path.split('/');
        let current = root;
        parts.forEach((part, i) => {
            if (i === parts.length - 1) {
                current[part] = files[path]; // Leaf
            } else {
                current[part] = current[part] || {};
                current = current[part];
            }
        });
    });
    return root;
};

export function ReviewModal({ open, onOpenChange, fileTree, onApprove, onReject, isApproving }: ReviewModalProps) {
    const tree = fileTree?.files ? buildTree(fileTree.files) : {};

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Review Generated Architecture</DialogTitle>
                    <DialogDescription>
                        Review the proposed file structure before generating the code.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 border rounded-md p-4 bg-muted/20">
                    {Object.entries(tree).map(([key, value]) => (
                        <FileTreeItem key={key} name={key} content={value} />
                    ))}
                </ScrollArea>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onReject} disabled={isApproving} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <X className="w-4 h-4 mr-2" />
                        Reject
                    </Button>
                    <Button onClick={onApprove} disabled={isApproving} className="bg-green-600 hover:bg-green-700 text-white">
                        {isApproving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                        Approve & Build
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
