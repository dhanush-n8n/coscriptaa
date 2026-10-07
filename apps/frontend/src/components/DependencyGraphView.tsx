import React, { useState } from 'react';
import { 
    Network, 
    FileCode2, 
    Layers, 
    Variable, 
    ArrowRight, 
    ShieldAlert, 
    CheckCircle2, 
    Sparkles,
    Filter,
    Activity
} from 'lucide-react';
import { CodebaseDependencyGraph, DependencyNode, DependencyEdge, IndirectConflict } from '../types/dependency';

interface DependencyGraphViewProps {
    graph: CodebaseDependencyGraph | null;
    conflicts: IndirectConflict[];
    onSelectConflict?: (conflict: IndirectConflict) => void;
}

export const DependencyGraphView: React.FC<DependencyGraphViewProps> = ({
    graph,
    conflicts,
    onSelectConflict,
}) => {
    const [selectedType, setSelectedType] = useState<'all' | 'module' | 'function' | 'variable'>('all');
    const [selectedNode, setSelectedNode] = useState<DependencyNode | null>(null);

    if (!graph || graph.nodes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-slate-800 bg-slate-900/40 text-center">
                <Network className="w-10 h-10 text-slate-600 mb-2 animate-pulse" />
                <p className="text-sm font-bold text-slate-300">No Dependency Graph Data Yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Run Dependency Analysis or simulate concurrent cross-module edits to build the codebase relationship graph.
                </p>
            </div>
        );
    }

    const filteredNodes = selectedType === 'all' 
        ? graph.nodes 
        : graph.nodes.filter(n => n.type === selectedType);

    // Identify nodes that participate in indirect conflicts
    const conflictedSymbols = new Set(conflicts.map(c => c.targetSymbol.replace('()', '')));

    return (
        <div className="space-y-4">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/60 text-xs">
                <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5" /> Filter Elements:
                    </span>
                    {(['all', 'module', 'function', 'variable'] as const).map(type => (
                        <button
                            key={type}
                            onClick={() => setSelectedType(type)}
                            className={`px-2.5 py-1 rounded-lg font-medium capitalize transition-colors ${
                                selectedType === type 
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                                    : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                        >
                            {type} ({type === 'all' ? graph.nodes.length : graph.nodes.filter(n => n.type === type).length})
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        {graph.totalRelationships} Relationships
                    </span>
                    {conflicts.length > 0 && (
                        <span className="flex items-center gap-1 text-red-400 font-bold">
                            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                            {conflicts.length} Indirect Conflict(s)
                        </span>
                    )}
                </div>
            </div>

            {/* Nodes Grid & Relationship Explorer */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Node List */}
                <div className="lg:col-span-2 space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {filteredNodes.map(node => {
                        const isConflicted = conflictedSymbols.has(node.name);
                        const isSelected = selectedNode?.id === node.id;

                        const icon = node.type === 'module' ? <FileCode2 className="w-4 h-4 text-emerald-400" />
                                   : node.type === 'function' ? <Layers className="w-4 h-4 text-cyan-400" />
                                   : <Variable className="w-4 h-4 text-amber-400" />;

                        return (
                            <div
                                key={node.id}
                                onClick={() => setSelectedNode(node)}
                                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                    isSelected
                                        ? 'border-cyan-400 bg-cyan-950/40 shadow-md ring-1 ring-cyan-400/30'
                                        : isConflicted
                                            ? 'border-red-500/50 bg-red-950/20 hover:border-red-400'
                                            : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-700'
                                }`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-2 rounded-lg bg-slate-800 shrink-0">
                                        {icon}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-bold text-white truncate">
                                                {node.name}{node.type === 'function' ? '()' : ''}
                                            </span>
                                            {isConflicted && (
                                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                                                    Indirect Conflict
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                                            <span>{node.file}</span>
                                            <span>• line {node.line}</span>
                                            {node.exportStatus && <span className="text-emerald-400">exported</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono shrink-0">
                                    <span className="px-2 py-0.5 rounded bg-slate-800" title="Dependencies">
                                        deps: {node.dependenciesCount}
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-slate-800" title="Dependents (Callers)">
                                        calls: {node.dependentsCount}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Node Details & Connected Edges Sidebar */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between">
                    <div>
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-cyan-400" />
                            Relationship Inspector
                        </h4>

                        {selectedNode ? (
                            <div className="space-y-3">
                                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Symbol</span>
                                    <span className="text-xs font-mono font-bold text-cyan-300">{selectedNode.name}</span>
                                    <span className="text-[10px] text-slate-400 block mt-1 font-mono">{selectedNode.file}:{selectedNode.line}</span>
                                </div>

                                {/* Connected edges */}
                                <div>
                                    <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">Connected Relationships:</span>
                                    <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                                        {graph.edges
                                            .filter(e => e.from === selectedNode.id || e.to === selectedNode.id)
                                            .map((edge, idx) => (
                                                <div key={idx} className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[10px] font-mono">
                                                    <div className="flex items-center justify-between text-slate-400 mb-0.5">
                                                        <span className="text-cyan-400 uppercase font-bold">{edge.type}</span>
                                                        <span>{edge.from === selectedNode.id ? 'Outbound' : 'Inbound'}</span>
                                                    </div>
                                                    <div className="text-slate-300 truncate">
                                                        {edge.from === selectedNode.id ? `-> ${edge.to}` : `<- ${edge.from}`}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500">
                                Select a component or function on the left to inspect its dependency edges and indirect callers.
                            </p>
                        )}
                    </div>

                    {/* Quick Conflict Action */}
                    {conflicts.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-800">
                            <button
                                onClick={() => onSelectConflict && onSelectConflict(conflicts[0])}
                                className="w-full py-2 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <ShieldAlert className="w-3.5 h-3.5" />
                                View Indirect Conflict AI Solutions
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
