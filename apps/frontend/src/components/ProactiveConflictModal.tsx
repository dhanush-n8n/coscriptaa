import React, { useState } from 'react';
import { 
    AlertTriangle, 
    X, 
    Sparkles, 
    GitMerge, 
    Layers, 
    Check, 
    ArrowRight, 
    Cpu, 
    Play, 
    ShieldAlert, 
    CheckCircle2,
    Copy
} from 'lucide-react';
import { ProactiveDivergence } from '../types/proactive';

interface ProactiveConflictModalProps {
    isOpen: boolean;
    onClose: () => void;
    divergence: ProactiveDivergence | null;
    onApplyResolution: (codePatch: string) => void;
    onSimulateExample: () => void;
}

export const ProactiveConflictModal: React.FC<ProactiveConflictModalProps> = ({
    isOpen,
    onClose,
    divergence,
    onApplyResolution,
    onSimulateExample,
}) => {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    if (!isOpen) return null;

    // Fallback to sample scenario from the project architecture if none active
    const activeData: ProactiveDivergence = divergence || {
        id: "demo-calculate",
        entityName: "calculate()",
        entityType: "function",
        file: "src/utils.js",
        devA: {
            name: "Developer A",
            codeSnippet: "function calculate(a, b) {\n    return a + b;\n}",
            params: ["a", "b"],
            operation: "Addition (+)",
            returnExpr: "a + b"
        },
        devB: {
            name: "Developer B",
            codeSnippet: "function calculate(x, y) {\n    return x * y;\n}",
            params: ["x", "y"],
            operation: "Multiplication (*)",
            returnExpr: "x * y"
        },
        observations: [
            "Both developers modified calculate()",
            "The parameters were changed/renamed (a, b vs x, y)",
            "The return operation is different (+ vs *)",
            "This is better than simply comparing text lines."
        ],
        conflictSummary: "Concurrent edits detected: Developer A implemented Addition while Developer B implemented Multiplication.",
        riskLevel: "CRITICAL",
        synthesizedResolution: `// Synthesized function supporting both developers' operations:\nfunction calculate(a, b, mode = 'add') {\n    if (mode === 'multiply') {\n        return a * b;\n    }\n    return a + b;\n}`
    };

    const handleCopy = (text: string, idx: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(idx);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0c1424] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[.08] bg-[#101b30]/80">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-extrabold text-white">
                                    Proactive Conflict Prediction
                                </h3>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                    {activeData.riskLevel} Risk
                                </span>
                            </div>
                            <p className="text-xs text-slate-400">
                                In-flight structural conflict identified before merge collision occurs
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onSimulateExample}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all"
                            title="Reload screenshot scenario"
                        >
                            <Play className="w-3 h-3" />
                            Simulate Screenshot Scenario
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[.07] transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-sm">
                    {/* 1. Capture Concurrent Changes */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-xs border border-cyan-500/30">
                                1
                            </span>
                            <h4 className="font-extrabold text-white text-base">
                                Capture concurrent changes
                            </h4>
                        </div>
                        <p className="text-xs text-slate-400 pl-8">
                            Suppose two developers edit the same project at the same time.
                        </p>

                        <div className="pl-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Developer A Card */}
                            <div className="relative rounded-xl border border-cyan-500/30 bg-[#070c17] p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-cyan-300 font-mono">
                                        {activeData.devA.name}:
                                    </span>
                                    <button
                                        onClick={() => handleCopy(activeData.devA.codeSnippet, 1)}
                                        className="text-slate-500 hover:text-slate-300"
                                        title="Copy code"
                                    >
                                        {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                                <pre className="text-xs font-mono text-cyan-100 bg-cyan-950/20 p-3 rounded-lg border border-cyan-500/15 overflow-x-auto">
                                    <code>{activeData.devA.codeSnippet}</code>
                                </pre>
                                <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-1">
                                    <span>Params: [{activeData.devA.params.join(', ')}]</span>
                                    <span className="text-cyan-400 font-semibold">{activeData.devA.operation}</span>
                                </div>
                            </div>

                            {/* Developer B Card */}
                            <div className="relative rounded-xl border border-orange-500/30 bg-[#070c17] p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-orange-300 font-mono">
                                        {activeData.devB.name}:
                                    </span>
                                    <button
                                        onClick={() => handleCopy(activeData.devB.codeSnippet, 2)}
                                        className="text-slate-500 hover:text-slate-300"
                                        title="Copy code"
                                    >
                                        {copiedIndex === 2 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                                <pre className="text-xs font-mono text-orange-100 bg-orange-950/20 p-3 rounded-lg border border-orange-500/15 overflow-x-auto">
                                    <code>{activeData.devB.codeSnippet}</code>
                                </pre>
                                <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-1">
                                    <span>Params: [{activeData.devB.params.join(', ')}]</span>
                                    <span className="text-orange-400 font-semibold">{activeData.devB.operation}</span>
                                </div>
                            </div>
                        </div>

                        <div className="pl-8 text-xs text-slate-400 italic bg-white/[.02] p-2.5 rounded-lg border border-white/[.05]">
                            The CRDT layer maintains both users' changes and identifies the concurrent modifications in real time.
                        </div>
                    </div>

                    {/* 2. Parse the code using AST */}
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs border border-amber-500/30">
                                2
                            </span>
                            <h4 className="font-extrabold text-white text-base">
                                Parse the code using AST
                            </h4>
                        </div>
                        <p className="text-xs text-slate-400 pl-8">
                            The system converts both versions into an <span className="text-white font-bold">Abstract Syntax Tree (AST)</span>.
                        </p>

                        <div className="pl-8 space-y-2">
                            <div className="text-xs text-slate-300">
                                It can understand that:
                            </div>

                            <ul className="space-y-2 text-xs font-medium text-slate-200 bg-slate-900/60 p-4 rounded-xl border border-white/[.08]">
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                                    <span>
                                        Both developers modified <code className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded font-mono">{activeData.entityName}</code>
                                    </span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                    <span>
                                        The parameters were changed/renamed: <span className="font-mono text-cyan-300">[{activeData.devA.params.join(', ')}]</span> vs <span className="font-mono text-orange-300">[{activeData.devB.params.join(', ')}]</span>
                                    </span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                                    <span>
                                        The return operation is different: <span className="font-mono text-cyan-300 font-bold">{activeData.devA.operation}</span> vs <span className="font-mono text-orange-300 font-bold">{activeData.devB.operation}</span>
                                    </span>
                                </li>
                            </ul>

                            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 pt-1">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                This is better than simply comparing text lines.
                            </div>
                        </div>
                    </div>

                    {/* 3. Proactive Resolution Synthesis */}
                    <div className="space-y-3 pt-3 border-t border-white/[.08]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-cyan-400" />
                                <h5 className="font-bold text-white text-xs uppercase tracking-wider">
                                    Proactive Solution Synthesis
                                </h5>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                                Reconcile before merge collision
                            </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/25 space-y-3">
                            <pre className="text-xs font-mono text-cyan-100 bg-[#070c17] p-3 rounded-lg border border-cyan-500/15 overflow-x-auto">
                                <code>{activeData.synthesizedResolution}</code>
                            </pre>

                            <div className="flex flex-wrap items-center gap-2 justify-end">
                                <button
                                    onClick={() => onApplyResolution(activeData.devA.codeSnippet)}
                                    className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold border border-cyan-500/30 transition-colors"
                                >
                                    Keep {activeData.devA.name} ({activeData.devA.operation})
                                </button>
                                <button
                                    onClick={() => onApplyResolution(activeData.devB.codeSnippet)}
                                    className="px-3 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-xs font-bold border border-orange-500/30 transition-colors"
                                >
                                    Keep {activeData.devB.name} ({activeData.devB.operation})
                                </button>
                                <button
                                    onClick={() => onApplyResolution(activeData.synthesizedResolution)}
                                    className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-cyan-950/40 transition-all flex items-center gap-1.5"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    Apply Synthesized Resolution
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
