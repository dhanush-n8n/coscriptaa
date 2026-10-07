import React, { useState } from 'react';
import { 
    File, 
    FileCode, 
    FilePlus, 
    Trash2, 
    FolderGit2, 
    CheckCircle2, 
    X,
    FileText
} from 'lucide-react';
import type { CodebaseFile } from '../types/CodebaseExplorer';
import type { CollaboratorPresence } from '../types/CodebaseExplorer';

interface CodebaseExplorerProps {
    files: CodebaseFile[];
    activeFileId: string;
    onSelectFile: (fileId: string) => void;
    onCreateFile: (fileName: string) => void;
    onDeleteFile: (fileId: string) => void;
    collaborators: CollaboratorPresence[];
    crdtSynced: boolean;
    connectedPeersCount: number;
    conflictedFileNames?: string[];
}

export const CodebaseExplorer: React.FC<CodebaseExplorerProps> = ({
    files,
    activeFileId,
    onSelectFile,
    onCreateFile,
    onDeleteFile,
    collaborators,
    crdtSynced,
    connectedPeersCount,
    conflictedFileNames = [],
}) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newFileName, setNewFileName] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newFileName.trim();
        if (!trimmed) {
            setIsCreating(false);
            return;
        }

        // Validate unique filename
        if (files.some(f => f.name.toLowerCase() === trimmed.toLowerCase())) {
            setErrorMsg('A file with this name already exists.');
            return;
        }

        onCreateFile(trimmed);
        setNewFileName('');
        setIsCreating(false);
        setErrorMsg('');
    };

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'js':
            case 'jsx':
                return <span className="font-mono text-[11px] font-bold text-amber-400 bg-amber-400/10 px-1 py-0.5 rounded">JS</span>;
            case 'ts':
            case 'tsx':
                return <span className="font-mono text-[11px] font-bold text-blue-400 bg-blue-400/10 px-1 py-0.5 rounded">TS</span>;
            case 'py':
                return <span className="font-mono text-[11px] font-bold text-emerald-400 bg-emerald-400/10 px-1 py-0.5 rounded">PY</span>;
            case 'cpp':
            case 'c':
            case 'h':
                return <span className="font-mono text-[11px] font-bold text-sky-400 bg-sky-400/10 px-1 py-0.5 rounded">C++</span>;
            case 'go':
                return <span className="font-mono text-[11px] font-bold text-cyan-400 bg-cyan-400/10 px-1 py-0.5 rounded">GO</span>;
            case 'json':
                return <span className="font-mono text-[11px] font-bold text-orange-400 bg-orange-400/10 px-1 py-0.5 rounded">{ }</span>;
            case 'md':
                return <FileText className="w-3.5 h-3.5 text-purple-400" />;
            default:
                return <FileCode className="w-3.5 h-3.5 text-slate-400" />;
        }
    };

    return (
        <aside aria-label="Codebase Explorer" className="flex flex-col h-full w-64 bg-[#0b1220]/90 border-r border-white/[.08] backdrop-blur-md select-none shrink-0">
            {/* Header */}
            <div className="flex items-center justify-between px-3.5 py-3 border-b border-white/[.07]">
                <div className="flex items-center gap-2">
                    <FolderGit2 className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                        Codebase ({files.length})
                    </span>
                </div>
                <button
                    onClick={() => {
                        setIsCreating(true);
                        setErrorMsg('');
                    }}
                    title="Create New File"
                    className="p-1 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
                >
                    <FilePlus className="w-4 h-4" />
                </button>
            </div>

            {/* Inline New File Form */}
            {isCreating && (
                <form onSubmit={handleCreateSubmit} className="p-2.5 bg-cyan-950/20 border-b border-cyan-500/20">
                    <div className="flex items-center gap-1.5 bg-[#0e172a] border border-cyan-500/40 rounded-lg px-2 py-1.5 focus-within:ring-1 focus-within:ring-cyan-400">
                        <File className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <input
                            type="text"
                            value={newFileName}
                            onChange={(e) => {
                                setNewFileName(e.target.value);
                                if (errorMsg) setErrorMsg('');
                            }}
                            placeholder="filename.js / .py"
                            className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={() => {
                                setIsCreating(false);
                                setNewFileName('');
                                setErrorMsg('');
                            }}
                            className="text-slate-400 hover:text-white"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                    {errorMsg && (
                        <p className="text-[10px] text-rose-400 mt-1 pl-1">{errorMsg}</p>
                    )}
                    <div className="text-[10px] text-slate-500 mt-1 pl-1">
                        Press Enter to confirm
                    </div>
                </form>
            )}

            {/* File List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {files.map((file) => {
                    const isActive = file.id === activeFileId;
                    // Find collaborators currently on this file
                    const fileCollaborators = collaborators.filter(
                        c => c.currentFileId === file.id
                    );

                    return (
                        <div
                            key={file.id}
                            onClick={() => onSelectFile(file.id)}
                            className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all ${
                                isActive
                                    ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-500/30 shadow-sm font-semibold'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[.04]'
                            }`}
                        >
                            <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                                <div className="shrink-0 flex items-center justify-center">
                                    {getFileIcon(file.name)}
                                </div>
                                <span className="truncate text-xs font-mono">{file.name}</span>
                                {conflictedFileNames.includes(file.name) && (
                                    <span title="Semantic conflict detected in this file" className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 animate-ping" />
                                )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                                {/* Collaborator presence avatars on this file */}
                                {fileCollaborators.length > 0 && (
                                    <div className="flex items-center -space-x-1">
                                        {fileCollaborators.slice(0, 3).map((c, i) => (
                                            <span
                                                key={c.id || i}
                                                title={`${c.name} is editing ${file.name}`}
                                                className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-slate-950 border border-[#0b1220] shadow-sm animate-pulse"
                                                style={{ backgroundColor: c.color || '#38bdf8' }}
                                            >
                                                {(c.name || 'U').charAt(0).toUpperCase()}
                                            </span>
                                        ))}
                                        {fileCollaborators.length > 3 && (
                                            <span className="text-[9px] text-slate-400 pl-1 font-mono">
                                                +{fileCollaborators.length - 3}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Delete file button (prevent deleting if only 1 file exists) */}
                                {files.length > 1 && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm(`Delete ${file.name} from codebase?`)) {
                                                onDeleteFile(file.id);
                                            }
                                        }}
                                        title={`Delete ${file.name}`}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* CRDT Synchronization Status Footer */}
            <div className="p-3 border-t border-white/[.07] bg-[#070c17]/60 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 font-bold text-slate-300">
                        <span className={`w-2 h-2 rounded-full ${crdtSynced ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                        <span>{crdtSynced ? 'CRDT Active' : 'Connecting CRDT...'}</span>
                    </div>
                    <span className="text-[10px] text-cyan-400 font-mono font-medium">
                        {connectedPeersCount} {connectedPeersCount === 1 ? 'Peer' : 'Peers'}
                    </span>
                </div>

                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>Conflict-Free Replicated Data</span>
                </div>
            </div>
        </aside>
    );
};
