import React, { useState } from 'react';
import { 
    Sparkles, 
    X, 
    Check, 
    Copy, 
    ArrowRight, 
    Bot, 
    Layers, 
    Wrench, 
    ShieldCheck, 
    Box, 
    GitMerge,
    Split,
    Combine,
    CheckCircle2
} from 'lucide-react';
import { IndirectConflict, AISolutionOption } from '../types/dependency';

interface AISolutionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    conflict: IndirectConflict | null;
    onApplySolution: (conflictId: string, solutionId: number, codePatch: string, affectedFile: string) => void;
}

export const AISolutionsModal: React.FC<AISolutionsModalProps> = ({
    isOpen,
    onClose,
    conflict,
    onApplySolution,
}) => {
    const [selectedSolutionId, setSelectedSolutionId] = useState<number>(2); // Default to Solution 2 (Combine)
    const [copiedSolutionId, setCopiedSolutionId] = useState<number | null>(null);

    if (!isOpen || !conflict) return null;

    const solutions: AISolutionOption[] = [
        conflict.aiSolutions.solution1,
        conflict.aiSolutions.solution2,
        conflict.aiSolutions.solution3
    ];

    const currentSolution = solutions.find(s => s.id === selectedSolutionId) || solutions[1];

    const handleCopy = (solution: AISolutionOption) => {
        navigator.clipboard.writeText(solution.codePatch);
        setCopiedSolutionId(solution.id);
        setTimeout(() => setCopiedSolutionId(null), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-cyan-500/30 bg-slate-950 text-slate-100 shadow-2xl shadow-cyan-500/10 overflow-hidden">
                
                {/* Header (Screenshot Section 5 Title) */}
                <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                    Step 5
                                </span>
                                <h3 className="text-lg font-black text-white">
                                    5. Generate Multiple Solutions
                                </h3>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Instead of automatically choosing one version, the AI generates alternatives:
                            </p>
                        </div>
                    </div>

                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Sub-Header Notice matching screenshot */}
                <div className="px-5 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                        <Bot className="w-4 h-4 text-cyan-400" />
                        <span>Target Conflict: <strong className="text-cyan-300 font-mono">{conflict.targetSymbol}</strong> across <span className="font-mono text-slate-400">{conflict.targetFile}</span></span>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                        3 AI Candidates Generated
                    </span>
                </div>

                {/* Main Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {/* The 3 Solution Cards / Tabs */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {solutions.map((sol) => {
                            const isSelected = selectedSolutionId === sol.id;
                            const icon = sol.id === 1 ? <GitMerge className="w-4 h-4" /> 
                                       : sol.id === 2 ? <Combine className="w-4 h-4" /> 
                                       : <Split className="w-4 h-4" />;

                            return (
                                <button
                                    key={sol.id}
                                    onClick={() => setSelectedSolutionId(sol.id)}
                                    className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                                        isSelected 
                                            ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/50' 
                                            : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-700'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`p-1.5 rounded-lg ${isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                                                {icon}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                sol.id === 2 
                                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                                    : 'bg-slate-800 text-slate-400'
                                            }`}>
                                                {sol.id === 2 ? 'Recommended' : `Option ${sol.id}`}
                                            </span>
                                        </div>
                                        <h4 className="text-xs font-bold text-white line-clamp-2 mb-1">
                                            {sol.title}
                                        </h4>
                                        <p className="text-[11px] text-slate-400 line-clamp-2">
                                            {sol.description}
                                        </p>
                                    </div>

                                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                                        <span>File: <code className="text-cyan-300">{sol.affectedFile}</code></span>
                                        {isSelected && <span className="font-bold text-cyan-400 flex items-center gap-1">Active <Check className="w-3 h-3" /></span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Active Selected Solution Deep-Dive */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-cyan-400" />
                                    {currentSolution.title}
                                </h4>
                                <p className="text-xs text-slate-300 mt-1">
                                    {currentSolution.description}
                                </p>
                            </div>

                            <button
                                onClick={() => handleCopy(currentSolution)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                            >
                                {copiedSolutionId === currentSolution.id ? (
                                    <>
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>Copy Patch</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Code Patch Preview */}
                        <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                            <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
                                <span>Proposed Resolution Patch</span>
                                <span className="text-cyan-400">{currentSolution.affectedFile}</span>
                            </div>
                            <pre className="p-3.5 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed bg-slate-950/80">
                                <code>{currentSolution.codePatch}</code>
                            </pre>
                        </div>

                        {/* Trade-offs & Impact Radius */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                                <span className="text-slate-400 font-semibold block mb-1">Architecture & Trade-offs:</span>
                                <p className="text-slate-300 text-[11px] leading-relaxed">
                                    {currentSolution.tradeoffs}
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
                                <div>
                                    <span className="text-slate-400 font-semibold block mb-1">Downstream Pipeline Stage:</span>
                                    <p className="text-slate-300 text-[11px]">
                                        Ready for Docker Sandbox verification & type checks (Pipeline Stages 6 & 7).
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 mt-2 text-[10px] text-cyan-300 font-mono">
                                    <Box className="w-3.5 h-3.5" />
                                    <span>Docker Sandbox: Candidate Ready</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Screenshot Quote Callout */}
                    <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400 font-medium">
                        ✨ <em>"Your project proposal specifically describes generating three resolution options."</em>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between border-t border-slate-800 p-4 bg-slate-900/90">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                    >
                        Dismiss
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                onApplySolution(
                                    conflict.id, 
                                    currentSolution.id, 
                                    currentSolution.codePatch, 
                                    currentSolution.affectedFile
                                );
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/25 transition-all transform active:scale-95"
                        >
                            <CheckCircle2 className="w-4 h-4 text-slate-950" />
                            <span>Apply Selected {currentSolution.title.split(':')[0]}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
