import React from 'react';
import { PanelLeft, PanelLeftClose, Plus } from 'lucide-react';
import type { CodebaseFile } from '../types/CodebaseExplorer';
import type { CollaboratorPresence } from '../types/CodebaseExplorer';

interface FileTabsBarProps {
    files: CodebaseFile[];
    activeFileId: string;
    onSelectFile: (fileId: string) => void;
    collaborators: CollaboratorPresence[];
    isExplorerOpen: boolean;
    onToggleExplorer: () => void;
    onCreateFileClick: () => void;
}

export const FileTabsBar: React.FC<FileTabsBarProps> = ({
    files,
    activeFileId,
    onSelectFile,
    collaborators,
    isExplorerOpen,
    onToggleExplorer,
    onCreateFileClick,
}) => {
    return (
        <div className="flex items-center bg-[#0d1527] border-b border-white/[.08] px-2 h-10 select-none overflow-x-auto custom-scrollbar shrink-0">
            {/* Toggle Explorer Button */}
            <button
                onClick={onToggleExplorer}
                title={isExplorerOpen ? "Hide File Explorer" : "Show File Explorer"}
                className="p-1.5 mr-2 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/[.05] transition-colors shrink-0"
            >
                {isExplorerOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </button>

            {/* File Tabs */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto custom-scrollbar">
                {files.map((file) => {
                    const isActive = file.id === activeFileId;
                    const fileCollaborators = collaborators.filter(
                        c => c.currentFileId === file.id
                    );

                    return (
                        <button
                            key={file.id}
                            onClick={() => onSelectFile(file.id)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-mono transition-all border-t-2 shrink-0 ${
                                isActive
                                    ? 'bg-[#111a2b] border-cyan-400 text-cyan-200 font-semibold shadow-inner'
                                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[.03]'
                            }`}
                        >
                            <span>{file.name}</span>

                            {/* Collaborator Avatars */}
                            {fileCollaborators.length > 0 && (
                                <div className="flex items-center -space-x-1 ml-1">
                                    {fileCollaborators.map((c, i) => (
                                        <span
                                            key={c.id || i}
                                            title={`${c.name} is on this file`}
                                            className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-slate-950 border border-[#0d1527]"
                                            style={{ backgroundColor: c.color || '#38bdf8' }}
                                        >
                                            {(c.name || 'U').charAt(0).toUpperCase()}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </button>
                    );
                })}

                <button
                    onClick={onCreateFileClick}
                    title="Add new file"
                    className="p-1 rounded text-slate-500 hover:text-cyan-300 hover:bg-white/[.05] transition-colors shrink-0 ml-1"
                >
                    <Plus className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};
