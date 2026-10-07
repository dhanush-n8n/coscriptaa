import { 
    AlertTriangle, 
    CheckCircle2, 
    Sparkles, 
    RefreshCw, 
    ChevronRight, 
    FileCode2, 
    ShieldAlert, 
    ArrowRight, 
    Bot, 
    Wrench,
    Check,
    Lightbulb,
    FlaskConical,
    Box
} from 'lucide-react';
import { toast } from 'sonner';
import { SemanticConflict } from '../types/conflicts';
import { ExplainableConflictCard } from './ExplainableConflictCard';
import { AIValidationPipelineModal } from './AIValidationPipelineModal';
import { DockerSandboxValidationModal } from './DockerSandboxValidationModal';
import { ConfidenceAndRiskScoringModal } from './ConfidenceAndRiskScoringModal';
import { useState } from 'react';

interface SemanticConflictsPanelProps {
    conflicts: SemanticConflict[];
    isAnalyzing: boolean;
    onRunAnalysis: () => void;
    onResolveConflict: (conflictId: string, solutionId?: number) => void;
    onNavigateToFile?: (fileName: string, line: number) => void;
    onSimulateProactive?: () => void;
    onSimulateExplainable?: (scenario?: 'type_mismatch' | 'interface' | 'duplicate' | 'dependency') => void;
}

export const SemanticConflictsPanel: React.FC<SemanticConflictsPanelProps> = ({
    conflicts,
    isAnalyzing,
    onRunAnalysis,
    onResolveConflict,
    onNavigateToFile,
    onSimulateProactive,
    onSimulateExplainable,
}) => {
    const [selectedConflictForValidation, setSelectedConflictForValidation] = useState<SemanticConflict | null>(null);
    const [selectedConflictForSandbox, setSelectedConflictForSandbox] = useState<SemanticConflict | null>(null);
    const [selectedConflictForConfidence, setSelectedConflictForConfidence] = useState<SemanticConflict | null>(null);

    const handleActionClick = (action: 'validation' | 'sandbox' | 'confidence') => {
        if (conflicts.length === 0) {
            toast.error("No semantic conflicts found!", {
                description: "Run 'Scan AST' first on conflicting code."
            });
            return;
        }
        if (action === 'validation') setSelectedConflictForValidation(conflicts[0]);
        if (action === 'sandbox') setSelectedConflictForSandbox(conflicts[0]);
        if (action === 'confidence') setSelectedConflictForConfidence(conflicts[0]);
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* Pipeline Stage Banner */}
            <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/40 to-slate-900/80 p-4 shadow-xl backdrop-blur-xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                            <ShieldAlert className="w-4 h-4" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                                Pipeline Stages 3 – 8
                            </h4>
                            <p className="text-sm font-extrabold text-white">
                                AST & Semantic Conflict Detection
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 justify-end">
                        <button
                            onClick={() => handleActionClick('validation')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 transition-all shadow-sm"
                            title="Run AI Multiple Solutions & Validation (17 Tests) - Feature 7"
                        >
                            <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
                            <span>AI Validation</span>
                        </button>
                        <button
                            onClick={() => handleActionClick('sandbox')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 transition-all shadow-sm"
                            title="Run Isolated Docker Sandbox Validation (4 Checks) - Feature 8"
                        >
                            <Box className="w-3.5 h-3.5 text-sky-400" />
                            <span>Docker Sandbox</span>
                        </button>
                        <button
                            onClick={() => handleActionClick('confidence')}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 text-violet-300 transition-all shadow-sm"
                            title="Confidence Scores & Developer Approval - Feature 9"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                            <span>Confidence & Approval (Feature 9)</span>
                        </button>
                        <button
                            onClick={onRunAnalysis}
                            disabled={isAnalyzing}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shadow-md ${
                                isAnalyzing
                                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 hover:from-amber-300 hover:to-orange-400 hover:scale-105'
                            }`}
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                            <span>{isAnalyzing ? 'Analyzing AST...' : 'Scan AST'}</span>
                        </button>
                    </div>
                </div>

                <div className="mt-3 pt-3 border-t border-white/[.07] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-300 font-mono">
                        Method: AST Parsing + CodeBERT Semantic Model
                    </span>
                    <span className={`font-bold px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wide ${
                        conflicts.length > 0 
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                        {conflicts.length > 0 ? `${conflicts.length} Conflict(s)` : 'AST Clean'}
                    </span>
                </div>

                {onSimulateExplainable && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-amber-500/20 text-[11px]">
                        <span className="text-sky-300 font-bold flex items-center gap-1">
                            <Lightbulb className="w-3.5 h-3.5 text-sky-400" /> Explainable "Why?" Demos:
                        </span>
                        <button
                            onClick={() => onSimulateExplainable('type_mismatch')}
                            className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-500/30 font-semibold transition-all shadow-sm"
                            title="Screenshot 6 Scenario: Type Mismatch (getUser user_id int -> string)"
                        >
                            🎯 Type Mismatch (int → string)
                        </button>
                        <button
                            onClick={() => onSimulateExplainable('interface')}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                        >
                            Interface Arity
                        </button>
                        <button
                            onClick={() => onSimulateExplainable('duplicate')}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                        >
                            Duplicate Decl
                        </button>
                        <button
                            onClick={() => onSimulateExplainable('dependency')}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                        >
                            Incompatible Dep
                        </button>
                    </div>
                )}
            </div>

            {/* Conflict List Container */}
            <div className="flex-1 rounded-2xl border border-white/[.1] bg-[#111a2b]/85 p-4 shadow-xl backdrop-blur-xl flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3 shrink-0">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        Detected Semantic Divergences
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                        Centralized Server Analysis
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                    {conflicts.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 text-xs space-y-2">
                            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 opacity-80" />
                            <p className="font-bold text-white text-sm">No Semantic Conflicts Detected</p>
                            <p className="text-slate-400 max-w-xs mx-auto text-[11px]">
                                AST syntax trees, function signatures, and cross-file references converge cleanly.
                            </p>
                            <button
                                onClick={onRunAnalysis}
                                className="mt-2 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 underline"
                            >
                                Trigger manual scan
                            </button>
                        </div>
                    ) : (
                        conflicts.map((conflict) => {
                            const isCritical = conflict.severity === 'CRITICAL';
                            return (
                                <div
                                    key={conflict.id}
                                    className={`rounded-xl p-3.5 border transition-all space-y-3 ${
                                        isCritical
                                            ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50'
                                            : 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/50'
                                    }`}
                                >
                                    {/* Header & Badges */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                    isCritical ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                                                }`}>
                                                    {conflict.severity}
                                                </span>
                                                <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-cyan-300 border border-white/[.07]">
                                                    {conflict.category.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <h5 className="font-extrabold text-sm text-white">
                                                {conflict.title}
                                            </h5>
                                        </div>

                                        {conflict.aiAnalysis && (
                                            <span className="shrink-0 px-2 py-1 rounded-md bg-purple-500/20 border border-purple-500/30 text-[10px] font-mono font-bold text-purple-300 flex items-center gap-1">
                                                <Bot className="w-3 h-3 text-purple-400" />
                                                {conflict.aiAnalysis.riskScore}% Risk
                                            </span>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <p className="text-xs text-slate-300">
                                        {conflict.description}
                                    </p>

                                    {/* AST Structural Context */}
                                    <div className="p-2.5 rounded-lg bg-[#070c17]/80 border border-white/[.07] space-y-1.5 text-xs font-mono">
                                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
                                                Caller: {conflict.sourceFile}:{conflict.sourceLine}
                                            </span>
                                            {conflict.targetFile && (
                                                <span className="flex items-center gap-1">
                                                    Target: {conflict.targetFile}:{conflict.targetLine}
                                                </span>
                                            )}
                                        </div>

                                        {conflict.astDetails.callerContext && (
                                            <div className="text-[11px] text-rose-300 bg-rose-950/40 p-1.5 rounded border border-rose-500/20">
                                                {conflict.astDetails.callerContext}
                                            </div>
                                        )}

                                        {conflict.astDetails.declaredSignature && (
                                            <div className="text-[11px] text-emerald-300 bg-emerald-950/40 p-1.5 rounded border border-emerald-500/20">
                                                Defined: {conflict.astDetails.declaredSignature}
                                            </div>
                                        )}
                                    </div>

                                    {/* Feature 6: Explainable Conflict Detection (Why did it occur?) */}
                                    <ExplainableConflictCard 
                                        conflict={conflict} 
                                        onApplyRemedy={() => onResolveConflict(conflict.id)} 
                                    />

                                    {/* AI Intent & CodeBERT Diagnosis */}
                                    {conflict.aiAnalysis && (
                                        <div className="p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-500/20 space-y-1">
                                            <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-300">
                                                <Bot className="w-3.5 h-3.5 text-indigo-400" />
                                                AI Intent Divergence Diagnosis
                                            </div>
                                            <p className="text-[11px] text-slate-300 italic">
                                                {conflict.aiAnalysis.intentDivergence}
                                            </p>
                                        </div>
                                    )}

                                    {/* Candidate Solutions (Pipeline Stage 7 Preview) */}
                                    {conflict.aiAnalysis?.proposedSolutions && conflict.aiAnalysis.proposedSolutions.length > 0 && (
                                        <div className="space-y-1.5 pt-1">
                                            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                                <Wrench className="w-3 h-3 text-cyan-400" />
                                                AI Proposed Solutions
                                            </div>

                                            <div className="space-y-1.5">
                                                {conflict.aiAnalysis.proposedSolutions.map((sol) => (
                                                    <div 
                                                        key={sol.id}
                                                        className="p-2 rounded-lg bg-white/[.03] border border-white/[.05] hover:border-cyan-500/30 transition-colors text-xs flex items-center justify-between gap-2"
                                                    >
                                                        <div className="min-w-0 flex-1">
                                                            <div className="font-bold text-slate-200 text-[11px]">
                                                                {sol.title}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 truncate">
                                                                {sol.description}
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={() => onResolveConflict(conflict.id, sol.id)}
                                                            className="shrink-0 px-2 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-[10px] flex items-center gap-1 transition-colors"
                                                        >
                                                            <Check className="w-3 h-3" />
                                                            Resolve
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Feature 7 Action: Run Multiple AI Solutions + 17 Tests */}
                                    <div className="pt-1 border-t border-slate-800/80 space-y-1.5">
                                        <button
                                            onClick={() => setSelectedConflictForValidation(conflict)}
                                            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/15 transition-all transform active:scale-95"
                                        >
                                            <FlaskConical className="w-3.5 h-3.5 text-slate-950" />
                                            <span>Run Multiple AI Solutions + 17 Unit Tests (Feature 7)</span>
                                        </button>

                                        {/* Feature 8 Action: Validate in Isolated Docker Sandbox */}
                                        <button
                                            onClick={() => setSelectedConflictForSandbox(conflict)}
                                            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/15 transition-all transform active:scale-95"
                                        >
                                            <Box className="w-3.5 h-3.5 text-slate-950" />
                                            <span>Validate in Isolated Docker Sandbox (Feature 8)</span>
                                        </button>

                                        {/* Feature 9 Action: Confidence & Developer Approval */}
                                        <button
                                            onClick={() => setSelectedConflictForConfidence(conflict)}
                                            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-violet-400 to-purple-500 hover:from-violet-300 hover:to-purple-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-violet-500/15 transition-all transform active:scale-95"
                                        >
                                            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                                            <span>Confidence Scores & Developer Approval (Feature 9)</span>
                                        </button>
                                    </div>

                                    {/* Fallback Single Resolve Button */}
                                    {(!conflict.aiAnalysis?.proposedSolutions || conflict.aiAnalysis.proposedSolutions.length === 0) && (
                                        <button
                                            onClick={() => onResolveConflict(conflict.id)}
                                            className="w-full py-1.5 rounded-lg bg-white/[.05] hover:bg-white/[.1] text-xs font-bold text-slate-300 transition-colors flex items-center justify-center gap-1"
                                        >
                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                            Mark as Resolved
                                        </button>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* AI Validation Pipeline Modal (Feature 7) */}
            <AIValidationPipelineModal
                isOpen={Boolean(selectedConflictForValidation)}
                onClose={() => setSelectedConflictForValidation(null)}
                conflict={selectedConflictForValidation}
                onOpenDockerSandbox={() => {
                    setSelectedConflictForSandbox(selectedConflictForValidation);
                    setSelectedConflictForValidation(null);
                }}
                onApplySolution={(solutionId, patch, conflictId) => {
                    onResolveConflict(conflictId, solutionId);
                    setSelectedConflictForValidation(null);
                }}
            />

            {/* Isolated Docker Sandbox Validation Modal (Feature 8) */}
            <DockerSandboxValidationModal
                isOpen={Boolean(selectedConflictForSandbox)}
                onClose={() => setSelectedConflictForSandbox(null)}
                conflict={selectedConflictForSandbox}
                onApplySolution={(solutionId, patch, conflictId) => {
                    onResolveConflict(conflictId, solutionId);
                    setSelectedConflictForSandbox(null);
                }}
            />

            {/* Confidence & Risk Scoring + Developer Approval Modal (Feature 9) */}
            <ConfidenceAndRiskScoringModal
                isOpen={Boolean(selectedConflictForConfidence)}
                onClose={() => setSelectedConflictForConfidence(null)}
                conflict={selectedConflictForConfidence}
                onAcceptSolution={(solutionId, patch, conflictId) => {
                    onResolveConflict(conflictId, solutionId);
                    setSelectedConflictForConfidence(null);
                }}
                onRejectSolution={(solutionId, conflictId) => {
                    setSelectedConflictForConfidence(null);
                }}
                onModifyAndAcceptSolution={(solutionId, patch, conflictId) => {
                    onResolveConflict(conflictId, solutionId);
                    setSelectedConflictForConfidence(null);
                }}
            />
        </div>
    );
};
