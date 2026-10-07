import React, { useState } from 'react';
import { 
    BrainCircuit, 
    Code2, 
    GitBranch, 
    Layers, 
    Network, 
    Tag, 
    ChevronDown, 
    ChevronUp,
    Sparkles,
    User,
    CheckCircle2
} from 'lucide-react';
import { IndirectConflict } from '../types/dependency';

interface AIContextCardProps {
    conflict: IndirectConflict;
}

export const AIContextCard: React.FC<AIContextCardProps> = ({ conflict }) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(true);
    const { aiContext } = conflict;

    return (
        <div className="rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-950/30 via-slate-900/90 to-slate-950 p-4 shadow-xl backdrop-blur-xl">
            {/* Header */}
            <div 
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/30">
                        <BrainCircuit className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                Step 4
                            </span>
                            <h4 className="text-sm font-black text-white tracking-wide">
                                4. AI Understands the Context
                            </h4>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Multi-modal context fed into CodeBERT classifier and LLM reasoning engine
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-cyan-300 border border-cyan-500/20">
                        CodeBERT: {(aiContext.codeBertClassification.confidence * 100).toFixed(0)}% Conf
                    </span>
                    <button className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="mt-4 space-y-4 pt-3 border-t border-slate-800/80">
                    {/* The 6 Context Elements Specified in Screenshot */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* 1. Original / Base Code */}
                        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-1.5">
                                <Code2 className="w-3.5 h-3.5 text-slate-400" />
                                <span>• Original / Base Code</span>
                            </div>
                            <pre className="p-2.5 rounded-lg bg-slate-900/90 font-mono text-[11px] text-slate-300 overflow-x-auto border border-slate-800/60 leading-relaxed">
                                <code>{aiContext.baseCode}</code>
                            </pre>
                        </div>

                        {/* 6. Conflict Type & CodeBERT classification */}
                        <div className="rounded-xl border border-cyan-500/20 bg-slate-950/70 p-3">
                            <div className="flex items-center justify-between text-xs font-bold text-cyan-300 mb-1.5">
                                <span className="flex items-center gap-1.5">
                                    <Tag className="w-3.5 h-3.5" />
                                    • Conflict Type & Classification
                                </span>
                                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-900/40 text-cyan-300 border border-cyan-500/30">
                                    {aiContext.conflictType}
                                </span>
                            </div>
                            <div className="space-y-1.5 text-xs text-slate-300">
                                <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800/60">
                                    <span className="text-slate-400 text-[11px]">CodeBERT Intent: </span>
                                    <span className="font-semibold text-cyan-300">{aiContext.codeBertClassification.intent}</span>
                                </div>
                                <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800/60 text-[11px]">
                                    <span className="text-slate-400">Attention Focus: </span>
                                    <span className="text-amber-300 font-mono">{aiContext.codeBertClassification.attentionFocus}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Developer A vs Developer B Changes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* 2. Developer A's Changes */}
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-3">
                            <div className="flex items-center justify-between text-xs font-bold text-emerald-300 mb-1.5">
                                <span className="flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-emerald-400" />
                                    • Developer A's Changes ({conflict.componentA.name})
                                </span>
                                <span className="text-[10px] font-mono text-emerald-400/80">{conflict.componentA.file}</span>
                            </div>
                            <p className="text-[11px] text-emerald-200/70 mb-2">{conflict.componentA.changeSummary}</p>
                            <pre className="p-2.5 rounded-lg bg-slate-900/90 font-mono text-[11px] text-emerald-300 overflow-x-auto border border-emerald-500/20 leading-relaxed">
                                <code>{aiContext.devACode}</code>
                            </pre>
                        </div>

                        {/* 3. Developer B's Changes */}
                        <div className="rounded-xl border border-blue-500/30 bg-blue-950/15 p-3">
                            <div className="flex items-center justify-between text-xs font-bold text-blue-300 mb-1.5">
                                <span className="flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-blue-400" />
                                    • Developer B's Changes ({conflict.componentB.name})
                                </span>
                                <span className="text-[10px] font-mono text-blue-400/80">{conflict.componentB.file}</span>
                            </div>
                            <p className="text-[11px] text-blue-200/70 mb-2">{conflict.componentB.changeSummary}</p>
                            <pre className="p-2.5 rounded-lg bg-slate-900/90 font-mono text-[11px] text-blue-300 overflow-x-auto border border-blue-500/20 leading-relaxed">
                                <code>{aiContext.devBCode}</code>
                            </pre>
                        </div>
                    </div>

                    {/* 4. AST Differences & 5. Related Functions / Dependencies */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* AST Differences */}
                        <div className="rounded-xl border border-purple-500/25 bg-purple-950/15 p-3">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300 mb-2">
                                <GitBranch className="w-3.5 h-3.5 text-purple-400" />
                                <span>• AST Differences</span>
                            </div>
                            <ul className="space-y-1.5 text-[11px] text-purple-200/90">
                                {aiContext.astDifferences.map((diff, idx) => (
                                    <li key={idx} className="flex items-start gap-1.5">
                                        <span className="text-purple-400 font-bold mt-0.5">›</span>
                                        <span className="font-mono bg-purple-900/30 px-1.5 py-0.5 rounded border border-purple-500/20">
                                            {diff}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Related functions / dependencies */}
                        <div className="rounded-xl border border-amber-500/25 bg-amber-950/15 p-3">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 mb-2">
                                <Network className="w-3.5 h-3.5 text-amber-400" />
                                <span>• Related Functions / Dependencies (Indirect Call Chain)</span>
                            </div>
                            <ul className="space-y-1.5 text-[11px] text-amber-200/90">
                                {aiContext.relatedDependencies.map((dep, idx) => (
                                    <li key={idx} className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                        <span className="font-mono">{dep}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Footer callout */}
                    <div className="flex items-center gap-2 text-xs text-cyan-200/80 bg-cyan-950/40 p-2.5 rounded-xl border border-cyan-500/20">
                        <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>
                            A CodeBERT-style model helps classify code changes, while an LLM reasons about candidate resolutions.
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
