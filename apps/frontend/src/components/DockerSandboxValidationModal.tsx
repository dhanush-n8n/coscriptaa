import React, { useState } from 'react';
import { 
    X, 
    Box, 
    Check, 
    CheckCircle2, 
    AlertTriangle, 
    RefreshCw, 
    ShieldCheck, 
    RotateCcw, 
    Layers, 
    Terminal, 
    Copy, 
    Gauge, 
    Cpu, 
    HardDrive, 
    Network,
    Sparkles,
    FileCheck,
    ArrowRight
} from 'lucide-react';
import { 
    DockerSandboxExecutionReport, 
    SandboxValidationSuiteResult, 
    SandboxCheckItem 
} from '../types/sandbox';
import { SemanticConflict } from '../types/conflicts';

interface DockerSandboxValidationModalProps {
    isOpen: boolean;
    onClose: () => void;
    conflict: SemanticConflict | null;
    initialResult?: SandboxValidationSuiteResult | null;
    onApplySolution: (solutionId: number, codePatch: string, conflictId: string) => void;
    onRollback?: (snapshotId: string) => void;
}

export const DockerSandboxValidationModal: React.FC<DockerSandboxValidationModalProps> = ({
    isOpen,
    onClose,
    conflict,
    initialResult,
    onApplySolution,
    onRollback,
}) => {
    const [selectedSolutionId, setSelectedSolutionId] = useState<number>(2); // Default to Recommended Solution 2
    const [isRunningSandbox, setIsRunningSandbox] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<'checks' | 'coverage' | 'container' | 'logs'>('checks');
    const [expandedCheck, setExpandedCheck] = useState<string | null>('Existing test cases');
    const [isRollbackDone, setIsRollbackDone] = useState<boolean>(false);
    const [copiedPatch, setCopiedPatch] = useState<boolean>(false);

    // Default mock data matching the screenshot proposal
    const mockSuiteResult: SandboxValidationSuiteResult = initialResult || {
        conflictId: conflict?.id || 'demo-conflict-01',
        conflictTitle: conflict?.title || "Type Mismatch in 'getUser()'",
        timestamp: Date.now(),
        recommendedSolutionId: 2,
        preResolutionSnapshotId: 'snap-pre-resolution-491a',
        reports: [
            {
                solutionId: 1,
                solutionTitle: "Solution 1: Keep Developer A's implementation (Strict String)",
                containerId: "docker-sandbox-cntr-1-a7e891",
                image: "node:18-alpine-sandbox",
                memoryLimit: "512MB",
                cpuQuota: "0.5 cores",
                networkIsolated: true,
                executionTimeMs: 135,
                overallStatus: 'failed',
                checks: {
                    syntaxCheck: {
                        name: 'Syntax check',
                        status: 'passed',
                        passed: true,
                        durationMs: 15,
                        details: "Clean syntax parsing. No token violations.",
                        subResults: [
                            { title: "AST Parsing", passed: true, durationMs: 7 },
                            { title: "Syntax Grammar Check", passed: true, durationMs: 8 }
                        ]
                    },
                    typeCheck: {
                        name: 'Type check',
                        status: 'warning',
                        passed: false,
                        durationMs: 40,
                        details: "Type warning: Strict string typing causes 2 type mismatches in callers passing integer IDs.",
                        subResults: [
                            { title: "TypeScript Compiler", passed: true, durationMs: 25 },
                            { title: "Legacy Caller Type Conformance", passed: false, durationMs: 15, output: "TS2345: Argument of type 'number' is not assignable to 'string'." }
                        ]
                    },
                    unitTests: {
                        name: 'Unit tests',
                        status: 'warning',
                        passed: false,
                        durationMs: 42,
                        details: "14/17 unit tests passed (3 tests failed on numerical inputs).",
                        subResults: [
                            { title: "String UUID tests (8/8)", passed: true, durationMs: 20 },
                            { title: "Numeric ID backward compatibility (3/6)", passed: false, durationMs: 14, output: "TypeError: user_id must be a string" },
                            { title: "Boundary tests (3/3)", passed: true, durationMs: 8 }
                        ]
                    },
                    existingTestCases: {
                        name: 'Existing test cases',
                        status: 'failed',
                        passed: false,
                        durationMs: 38,
                        details: "21/24 existing test cases passed (3 regression failures in billingService.ts).",
                        subResults: [
                            { title: "authService.test.ts (10/10)", passed: true, durationMs: 18 },
                            { title: "billingService.test.ts (5/8)", passed: false, durationMs: 12, output: "Failed: caller expects numerical account id" },
                            { title: "dataPipeline.test.ts (6/6)", passed: true, durationMs: 8 }
                        ]
                    }
                },
                coverage: {
                    lineCoverage: 78.4,
                    branchCoverage: 71.0,
                    functionCoverage: 100.0,
                    statementCoverage: 79.2,
                    uncoveredLines: [18, 19, 23, 24],
                    coverageGatePassed: false,
                    metricSummary: "78.4% line coverage fails 90% production acceptance threshold."
                },
                rollback: {
                    snapshotAvailable: true,
                    snapshotId: "snap-pre-resolution-491a",
                    safeToApply: false,
                    rollbackNotice: "High risk: 3 regression test failures in callers. Auto-rollback armed."
                },
                sandboxLogs: [
                    "[Docker Sandbox] Container docker-sandbox-cntr-1-a7e891 started",
                    "[Check 1/4] Syntax check: PASSED",
                    "[Check 2/4] Type check: WARNING (2 caller sites fail type check)",
                    "[Check 3/4] Unit tests: 14/17 PASSED (3 failures)",
                    "[Check 4/4] Existing test cases: 21/24 PASSED (3 regression breaks in billingService)",
                    "[Docker Sandbox] Coverage 78.4% below gate. Safe rollback preserved."
                ]
            },
            {
                solutionId: 2,
                solutionTitle: "Solution 2: Combine both changes (Polymorphic String | Number Coercion)",
                containerId: "docker-sandbox-cntr-2-f831bc",
                image: "node:18-alpine-sandbox",
                memoryLimit: "512MB",
                cpuQuota: "0.5 cores",
                networkIsolated: true,
                executionTimeMs: 142,
                overallStatus: 'passed',
                checks: {
                    syntaxCheck: {
                        name: 'Syntax check',
                        status: 'passed',
                        passed: true,
                        durationMs: 16,
                        details: "Clean AST generation. Zero syntax parsing errors, valid ES6 module export.",
                        subResults: [
                            { title: "Babel / AST Parsing", passed: true, durationMs: 6 },
                            { title: "Token Validation & Bracket Matching", passed: true, durationMs: 4 },
                            { title: "JSX / ESNext Grammar Compliance", passed: true, durationMs: 6 }
                        ]
                    },
                    typeCheck: {
                        name: 'Type check',
                        status: 'passed',
                        passed: true,
                        durationMs: 38,
                        details: "Zero TypeScript compilation errors. Polymorphic union (string | number) cleanly accepted by all caller sites.",
                        subResults: [
                            { title: "TypeScript Compiler (tsc --noEmit)", passed: true, durationMs: 22 },
                            { title: "Caller Parameter Signature Compatibility", passed: true, durationMs: 9 },
                            { title: "Return Type Invariant Verification", passed: true, durationMs: 7 }
                        ]
                    },
                    unitTests: {
                        name: 'Unit tests',
                        status: 'passed',
                        passed: true,
                        durationMs: 44,
                        details: "17/17 isolated unit tests passed (100% pass rate).",
                        subResults: [
                            { title: "String UUID lookup assertions (8/8)", passed: true, durationMs: 18 },
                            { title: "Numeric ID backward compatibility assertions (6/6)", passed: true, durationMs: 15 },
                            { title: "Null & undefined boundary coercion assertions (3/3)", passed: true, durationMs: 11 }
                        ]
                    },
                    existingTestCases: {
                        name: 'Existing test cases',
                        status: 'passed',
                        passed: true,
                        durationMs: 44,
                        details: "24/24 regression test cases passed across other files (zero breakage).",
                        subResults: [
                            { title: "authService.test.ts regression suite (10/10)", passed: true, durationMs: 19 },
                            { title: "billingService.test.ts regression suite (8/8)", passed: true, durationMs: 14 },
                            { title: "dataPipeline.test.ts regression suite (6/6)", passed: true, durationMs: 11 }
                        ]
                    }
                },
                coverage: {
                    lineCoverage: 94.6,
                    branchCoverage: 92.5,
                    functionCoverage: 100.0,
                    statementCoverage: 95.1,
                    uncoveredLines: [42],
                    coverageGatePassed: true,
                    metricSummary: "94.6% line coverage exceeds 90% production acceptance quality gate."
                },
                rollback: {
                    snapshotAvailable: true,
                    snapshotId: "snap-pre-resolution-491a",
                    safeToApply: true,
                    rollbackNotice: "Safe to apply. Rollback snapshot preserved if manual reversion needed."
                },
                sandboxLogs: [
                    "[Docker Sandbox] Initializing container docker-sandbox-cntr-2-f831bc from node:18-alpine-sandbox",
                    "[Docker Sandbox] Applied resource constraints: --memory=\"512m\" --cpus=\"0.5\" --network none",
                    "[Check 1/4] Running Syntax check (AST parser)... PASSED (16ms)",
                    "[Check 2/4] Running Type check (tsc static analyzer)... PASSED (38ms)",
                    "[Check 3/4] Running Unit tests (17 test specs)... 17/17 PASSED (44ms)",
                    "[Check 4/4] Running Existing test cases (24 regression specs)... 24/24 PASSED (44ms)",
                    "[Docker Sandbox] Code coverage computed: 94.6% lines, 92.5% branches. PASS.",
                    "[Docker Sandbox] Execution finished cleanly in 142ms. Zero container violations."
                ]
            },
            {
                solutionId: 3,
                solutionTitle: "Solution 3: Create separate functions (getUserById & getUserByUuid)",
                containerId: "docker-sandbox-cntr-3-c399b2",
                image: "node:18-alpine-sandbox",
                memoryLimit: "512MB",
                cpuQuota: "0.5 cores",
                networkIsolated: true,
                executionTimeMs: 139,
                overallStatus: 'warning',
                checks: {
                    syntaxCheck: {
                        name: 'Syntax check',
                        status: 'passed',
                        passed: true,
                        durationMs: 17,
                        details: "Clean syntax parsing. Both functions parsed properly.",
                        subResults: [
                            { title: "AST Parsing", passed: true, durationMs: 8 },
                            { title: "Dual Export Syntax", passed: true, durationMs: 9 }
                        ]
                    },
                    typeCheck: {
                        name: 'Type check',
                        status: 'passed',
                        passed: true,
                        durationMs: 36,
                        details: "Zero type errors. Both function signatures typed correctly.",
                        subResults: [
                            { title: "TypeScript Compiler", passed: true, durationMs: 24 },
                            { title: "Explicit Call Signatures", passed: true, durationMs: 12 }
                        ]
                    },
                    unitTests: {
                        name: 'Unit tests',
                        status: 'warning',
                        passed: false,
                        durationMs: 43,
                        details: "15/17 unit tests passed (2 legacy import callers need refactoring).",
                        subResults: [
                            { title: "getUserByUuid suite (8/8)", passed: true, durationMs: 21 },
                            { title: "getUserById suite (6/6)", passed: true, durationMs: 14 },
                            { title: "Legacy backward fallback (1/3)", passed: false, durationMs: 8, output: "DeprecationNotice: caller expects unified dispatch" }
                        ]
                    },
                    existingTestCases: {
                        name: 'Existing test cases',
                        status: 'warning',
                        passed: false,
                        durationMs: 43,
                        details: "22/24 existing test cases passed (2 callers in external modules import old name).",
                        subResults: [
                            { title: "authService.test.ts (9/10)", passed: false, durationMs: 18, output: "Import mismatch" },
                            { title: "billingService.test.ts (8/8)", passed: true, durationMs: 15 },
                            { title: "dataPipeline.test.ts (5/6)", passed: false, durationMs: 10 }
                        ]
                    }
                },
                coverage: {
                    lineCoverage: 83.1,
                    branchCoverage: 79.4,
                    functionCoverage: 100.0,
                    statementCoverage: 84.0,
                    uncoveredLines: [31, 32, 33],
                    coverageGatePassed: false,
                    metricSummary: "83.1% line coverage is below 90% threshold due to secondary branch."
                },
                rollback: {
                    snapshotAvailable: true,
                    snapshotId: "snap-pre-resolution-491a",
                    safeToApply: false,
                    rollbackNotice: "Requires manual import updates across 2 calling modules before merging."
                },
                sandboxLogs: [
                    "[Docker Sandbox] Container docker-sandbox-cntr-3-c399b2 started",
                    "[Check 1/4] Syntax check: PASSED",
                    "[Check 2/4] Type check: PASSED",
                    "[Check 3/4] Unit tests: 15/17 PASSED",
                    "[Check 4/4] Existing test cases: 22/24 PASSED (2 callers require import update)",
                    "[Docker Sandbox] Coverage: 83.1%. Rollback snapshot ready."
                ]
            }
        ],
        summary: {
            headline: "✓ 4/4 Checks Passed for Solution 2 in Isolated Docker Sandbox",
            description: "Solution 2 passed Syntax check, Type check, 17/17 Unit tests, and 24/24 Existing test cases with 94.6% coverage. Rollback snapshot safely primed.",
            sandboxExecutionReady: true,
            coveragePassed: true,
            rollbackPreserved: true
        }
    };

    if (!isOpen) return null;

    const currentReport: DockerSandboxExecutionReport = mockSuiteResult.reports.find(r => r.solutionId === selectedSolutionId) || mockSuiteResult.reports[1];

    const candidatePatches: Record<number, string> = {
        1: `export function getUser(user_id: string) {\n    if (typeof user_id !== 'string') {\n        throw new TypeError('user_id must be a string');\n    }\n    return db.users.find({ id: user_id });\n}`,
        2: `export function getUser(user_id: string | number) {\n    const sanitizedId = String(user_id).trim();\n    return db.users.find({ id: sanitizedId });\n}`,
        3: `export function getUserById(id: number) { return db.users.find({ numeric_id: id }); }\nexport function getUserByUuid(uuid: string) { return db.users.find({ id: uuid }); }\nexport const getUser = getUserById;`
    };

    const handleReRunSandbox = () => {
        setIsRunningSandbox(true);
        setTimeout(() => {
            setIsRunningSandbox(false);
        }, 800);
    };

    const handleExecuteRollback = () => {
        if (onRollback) {
            onRollback(currentReport.rollback.snapshotId);
        }
        setIsRollbackDone(true);
        setTimeout(() => setIsRollbackDone(false), 3000);
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(candidatePatches[currentReport.solutionId] || '');
        setCopiedPatch(true);
        setTimeout(() => setCopiedPatch(false), 2000);
    };

    const checkList: SandboxCheckItem[] = [
        currentReport.checks.syntaxCheck,
        currentReport.checks.typeCheck,
        currentReport.checks.unitTests,
        currentReport.checks.existingTestCases
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl border border-sky-500/30 bg-slate-950 text-slate-100 shadow-2xl shadow-sky-500/10 overflow-hidden">
                
                {/* Header matching screenshot Section 6 */}
                <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/40 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-slate-950 shadow-lg shadow-sky-500/20">
                            <Box className="w-5 h-5 font-bold" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                    Feature 8 • Section 6
                                </span>
                                <h3 className="text-base sm:text-lg font-black text-white">
                                    6. Validate every solution
                                </h3>
                            </div>
                            <p className="text-xs text-sky-300/80 font-medium mt-0.5 italic">
                                This is a very important part.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleReRunSandbox}
                            disabled={isRunningSandbox}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isRunningSandbox ? 'animate-spin' : ''}`} />
                            <span>Re-run Docker Sandbox</span>
                        </button>
                        <button 
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Main Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
                    
                    {/* The Exact Screenshot Card Presentation */}
                    <div className="rounded-2xl border-2 border-sky-500/40 bg-gradient-to-b from-slate-900/90 to-slate-950 p-5 shadow-xl">
                        <div className="text-sm sm:text-base font-semibold text-slate-200 mb-3">
                            Each generated solution is placed in an isolated <strong className="text-white font-extrabold">Docker sandbox</strong> and checked using:
                        </div>

                        {/* Screenshot's 4 Checks Box */}
                        <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-4 sm:p-5 space-y-3 font-mono">
                            {checkList.map((check) => {
                                const isExp = expandedCheck === check.name;
                                return (
                                    <div 
                                        key={check.name}
                                        className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 hover:border-slate-700 transition-all"
                                    >
                                        <div 
                                            onClick={() => setExpandedCheck(isExp ? null : check.name)}
                                            className="flex items-center justify-between cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2.5 text-sm sm:text-base font-bold">
                                                <span className={`text-base font-black ${
                                                    check.status === 'passed' 
                                                        ? 'text-emerald-400' 
                                                        : check.status === 'warning' 
                                                            ? 'text-amber-400' 
                                                            : 'text-rose-400'
                                                }`}>
                                                    ✓
                                                </span>
                                                <span className={`${
                                                    check.status === 'passed' ? 'text-white' : 'text-slate-300'
                                                }`}>
                                                    {check.name}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                                    check.status === 'passed' 
                                                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                                                        : check.status === 'warning'
                                                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                                            : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                                }`}>
                                                    {check.status === 'passed' ? 'PASSED' : check.status.toUpperCase()}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    {check.durationMs}ms
                                                </span>
                                            </div>
                                        </div>

                                        {/* Expanded sub-details */}
                                        {isExp && (
                                            <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-300 space-y-2 animate-in fade-in duration-150">
                                                <p className="text-slate-400">{check.details}</p>
                                                {check.subResults && check.subResults.length > 0 && (
                                                    <div className="space-y-1.5 pt-1">
                                                        {check.subResults.map((sub, idx) => (
                                                            <div 
                                                                key={idx}
                                                                className={`p-2 rounded-lg flex items-center justify-between text-[11px] ${
                                                                    sub.passed 
                                                                        ? 'bg-emerald-950/20 text-emerald-300 border border-emerald-500/20' 
                                                                        : 'bg-rose-950/20 text-rose-300 border border-rose-500/20'
                                                                }`}
                                                            >
                                                                <span className="flex items-center gap-1.5">
                                                                    <span>{sub.passed ? '✓' : '✗'}</span>
                                                                    <span>{sub.title}</span>
                                                                </span>
                                                                {sub.output && (
                                                                    <span className="text-[10px] text-amber-400 font-mono">
                                                                        {sub.output}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Verbatim quote from screenshot */}
                        <div className="mt-3.5 text-center text-xs text-slate-300 font-medium">
                            <span className="text-slate-400">The proposal includes </span>
                            <span className="font-bold text-sky-300">sandbox execution</span>,{' '}
                            <span className="font-bold text-emerald-300">coverage tracking</span>,{' '}
                            <span className="text-slate-400">and </span>
                            <span className="font-bold text-amber-300">rollback</span>.
                        </div>
                    </div>

                    {/* Candidate Solution Picker (Solutions 1, 2, 3) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {mockSuiteResult.reports.map((report) => {
                            const isSelected = selectedSolutionId === report.solutionId;
                            const isRec = report.solutionId === 2;

                            return (
                                <div
                                    key={report.solutionId}
                                    onClick={() => setSelectedSolutionId(report.solutionId)}
                                    className={`rounded-2xl p-4 border cursor-pointer transition-all flex flex-col justify-between ${
                                        isSelected 
                                            ? 'border-sky-400 bg-sky-950/30 shadow-xl shadow-sky-500/10 ring-1 ring-sky-400' 
                                            : isRec
                                                ? 'border-emerald-500/40 bg-slate-900/50 hover:bg-slate-900'
                                                : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/80'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                isRec 
                                                    ? 'bg-emerald-500 text-slate-950' 
                                                    : 'bg-slate-800 text-slate-300'
                                            }`}>
                                                {isRec ? '★ Recommended (100% Pass)' : `Candidate ${report.solutionId}`}
                                            </span>
                                            <span className={`text-xs font-mono font-bold ${
                                                report.overallStatus === 'passed' ? 'text-emerald-400' : 'text-amber-400'
                                            }`}>
                                                {report.coverage.lineCoverage}% Coverage
                                            </span>
                                        </div>

                                        <h4 className="text-xs font-black text-white mb-1.5">
                                            {report.solutionTitle}
                                        </h4>
                                    </div>

                                    <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-[11px] font-mono">
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400">Sandbox Status:</span>
                                            <span className={`font-bold ${
                                                report.overallStatus === 'passed' ? 'text-emerald-400' : 'text-rose-400'
                                            }`}>
                                                {report.overallStatus === 'passed' ? '✓ 4/4 Checks Passed' : '⚠️ Regressions Detected'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-slate-400">Existing Tests:</span>
                                            <span className="text-slate-200">
                                                {report.checks.existingTestCases.details.split(' ')[0]}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Deep-Dive Tabs: Checks | Coverage Tracking | Container Sandbox | Logs */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setActiveTab('checks')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                        activeTab === 'checks' 
                                            ? 'bg-sky-500 text-slate-950 shadow-md' 
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                                >
                                    ✓ 4 Automated Checks
                                </button>
                                <button
                                    onClick={() => setActiveTab('coverage')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                        activeTab === 'coverage' 
                                            ? 'bg-emerald-500 text-slate-950 shadow-md' 
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                                >
                                    <Gauge className="w-3.5 h-3.5" />
                                    <span>Coverage Tracking ({currentReport.coverage.lineCoverage}%)</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('container')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                        activeTab === 'container' 
                                            ? 'bg-blue-500 text-white shadow-md' 
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                                >
                                    <Box className="w-3.5 h-3.5" />
                                    <span>Docker Isolation</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('logs')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                        activeTab === 'logs' 
                                            ? 'bg-slate-700 text-white shadow-md' 
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                                >
                                    <Terminal className="w-3.5 h-3.5" />
                                    <span>Sandbox Logs</span>
                                </button>
                            </div>

                            <button
                                onClick={handleCopyCode}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                            >
                                {copiedPatch ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedPatch ? 'Copied' : 'Copy Solution Code'}</span>
                            </button>
                        </div>

                        {/* TAB 1: Checks & Code Patch */}
                        {activeTab === 'checks' && (
                            <div className="space-y-4">
                                <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                                    <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-slate-400">
                                        <span>Isolated Candidate Patch: {currentReport.solutionTitle.split(':')[0]}</span>
                                        <span className={currentReport.overallStatus === 'passed' ? 'text-emerald-400' : 'text-amber-400'}>
                                            Status: {currentReport.overallStatus.toUpperCase()}
                                        </span>
                                    </div>
                                    <pre className="p-3.5 font-mono text-xs text-sky-300 overflow-x-auto leading-relaxed bg-slate-950">
                                        <code>{candidatePatches[currentReport.solutionId]}</code>
                                    </pre>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                                        <span className="text-slate-400 font-mono text-[11px] block mb-1">Unit Tests Isolation:</span>
                                        <p className="text-white text-xs font-bold">
                                            {currentReport.checks.unitTests.details}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                                        <span className="text-slate-400 font-mono text-[11px] block mb-1">Regression Suite (Existing Tests):</span>
                                        <p className="text-white text-xs font-bold">
                                            {currentReport.checks.existingTestCases.details}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: Coverage Tracking (as specified in proposal) */}
                        {activeTab === 'coverage' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                                    <div className="flex items-center gap-2.5">
                                        <Gauge className="w-5 h-5 text-emerald-400" />
                                        <div>
                                            <h5 className="text-xs font-bold text-white">Coverage Tracking Report</h5>
                                            <p className="text-[11px] text-slate-300">{currentReport.coverage.metricSummary}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xl font-black text-emerald-400 font-mono">
                                            {currentReport.coverage.lineCoverage}%
                                        </span>
                                        <span className="block text-[9px] uppercase font-bold text-slate-400">Line Coverage</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-400">Branch Coverage</span>
                                            <span className="font-mono font-bold text-emerald-400">{currentReport.coverage.branchCoverage}%</span>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${currentReport.coverage.branchCoverage}%` }} />
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-400">Function Coverage</span>
                                            <span className="font-mono font-bold text-emerald-400">{currentReport.coverage.functionCoverage}%</span>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${currentReport.coverage.functionCoverage}%` }} />
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-400">Statement Coverage</span>
                                            <span className="font-mono font-bold text-emerald-400">{currentReport.coverage.statementCoverage}%</span>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${currentReport.coverage.statementCoverage}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: Container Sandbox Isolation */}
                        {activeTab === 'container' && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                                    <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                                        <Box className="w-3.5 h-3.5 text-sky-400" />
                                        <span>Container ID</span>
                                    </div>
                                    <div className="font-mono text-xs font-bold text-white truncate">
                                        {currentReport.containerId}
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                                    <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                                        <HardDrive className="w-3.5 h-3.5 text-sky-400" />
                                        <span>Memory Limit</span>
                                    </div>
                                    <div className="font-mono text-xs font-bold text-white">
                                        {currentReport.memoryLimit}
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                                    <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                                        <Cpu className="w-3.5 h-3.5 text-sky-400" />
                                        <span>CPU Quota</span>
                                    </div>
                                    <div className="font-mono text-xs font-bold text-white">
                                        {currentReport.cpuQuota}
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                                    <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
                                        <Network className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>Network Mode</span>
                                    </div>
                                    <div className="font-mono text-xs font-bold text-emerald-400">
                                        --network none
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 4: Sandbox Logs */}
                        {activeTab === 'logs' && (
                            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-300 space-y-1.5 max-h-48 overflow-y-auto">
                                {currentReport.sandboxLogs.map((log, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                        <span className="text-slate-600 select-none">{idx + 1}</span>
                                        <span className={log.includes('PASSED') ? 'text-emerald-400' : log.includes('WARNING') ? 'text-amber-400' : 'text-slate-300'}>
                                            {log}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Rollback Safety Guard Section (As specified in Proposal) */}
                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                                    <RotateCcw className="w-4 h-4" />
                                </div>
                                <div>
                                    <h5 className="text-xs font-bold text-white">Pre-Resolution Rollback Protection</h5>
                                    <p className="text-[11px] text-slate-400">{currentReport.rollback.rollbackNotice}</p>
                                </div>
                            </div>

                            <button
                                onClick={handleExecuteRollback}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 transition-colors"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>{isRollbackDone ? 'Rolled Back!' : 'Rollback to Snapshot'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="flex items-center justify-between border-t border-slate-800 p-4 bg-slate-900/90 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                    >
                        Close
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                onApplySolution(
                                    currentReport.solutionId,
                                    candidatePatches[currentReport.solutionId] || '',
                                    mockSuiteResult.conflictId
                                );
                                onClose();
                            }}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black shadow-lg transition-all transform active:scale-95 ${
                                currentReport.overallStatus === 'passed'
                                    ? 'bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
                                    : 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 shadow-amber-500/20'
                            }`}
                        >
                            <CheckCircle2 className="w-4 h-4 font-bold" />
                            <span>
                                {currentReport.overallStatus === 'passed'
                                    ? `Accept & Apply ${currentReport.solutionTitle.split(':')[0]} (4/4 Passed)`
                                    : `Apply ${currentReport.solutionTitle.split(':')[0]} with Rollback Arming`}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
