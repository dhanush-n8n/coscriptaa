import React, { useState } from 'react';
import { 
    HelpCircle, 
    Lightbulb, 
    ArrowRight, 
    Check, 
    BookOpen, 
    Sparkles, 
    AlertTriangle, 
    Code2, 
    FileCode, 
    GraduationCap, 
    Info,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { SemanticConflict, ConflictExplainability } from '../types/conflicts';

interface ExplainableConflictCardProps {
    conflict: SemanticConflict;
    onApplyRemedy?: (remedy: string) => void;
}

export const ExplainableConflictCard: React.FC<ExplainableConflictCardProps> = ({
    conflict,
    onApplyRemedy
}) => {
    const [showStudentMode, setShowStudentMode] = useState<boolean>(true);
    const [showCodeDetails, setShowCodeDetails] = useState<boolean>(false);

    const exp: ConflictExplainability = conflict.explainability || {
        cause: `Developer A modified structure of '${conflict.symbol}'.`,
        expectation: `Developer B's function expects previous contract.`,
        impact: `This may cause a runtime conflict in '${conflict.symbol}'.`,
        category: 'TYPE_MISMATCH',
        categoryLabel: "Type Mismatch",
        educationalExplanation: "Type contracts ensure callers and providers stay synchronized across modules.",
        targetEntity: conflict.symbol,
        devAName: "Developer A",
        devBName: "Developer B",
        remediationGuide: conflict.suggestedRemedy || "Update types or harmonize interfaces."
    };

    return (
        <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950/30 p-4.5 shadow-xl backdrop-blur-xl space-y-4">
            {/* Header: Feature Title */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 ring-1 ring-sky-500/30">
                        <Lightbulb className="w-4 h-4" />
                    </span>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                Feature 6
                            </span>
                            <h4 className="text-sm font-black text-white">
                                Explainable Conflict Detection — Explain WHY
                            </h4>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                            Transparent root cause explanation: {exp.categoryLabel}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowStudentMode(!showStudentMode)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                            showStudentMode 
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10' 
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                        title="Toggle educational learning insights for students & developers"
                    >
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>Student & Dev Mode</span>
                    </button>
                </div>
            </div>

            {/* Side-by-side Contrast: "Instead of simply showing..." vs "Show: Why?" */}
            <div className="space-y-3">
                {/* Traditional Vague Alert (Screenshot Reference) */}
                <div className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-3 opacity-60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block mb-1">
                        ❌ Instead of simply showing:
                    </span>
                    <div className="border-l-2 border-rose-500/40 pl-3 py-1 font-mono text-xs text-rose-300/80 italic">
                        Merge conflict detected.
                    </div>
                </div>

                {/* The Explainable "Why?" Block (Screenshot Core Requirement) */}
                <div className="rounded-xl border-2 border-sky-400/50 bg-sky-950/20 p-4 shadow-lg shadow-sky-950/40 relative overflow-hidden">
                    <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
                    
                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 block mb-2 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                        ✅ Explainable Root Cause Analysis:
                    </span>

                    <div className="border-l-4 border-sky-400 pl-4 py-1 space-y-2">
                        <h5 className="text-sm font-black text-sky-200 tracking-wide flex items-center gap-1.5">
                            Why?
                        </h5>
                        <ul className="space-y-1.5 text-xs text-slate-200">
                            <li className="flex items-start gap-2">
                                <span className="text-sky-400 font-bold mt-0.5">•</span>
                                <div>
                                    <span>{exp.cause.split('from')[0]} from </span>
                                    {exp.beforeType && exp.afterType ? (
                                        <>
                                            <code className="px-1.5 py-0.5 rounded bg-slate-900 font-mono text-amber-300 border border-slate-700 font-bold">
                                                {exp.beforeType}
                                            </code>
                                            <span> → </span>
                                            <code className="px-1.5 py-0.5 rounded bg-slate-900 font-mono text-emerald-300 border border-slate-700 font-bold">
                                                {exp.afterType}
                                            </code>
                                            <span>.</span>
                                        </>
                                    ) : (
                                        <span className="font-semibold">{exp.cause.substring(exp.cause.indexOf('from'))}</span>
                                    )}
                                </div>
                            </li>

                            <li className="flex items-start gap-2">
                                <span className="text-sky-400 font-bold mt-0.5">•</span>
                                <div>
                                    <span>{exp.expectation.replace(exp.beforeType || '', '')} </span>
                                    {exp.beforeType && (
                                        <code className="px-1.5 py-0.5 rounded bg-slate-900 font-mono text-amber-300 border border-slate-700 font-bold">
                                            {exp.beforeType}
                                        </code>
                                    )}
                                    <span>.</span>
                                </div>
                            </li>

                            <li className="flex items-start gap-2">
                                <span className="text-sky-400 font-bold mt-0.5">•</span>
                                <div>
                                    <span>{exp.impact.replace(exp.targetEntity || '', '')} </span>
                                    <code className="px-1.5 py-0.5 rounded bg-slate-900 font-mono text-cyan-300 border border-slate-700 font-bold">
                                        {exp.targetEntity}
                                    </code>
                                    <span>.</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Pedagogical Student & Developer Note (Screenshot quote) */}
            {showStudentMode && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 space-y-1.5 animate-in fade-in">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                        <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                        <span>Student & Developer Learning Context:</span>
                    </div>
                    <p className="text-[11px] text-amber-100/90 leading-relaxed pl-5">
                        {exp.educationalExplanation}
                    </p>
                    <div className="text-[10px] text-amber-400/80 italic pl-5">
                        ✨ "This makes the AI useful for students and developers, not just automatic merging."
                    </div>
                </div>
            )}

            {/* Toggleable Code Details */}
            {(exp.devACodeSnippet || exp.devBCodeSnippet) && (
                <div className="space-y-2">
                    <button
                        onClick={() => setShowCodeDetails(!showCodeDetails)}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
                    >
                        <span>{showCodeDetails ? "Hide" : "Inspect"} Concrete Code Snippets</span>
                        {showCodeDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {showCodeDetails && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            {exp.devACodeSnippet && (
                                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                                    <span className="text-[10px] font-mono text-emerald-400 block mb-1">
                                        Developer A Implementation:
                                    </span>
                                    <pre className="p-2 rounded bg-slate-900 font-mono text-[11px] text-emerald-300 overflow-x-auto leading-relaxed">
                                        <code>{exp.devACodeSnippet}</code>
                                    </pre>
                                </div>
                            )}

                            {exp.devBCodeSnippet && (
                                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5">
                                    <span className="text-[10px] font-mono text-sky-400 block mb-1">
                                        Developer B Consumer / Caller:
                                    </span>
                                    <pre className="p-2 rounded bg-slate-900 font-mono text-[11px] text-sky-300 overflow-x-auto leading-relaxed">
                                        <code>{exp.devBCodeSnippet}</code>
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Remediation Guide */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold text-slate-300">Recommended Resolution: </span>
                        <span className="text-slate-400">{exp.remediationGuide}</span>
                    </div>
                </div>

                {onApplyRemedy && (
                    <button
                        onClick={() => onApplyRemedy(exp.remediationGuide)}
                        className="shrink-0 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition-all text-[11px]"
                    >
                        Apply Fix
                    </button>
                )}
            </div>
        </div>
    );
};
