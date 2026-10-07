import React, { useState, useEffect } from 'react';
import { 
    X, 
    Sparkles, 
    CheckCircle2, 
    ShieldCheck, 
    Play, 
    RefreshCw, 
    Layers, 
    Check, 
    Copy, 
    ArrowDown, 
    CheckCheck, 
    AlertTriangle,
    FlaskConical,
    FileCode,
    Bot,
    ChevronRight,
    Terminal,
    Box
} from 'lucide-react';
import { ValidationPipelineRun, ValidatedAISolution, SemanticConflict } from '../types/conflicts';

interface AIValidationPipelineModalProps {
    isOpen: boolean;
    onClose: () => void;
    conflict: SemanticConflict | null;
    initialRun?: ValidationPipelineRun | null;
    onApplySolution: (solutionId: number, codePatch: string, conflictId: string) => void;
    onOpenDockerSandbox?: () => void;
}

export const AIValidationPipelineModal: React.FC<AIValidationPipelineModalProps> = ({
    isOpen,
    onClose,
    conflict,
    initialRun,
    onApplySolution,
    onOpenDockerSandbox,
}) => {
    const [selectedSolutionId, setSelectedSolutionId] = useState<number>(2); // Default to Solution 2
    const [isSimulatingTests, setIsSimulatingTests] = useState<boolean>(false);
    const [activeStage, setActiveStage] = useState<number>(4); // 0=detected, 1=ai_gen, 2=tests, 3=results, 4=recommend
    const [copiedSolutionId, setCopiedSolutionId] = useState<number | null>(null);
    const [pipelineData, setPipelineData] = useState<ValidationPipelineRun | null>(initialRun || null);

    // Default mock data if initialRun is not yet loaded
    useEffect(() => {
        if (initialRun) {
            setPipelineData(initialRun);
        } else if (conflict?.validationRun) {
            setPipelineData(conflict.validationRun);
        } else {
            // Fallback generation matching screenshot
            setPipelineData({
                conflictId: conflict?.id || 'demo-conflict',
                conflictTitle: conflict?.title || "Type Mismatch in 'getUser()'",
                timestamp: Date.now(),
                stage: 'validation_complete',
                recommendedSolutionId: 2,
                testsTotal: 17,
                recommendationHeadline: "Solution 2 -> 17/17 tests passed ✓ (Recommend Solution 2)",
                summary: "AI generates 3 resolution candidates. Validated using type-checker and 17 unit tests. Solution 2 achieves 100% pass rate.",
                solutions: [
                    {
                        id: 1,
                        title: "Solution 1: Keep Developer A's implementation",
                        description: "Enforce strict string type validation on user_id across all calls.",
                        codeDiffOrPatch: `export function getUser(user_id: string) {\n    if (typeof user_id !== 'string') {\n        throw new TypeError('user_id must be string');\n    }\n    return db.users.find({ id: user_id });\n}`,
                        confidenceScore: 82,
                        typeCheckStatus: 'warning',
                        typeCheckDetails: "Strict string typing rejected by 2 numerical caller integration points.",
                        testsTotal: 17,
                        testsPassed: 14,
                        testResults: Array.from({ length: 17 }, (_, i) => ({
                            name: `unit_test_case_${i + 1}`,
                            passed: i !== 8 && i !== 14,
                            durationMs: Math.floor(Math.random() * 5) + 2,
                            errorMessage: (i === 8 || i === 14) ? "TypeError: expected string but received number" : undefined
                        })),
                        isRecommended: false,
                        recommendationReason: "Fails 3 edge case tests where numeric session IDs are passed."
                    },
                    {
                        id: 2,
                        title: "Solution 2: Combine both changes (Polymorphic Union)",
                        description: "Accept both string | number, coercing seamlessly with zero breaking changes.",
                        codeDiffOrPatch: `export function getUser(user_id: string | number) {\n    const sanitizedId = String(user_id).trim();\n    return db.users.find({ id: sanitizedId });\n}`,
                        confidenceScore: 94,
                        typeCheckStatus: 'passed',
                        typeCheckDetails: "Zero type errors. Both string UUIDs and numeric IDs pass cleanly.",
                        testsTotal: 17,
                        testsPassed: 17,
                        testResults: Array.from({ length: 17 }, (_, i) => ({
                            name: `unit_test_case_${i + 1}`,
                            passed: true,
                            durationMs: Math.floor(Math.random() * 5) + 2
                        })),
                        isRecommended: true,
                        recommendationReason: "17/17 tests passed ✓. 100% test coverage with zero regressions."
                    },
                    {
                        id: 3,
                        title: "Solution 3: Create separate functions for the two behaviours",
                        description: "Separate into getUserById(numericId) and getUserByUuid(stringId).",
                        codeDiffOrPatch: `export function getUserById(id: number) { return db.users.find({ numeric_id: id }); }\nexport function getUserByUuid(uuid: string) { return db.users.find({ id: uuid }); }\nexport const getUser = getUserById;`,
                        confidenceScore: 71,
                        typeCheckStatus: 'passed',
                        typeCheckDetails: "Explicit functions, but leaves backward compatibility ambiguities.",
                        testsTotal: 17,
                        testsPassed: 15,
                        testResults: Array.from({ length: 17 }, (_, i) => ({
                            name: `unit_test_case_${i + 1}`,
                            passed: i !== 5 && i !== 12,
                            durationMs: Math.floor(Math.random() * 5) + 2,
                            errorMessage: (i === 5 || i === 12) ? "DeprecationWarning: legacy caller" : undefined
                        })),
                        isRecommended: false,
                        recommendationReason: "15/17 tests passed. Downstream callers import legacy export."
                    }
                ]
            });
        }
    }, [initialRun, conflict]);

    if (!isOpen || !pipelineData) return null;

    const currentSolution: ValidatedAISolution = pipelineData.solutions.find(s => s.id === selectedSolutionId) || pipelineData.solutions[1];

    const handleCopy = (patch: string, solId: number) => {
        navigator.clipboard.writeText(patch);
        setCopiedSolutionId(solId);
        setTimeout(() => setCopiedSolutionId(null), 2000);
    };

    const handleReRunTests = () => {
        setIsSimulatingTests(true);
        setActiveStage(2); // tests running

        setTimeout(() => {
            setActiveStage(3); // results
            setTimeout(() => {
                setActiveStage(4); // recommend
                setIsSimulatingTests(false);
            }, 600);
        }, 900);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl border border-emerald-500/30 bg-slate-950 text-slate-100 shadow-2xl shadow-emerald-500/10 overflow-hidden">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 shadow-lg shadow-emerald-500/20">
                            <FlaskConical className="w-5 h-5 font-bold" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Feature 7 • Stage 5
                                </span>
                                <h3 className="text-base sm:text-lg font-black text-white">
                                    5. Multiple AI Solutions + Validation
                                </h3>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Generates 3 resolution options and validates each using type-checks and 17 unit tests
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {onOpenDockerSandbox && (
                            <button
                                onClick={() => {
                                    onClose();
                                    onOpenDockerSandbox();
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-xs font-black text-sky-300 border border-sky-500/30 transition-all shadow-sm"
                                title="Open Isolated Docker Sandbox (Feature 8)"
                            >
                                <Box className="w-3.5 h-3.5 text-sky-400" />
                                <span>Docker Sandbox (Feature 8)</span>
                            </button>
                        )}
                        <button
                            onClick={handleReRunTests}
                            disabled={isSimulatingTests}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isSimulatingTests ? 'animate-spin' : ''}`} />
                            <span>Re-run 17 Tests</span>
                        </button>
                        <button 
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                    
                    {/* Visual Architecture Flow from Screenshot */}
                    <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-b from-slate-900/90 to-slate-950 p-4 shadow-xl">
                        <div className="flex items-center justify-between mb-3 text-xs font-bold text-emerald-300">
                            <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                                <Sparkles className="w-4 h-4 text-emerald-400" />
                                Execution Pipeline (As Specified in Proposal):
                            </span>
                            <span className="font-mono text-[11px] text-slate-400">
                                Automated Sandbox & Type Checker
                            </span>
                        </div>

                        {/* ASCII / Visual Flow Diagram matching screenshot verbatim */}
                        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs sm:text-sm text-slate-200 space-y-2 overflow-x-auto">
                            <div className="flex items-center gap-2 text-red-400 font-bold">
                                <span>Conflict detected</span>
                            </div>
                            <div className="text-slate-500 pl-4">↓</div>
                            
                            <div className="space-y-1 pl-2 text-cyan-300">
                                <span className="text-slate-400 block">AI generates:</span>
                                <div className="pl-4 space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-300">Solution 1 → 82% confidence</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-emerald-300 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30 w-fit">
                                        <span>Solution 2 → 94% confidence</span>
                                        <span className="text-[10px] uppercase bg-emerald-500 text-slate-950 px-1 rounded font-black">Top Pick</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-300">Solution 3 → 71% confidence</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-slate-500 pl-4">↓</div>

                            <div className="flex items-center gap-2 text-amber-300 pl-2">
                                <span>Run tests (Type-checks + 17 Unit Tests)</span>
                                {isSimulatingTests && <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />}
                            </div>
                            <div className="text-slate-500 pl-4">↓</div>

                            <div className="flex items-center gap-2 text-emerald-400 font-bold pl-2">
                                <span>Solution 2 → 17/17 tests passed ✓</span>
                            </div>
                            <div className="text-slate-500 pl-4">↓</div>

                            <div className="flex items-center gap-2 text-emerald-300 font-extrabold pl-2 text-sm bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/40 w-fit">
                                <CheckCheck className="w-4 h-4 text-emerald-400" />
                                <span>Recommend Solution 2</span>
                            </div>
                        </div>

                        {/* Callout Quote from Screenshot */}
                        <div className="mt-3 text-center text-xs text-slate-400 font-medium italic">
                            ✨ <em>"This is much stronger than simply asking an AI to generate a merge."</em>
                        </div>
                    </div>

                    {/* The 3 Solution Candidate Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                        {pipelineData.solutions.map(sol => {
                            const isSelected = selectedSolutionId === sol.id;
                            const isRec = sol.isRecommended;

                            return (
                                <div
                                    key={sol.id}
                                    onClick={() => setSelectedSolutionId(sol.id)}
                                    className={`rounded-2xl p-4 border cursor-pointer transition-all flex flex-col justify-between ${
                                        isSelected 
                                            ? 'border-emerald-400 bg-emerald-950/30 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-400' 
                                            : isRec
                                                ? 'border-emerald-500/40 bg-slate-900/50 hover:bg-slate-900'
                                                : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-700'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                isRec 
                                                    ? 'bg-emerald-500 text-slate-950' 
                                                    : 'bg-slate-800 text-slate-300'
                                            }`}>
                                                {isRec ? '★ Recommended' : `Option ${sol.id}`}
                                            </span>
                                            <span className="font-mono text-xs font-bold text-cyan-300">
                                                {sol.confidenceScore}% confidence
                                            </span>
                                        </div>

                                        <h4 className="text-xs font-black text-white mb-1.5 leading-snug">
                                            {sol.title}
                                        </h4>
                                        <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                                            {sol.description}
                                        </p>
                                    </div>

                                    <div className="pt-3 border-t border-slate-800/80 space-y-2">
                                        {/* Test Result Metric */}
                                        <div className="flex items-center justify-between text-[11px] font-mono">
                                            <span className="text-slate-400">Unit Tests:</span>
                                            <span className={`font-bold flex items-center gap-1 ${
                                                sol.testsPassed === sol.testsTotal 
                                                    ? 'text-emerald-400' 
                                                    : 'text-amber-400'
                                            }`}>
                                                {sol.testsPassed}/{sol.testsTotal} passed
                                                {sol.testsPassed === sol.testsTotal && ' ✓'}
                                            </span>
                                        </div>

                                        {/* Type Check Status */}
                                        <div className="flex items-center justify-between text-[11px] font-mono">
                                            <span className="text-slate-400">Type Soundness:</span>
                                            <span className={`font-bold capitalize ${
                                                sol.typeCheckStatus === 'passed' ? 'text-emerald-400' : 'text-amber-400'
                                            }`}>
                                                {sol.typeCheckStatus}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Active Selected Solution Deep-Dive */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-black text-white">
                                        {currentSolution.title}
                                    </h4>
                                    {currentSolution.isRecommended && (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase">
                                            AI Recommended Pick
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-300 mt-1">
                                    {currentSolution.description}
                                </p>
                            </div>

                            <button
                                onClick={() => handleCopy(currentSolution.codeDiffOrPatch, currentSolution.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                            >
                                {copiedSolutionId === currentSolution.id ? (
                                    <>
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>Copied Patch</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>Copy Code</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Code Patch Preview */}
                        <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                            <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-slate-400">
                                <span>Synthesized Candidate Patch</span>
                                <span className="text-emerald-400">{currentSolution.confidenceScore}% Confidence</span>
                            </div>
                            <pre className="p-3.5 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed bg-slate-950">
                                <code>{currentSolution.codeDiffOrPatch}</code>
                            </pre>
                        </div>

                        {/* 17 Unit Tests Breakdown */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                                <span className="flex items-center gap-1.5">
                                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                                    Validation Suite Execution ({currentSolution.testsPassed}/{currentSolution.testsTotal} Passed):
                                </span>
                                <span className="text-[11px] font-mono text-slate-400">
                                    TypeScript + Jest / Sandbox Assertions
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[160px] overflow-y-auto pr-1">
                                {currentSolution.testResults.map((test, idx) => (
                                    <div 
                                        key={idx}
                                        className={`p-2 rounded-lg border text-[11px] font-mono flex items-center justify-between ${
                                            test.passed 
                                                ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300' 
                                                : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                                        }`}
                                    >
                                        <span className="truncate pr-1">
                                            {test.passed ? '✓' : '✗'} {test.name}
                                        </span>
                                        <span className="text-[9px] text-slate-500 shrink-0">
                                            {test.durationMs}ms
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recommendation Rationale */}
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                            <span className="text-slate-400 font-bold block mb-1">Validation Rationale:</span>
                            <p className="text-slate-300 text-[11px] leading-relaxed">
                                {currentSolution.recommendationReason}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between border-t border-slate-800 p-4 bg-slate-900/90 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                    >
                        Close
                    </button>

                    <div className="flex items-center gap-3">
                        {onOpenDockerSandbox && (
                            <button
                                onClick={() => {
                                    onClose();
                                    onOpenDockerSandbox();
                                }}
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 transition-colors"
                            >
                                <Box className="w-4 h-4 text-sky-400" />
                                <span>Validate in Docker Sandbox</span>
                            </button>
                        )}
                        <button
                            onClick={() => {
                                onApplySolution(
                                    currentSolution.id, 
                                    currentSolution.codeDiffOrPatch, 
                                    pipelineData.conflictId
                                );
                                onClose();
                            }}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all transform active:scale-95"
                        >
                            <CheckCircle2 className="w-4 h-4 text-slate-950 font-bold" />
                            <span>Apply {currentSolution.title.split(':')[0]}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
