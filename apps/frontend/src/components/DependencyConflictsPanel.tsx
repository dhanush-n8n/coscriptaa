import React, { useState } from 'react';
import { 
    Network, 
    ShieldAlert, 
    Sparkles, 
    RefreshCw, 
    ArrowRight, 
    Layers, 
    Variable, 
    FileCode2, 
    Bot, 
    CheckCircle2,
    Check,
    Split,
    Combine,
    GitMerge
} from 'lucide-react';
import { CodebaseDependencyGraph, IndirectConflict } from '../types/dependency';
import { AIContextCard } from './AIContextCard';
import { DependencyGraphView } from './DependencyGraphView';
import { AISolutionsModal } from './AISolutionsModal';

interface DependencyConflictsPanelProps {
    graph: CodebaseDependencyGraph | null;
    conflicts: IndirectConflict[];
    isAnalyzing: boolean;
    onRunAnalysis: () => void;
    onSimulateScenario: () => void;
    onApplySolution: (conflictId: string, solutionId: number, codePatch: string, affectedFile: string) => void;
}

export const DependencyConflictsPanel: React.FC<DependencyConflictsPanelProps> = ({
    graph,
    conflicts,
    isAnalyzing,
    onRunAnalysis,
    onSimulateScenario,
    onApplySolution,
}) => {
    const [activeSubTab, setActiveSubTab] = useState<'conflicts' | 'graph'>('conflicts');
    const [selectedConflictForSolutions, setSelectedConflictForSolutions] = useState<IndirectConflict | null>(null);

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* Header Banner */}
            <div className="rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-950/40 via-slate-900/90 to-slate-950 p-4 shadow-xl backdrop-blur-xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/30">
                            <Network className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                                Feature 5 • Pipeline Stages 4 & 5
                            </span>
                            <h3 className="text-sm font-extrabold text-white">
                                Dependency-Aware Conflict Analysis & 3 AI Solutions
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Analyzes relationships between functions, variables, and modules to detect indirect conflicts.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onSimulateScenario}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 transition-all"
                            title="Simulate Screenshot 4 & 5 Scenario"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                            Simulate Screenshot (Calculate & ProcessOrder)
                        </button>

                        <button
                            onClick={onRunAnalysis}
                            disabled={isAnalyzing}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                            {isAnalyzing ? "Analyzing Graph..." : "Scan Dependencies"}
                        </button>
                    </div>
                </div>

                {/* Stat Counters */}
                {graph && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs font-mono">
                        <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                            <span className="text-slate-500 text-[10px] block">Modules</span>
                            <span className="text-emerald-400 font-bold">{graph.modulesCount}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                            <span className="text-slate-500 text-[10px] block">Functions</span>
                            <span className="text-cyan-400 font-bold">{graph.functionsCount}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                            <span className="text-slate-500 text-[10px] block">Variables</span>
                            <span className="text-amber-400 font-bold">{graph.variablesCount}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                            <span className="text-slate-500 text-[10px] block">Relationships</span>
                            <span className="text-purple-400 font-bold">{graph.totalRelationships}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                            <span className="text-slate-500 text-[10px] block">Indirect Conflicts</span>
                            <span className={`font-bold ${conflicts.length > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                {conflicts.length}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <button
                    onClick={() => setActiveSubTab('conflicts')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeSubTab === 'conflicts'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'text-slate-400 hover:text-white'
                    }`}
                >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Indirect Conflicts & AI Context ({conflicts.length})
                </button>

                <button
                    onClick={() => setActiveSubTab('graph')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeSubTab === 'graph'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'text-slate-400 hover:text-white'
                    }`}
                >
                    <Network className="w-3.5 h-3.5" />
                    Dependency Graph Explorer
                </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {activeSubTab === 'graph' ? (
                    <DependencyGraphView 
                        graph={graph} 
                        conflicts={conflicts} 
                        onSelectConflict={(c) => setSelectedConflictForSolutions(c)}
                    />
                ) : (
                    <>
                        {conflicts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-slate-800 bg-slate-900/40 text-center">
                                <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-2" />
                                <h4 className="text-sm font-bold text-white">No Indirect Conflicts Detected</h4>
                                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                                    All function calls, imports, and variables across modules comply with current signatures and behaviors.
                                </p>
                                <button
                                    onClick={onSimulateScenario}
                                    className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 transition-colors"
                                >
                                    Simulate Multi-Developer Indirect Conflict
                                </button>
                            </div>
                        ) : (
                            conflicts.map(conflict => (
                                <div 
                                    key={conflict.id}
                                    className="rounded-2xl border border-red-500/30 bg-slate-950/80 p-4 space-y-4 shadow-xl"
                                >
                                    {/* Conflict Summary Header */}
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="p-1.5 rounded-lg bg-red-500/20 text-red-400">
                                                <ShieldAlert className="w-4 h-4" />
                                            </span>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-mono">
                                                        {conflict.conflictType}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-slate-400">
                                                        Target: {conflict.targetFile}:{conflict.targetLine}
                                                    </span>
                                                </div>
                                                <h4 className="text-sm font-black text-white mt-0.5">
                                                    {conflict.title}
                                                </h4>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setSelectedConflictForSolutions(conflict)}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/20 transition-all transform active:scale-95"
                                        >
                                            <Sparkles className="w-4 h-4 text-slate-950" />
                                            View 3 AI Candidate Solutions
                                        </button>
                                    </div>

                                    <p className="text-xs text-slate-300 leading-relaxed">
                                        {conflict.description}
                                    </p>

                                    {/* Dependency Chain Path */}
                                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                                            Dependency Call Path:
                                        </span>
                                        <div className="flex items-center gap-2 font-mono text-slate-200 text-[11px] overflow-x-auto">
                                            {conflict.dependencyPath.map((step, idx) => (
                                                <React.Fragment key={idx}>
                                                    <span className={`px-2 py-0.5 rounded ${idx % 2 === 0 ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30' : 'text-slate-400'}`}>
                                                        {step}
                                                    </span>
                                                    {idx < conflict.dependencyPath.length - 1 && (
                                                        <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Embedded Section 4: AI Understands the Context */}
                                    <AIContextCard conflict={conflict} />

                                    {/* Quick Preview of the 3 Solutions (Section 5) */}
                                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 space-y-2">
                                        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                                            <span className="flex items-center gap-1.5">
                                                <Bot className="w-4 h-4 text-cyan-400" />
                                                5. AI Resolution Candidates (Screenshot Section 5):
                                            </span>
                                            <span className="text-[11px] text-cyan-400 font-mono">
                                                3 Alternatives Ready
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                                            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                                                <span className="text-[10px] font-bold text-slate-400 block">Solution 1</span>
                                                <span className="font-semibold text-slate-200 text-[11px]">Keep Developer A's implementation</span>
                                            </div>
                                            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-cyan-500/30 bg-cyan-950/20">
                                                <span className="text-[10px] font-bold text-cyan-400 block">Solution 2 (Recommended)</span>
                                                <span className="font-semibold text-cyan-200 text-[11px]">Combine both changes</span>
                                            </div>
                                            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
                                                <span className="text-[10px] font-bold text-slate-400 block">Solution 3</span>
                                                <span className="font-semibold text-slate-200 text-[11px]">Create separate functions for the two behaviours</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </>
                )}
            </div>

            {/* AISolutionsModal */}
            <AISolutionsModal
                isOpen={Boolean(selectedConflictForSolutions)}
                onClose={() => setSelectedConflictForSolutions(null)}
                conflict={selectedConflictForSolutions}
                onApplySolution={(cId, sId, patch, file) => {
                    onApplySolution(cId, sId, patch, file);
                    setSelectedConflictForSolutions(null);
                }}
            />
        </div>
    );
};
