import React, { useState } from 'react';
import { 
    X, 
    CheckCircle2, 
    XCircle, 
    Edit3, 
    AlertTriangle, 
    ShieldCheck, 
    Activity, 
    Sparkles, 
    ChevronRight,
    ArrowRight,
    Check,
    Copy,
    Terminal,
    Layers,
    Filter
} from 'lucide-react';
import { 
    AIConfidenceOption, 
    EditRiskScore, 
    EditChangeCategory 
} from '../types/riskConfidence';
import { SemanticConflict } from '../types/conflicts';

interface ConfidenceAndRiskScoringModalProps {
    isOpen: boolean;
    onClose: () => void;
    conflict: SemanticConflict | null;
    onAcceptSolution: (solutionId: number, codePatch: string, conflictId: string) => void;
    onRejectSolution?: (solutionId: number, conflictId: string) => void;
    onModifyAndAcceptSolution?: (solutionId: number, modifiedPatch: string, conflictId: string) => void;
}

export const ConfidenceAndRiskScoringModal: React.FC<ConfidenceAndRiskScoringModalProps> = ({
    isOpen,
    onClose,
    conflict,
    onAcceptSolution,
    onRejectSolution,
    onModifyAndAcceptSolution,
}) => {
    const [activeTab, setActiveTab] = useState<'confidence' | 'risk_matrix' | 'approval'>('confidence');
    const [selectedSolutionId, setSelectedSolutionId] = useState<number>(2); // Default to Solution 2 (96%)
    const [isModifying, setIsModifying] = useState<boolean>(false);
    const [modifiedCode, setModifiedCode] = useState<string>(
        `export function getUser(user_id: string | number) {\n    const sanitizedId = String(user_id).trim();\n    return db.users.find({ id: sanitizedId });\n}`
    );
    const [copied, setCopied] = useState<boolean>(false);
    const [approvalStatus, setApprovalStatus] = useState<'pending' | 'accepted' | 'rejected' | 'modified'>('pending');

    // Screenshot 1 Data: 7. Give confidence score
    const confidenceTable: AIConfidenceOption[] = [
        {
            solutionId: 1,
            solutionName: "Solution 1",
            testsPassed: 12,
            testsTotal: 17,
            testFraction: "12/17",
            confidenceScore: 72,
            isRecommended: false,
            recommendationNote: "Fails 5 unit test assertions on numeric user_id inputs."
        },
        {
            solutionId: 2,
            solutionName: "Solution 2",
            testsPassed: 17,
            testsTotal: 17,
            testFraction: "17/17",
            confidenceScore: 96,
            isRecommended: true,
            recommendationNote: "Passes all validation checks (17/17 passed)."
        },
        {
            solutionId: 3,
            solutionName: "Solution 3",
            testsPassed: 14,
            testsTotal: 17,
            testFraction: "14/17",
            confidenceScore: 81,
            isRecommended: false,
            recommendationNote: "Fails 3 regression tests on external calling modules."
        }
    ];

    // Screenshot 2 Data: 🆕 Feature 4 — Risk Score for Every Edit
    const riskMatrixItems = [
        {
            change: "Comment change",
            risk: "5%",
            percent: 5,
            dot: "🟢",
            colorClass: "text-emerald-400 bg-emerald-950/30 border-emerald-500/30",
            barColor: "bg-emerald-500",
            category: "comment_change" as EditChangeCategory,
            detail: "Documentation, whitespace, or inline comment edit. Zero semantic divergence."
        },
        {
            change: "Variable rename",
            risk: "35%",
            percent: 35,
            dot: "🟡",
            colorClass: "text-amber-400 bg-amber-950/30 border-amber-500/30",
            barColor: "bg-amber-500",
            category: "variable_rename" as EditChangeCategory,
            detail: "Local identifier rename. Safe if contained within private block or scope."
        },
        {
            change: "Function modification",
            risk: "65%",
            percent: 65,
            dot: "🟠",
            colorClass: "text-orange-400 bg-orange-950/30 border-orange-500/30",
            barColor: "bg-orange-500",
            category: "function_modification" as EditChangeCategory,
            detail: "Function implementation, condition, or loop update. Moderate risk to callers."
        },
        {
            change: "API/interface modification",
            risk: "91%",
            percent: 91,
            dot: "🔴",
            colorClass: "text-rose-400 bg-rose-950/30 border-rose-500/30",
            barColor: "bg-rose-500",
            category: "api_interface_modification" as EditChangeCategory,
            detail: "Public signature, export interface, or parameter type contract modified. Critical risk of breaking external callers."
        }
    ];

    const patches: Record<number, string> = {
        1: `export function getUser(user_id: string) {\n    if (typeof user_id !== 'string') {\n        throw new TypeError('user_id must be a string');\n    }\n    return db.users.find({ id: user_id });\n}`,
        2: `export function getUser(user_id: string | number) {\n    const sanitizedId = String(user_id).trim();\n    return db.users.find({ id: sanitizedId });\n}`,
        3: `export function getUserById(id: number) { return db.users.find({ numeric_id: id }); }\nexport function getUserByUuid(uuid: string) { return db.users.find({ id: uuid }); }\nexport const getUser = getUserById;`
    };

    if (!isOpen) return null;

    const handleAccept = () => {
        setApprovalStatus('accepted');
        onAcceptSolution(selectedSolutionId, patches[selectedSolutionId] || modifiedCode, conflict?.id || 'demo-conflict');
        setTimeout(() => {
            onClose();
        }, 600);
    };

    const handleReject = () => {
        setApprovalStatus('rejected');
        if (onRejectSolution) {
            onRejectSolution(selectedSolutionId, conflict?.id || 'demo-conflict');
        }
        setTimeout(() => {
            onClose();
        }, 600);
    };

    const handleModifySave = () => {
        setApprovalStatus('modified');
        if (onModifyAndAcceptSolution) {
            onModifyAndAcceptSolution(selectedSolutionId, modifiedCode, conflict?.id || 'demo-conflict');
        } else {
            onAcceptSolution(selectedSolutionId, modifiedCode, conflict?.id || 'demo-conflict');
        }
        setIsModifying(false);
        setTimeout(() => {
            onClose();
        }, 600);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(patches[selectedSolutionId] || modifiedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-violet-500/30 bg-slate-950 text-slate-100 shadow-2xl shadow-violet-500/10 overflow-hidden">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-violet-950/40 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-600 text-slate-950 shadow-lg shadow-violet-500/20">
                            <Sparkles className="w-5 h-5 font-bold" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                                    Feature 9
                                </span>
                                <h3 className="text-base sm:text-lg font-black text-white">
                                    Confidence & Risk Scoring
                                </h3>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                                AI confidence scoring, concurrent edit risk evaluation & developer approval gateway
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs corresponding to the 3 Screenshots */}
                <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-800/80 bg-slate-900/60 overflow-x-auto shrink-0">
                    <button
                        onClick={() => { setActiveTab('confidence'); setIsModifying(false); }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                            activeTab === 'confidence'
                                ? 'bg-violet-500 text-slate-950 shadow-md font-black'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                    >
                        7. Give Confidence Score (Screenshot 1)
                    </button>
                    <button
                        onClick={() => { setActiveTab('approval'); setIsModifying(false); }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                            activeTab === 'approval'
                                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                    >
                        8. Developer Approves Solution (Screenshot 3)
                    </button>
                    <button
                        onClick={() => { setActiveTab('risk_matrix'); setIsModifying(false); }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                            activeTab === 'risk_matrix'
                                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                    >
                        <span>🆕 Feature 4 — Risk Score for Every Edit (Screenshot 2)</span>
                    </button>
                </div>

                {/* Main Tab Content */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">

                    {/* ============================================================== */}
                    {/* TAB 1: SCREENSHOT 1 — 7. Give confidence score                */}
                    {/* ============================================================== */}
                    {activeTab === 'confidence' && (
                        <div className="space-y-5">
                            <div className="rounded-2xl border-2 border-violet-500/40 bg-gradient-to-b from-slate-900/90 to-slate-950 p-5 shadow-xl">
                                <h4 className="text-base sm:text-lg font-bold text-white mb-2">
                                    7. Give confidence score
                                </h4>
                                <p className="text-xs text-slate-400 mb-4">
                                    For example:
                                </p>

                                {/* Verbatim Screenshot 1 Table */}
                                <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-inner font-mono">
                                    <div className="grid grid-cols-3 p-3.5 bg-slate-900/90 border-b border-slate-800 text-xs font-bold text-slate-300">
                                        <span>AI Solution</span>
                                        <span className="text-center">Tests</span>
                                        <span className="text-right">Confidence</span>
                                    </div>

                                    <div className="divide-y divide-slate-800/80 text-xs">
                                        {confidenceTable.map((row) => {
                                            const isRec = row.isRecommended;
                                            const isSelected = selectedSolutionId === row.solutionId;
                                            return (
                                                <div 
                                                    key={row.solutionId}
                                                    onClick={() => setSelectedSolutionId(row.solutionId)}
                                                    className={`grid grid-cols-3 p-3.5 items-center cursor-pointer transition-all ${
                                                        isRec 
                                                            ? 'bg-emerald-950/20 hover:bg-emerald-950/30 font-bold' 
                                                            : 'hover:bg-slate-900/60 text-slate-300'
                                                    } ${isSelected ? 'ring-1 ring-inset ring-violet-400/60' : ''}`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className={isRec ? 'text-white font-extrabold' : 'text-slate-300'}>
                                                            {row.solutionName}
                                                        </span>
                                                        {isRec && (
                                                            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded">
                                                                Top Pick
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className={`text-center ${isRec ? 'text-emerald-400 font-extrabold' : 'text-slate-400'}`}>
                                                        {row.testFraction}
                                                    </div>

                                                    <div className={`text-right font-extrabold ${isRec ? 'text-emerald-400 text-sm' : 'text-slate-300'}`}>
                                                        {row.confidenceScore}%
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Verbatim Screenshot 1 Subtext */}
                                <p className="mt-4 text-xs sm:text-sm text-slate-300">
                                    The system recommends <strong className="text-white font-black">Solution 2</strong> because it passes all validation checks.
                                </p>
                            </div>

                            {/* Code Patch Preview for Selected Option */}
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-mono">
                                        <span className="text-slate-400">Selected Candidate:</span>
                                        <span className="font-bold text-white">Solution {selectedSolutionId}</span>
                                        <span className="text-emerald-400 font-bold">
                                            ({confidenceTable.find(c => c.solutionId === selectedSolutionId)?.confidenceScore}% Confidence)
                                        </span>
                                    </div>

                                    <button
                                        onClick={handleCopy}
                                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                                    >
                                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                        <span>{copied ? 'Copied' : 'Copy'}</span>
                                    </button>
                                </div>

                                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-violet-300 overflow-x-auto leading-relaxed">
                                    <code>{patches[selectedSolutionId]}</code>
                                </pre>

                                <div className="flex justify-end pt-2">
                                    <button
                                        onClick={() => setActiveTab('approval')}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-md hover:scale-102 transition-all"
                                    >
                                        <span>Proceed to Developer Approval</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ============================================================== */}
                    {/* TAB 2: SCREENSHOT 3 — 8. Developer approves the solution       */}
                    {/* ============================================================== */}
                    {activeTab === 'approval' && (
                        <div className="space-y-5">
                            <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-b from-slate-900/90 to-slate-950 p-5 sm:p-6 shadow-xl">
                                <h4 className="text-base sm:text-lg font-bold text-white mb-2">
                                    8. Developer approves the solution
                                </h4>
                                <p className="text-xs text-slate-400 mb-4">
                                    Finally:
                                </p>

                                {/* Verbatim Screenshot 3 Box */}
                                <div className="rounded-2xl border border-slate-800/90 bg-slate-900/70 p-5 sm:p-6 space-y-4 max-w-md mx-auto shadow-2xl">
                                    <div className="border-b border-slate-800 pb-2">
                                        <h5 className="font-mono text-sm font-bold text-slate-300 tracking-wide">
                                            AI Recommendation
                                        </h5>
                                    </div>

                                    <div className="space-y-1 font-mono text-sm">
                                        <div className="text-white font-black text-base">
                                            Solution 2
                                        </div>
                                        <div className="text-slate-300">
                                            Confidence: <span className="font-bold text-emerald-400">96%</span>
                                        </div>
                                        <div className="text-slate-300">
                                            Tests Passed: <span className="font-bold text-emerald-400">17/17</span>
                                        </div>
                                    </div>

                                    {/* Verbatim Screenshot 3 Action Buttons [Accept] [Reject] [Modify] */}
                                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 sm:gap-3 font-mono text-xs sm:text-sm">
                                        <button
                                            onClick={handleAccept}
                                            className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black transition-all shadow-md active:scale-95 text-center"
                                        >
                                            [Accept]
                                        </button>
                                        <button
                                            onClick={handleReject}
                                            className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-300 font-bold border border-slate-700 hover:border-rose-500/40 transition-all active:scale-95 text-center"
                                        >
                                            [Reject]
                                        </button>
                                        <button
                                            onClick={() => setIsModifying(!isModifying)}
                                            className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-sky-950/60 hover:text-sky-300 text-slate-300 font-bold border border-slate-700 hover:border-sky-500/40 transition-all active:scale-95 text-center"
                                        >
                                            [Modify]
                                        </button>
                                    </div>
                                </div>

                                {/* Verbatim Screenshot 3 Subtext */}
                                <p className="mt-5 text-center text-xs sm:text-sm text-slate-300 italic font-medium">
                                    Only after developer approval is the resolved version merged.
                                </p>
                            </div>

                            {/* Inline Modify Editor (revealed on [Modify] click) */}
                            {isModifying && (
                                <div className="rounded-2xl border border-sky-500/40 bg-slate-900/80 p-4 space-y-3 animate-in fade-in duration-200">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-mono font-bold text-sky-300 flex items-center gap-1.5">
                                            <Edit3 className="w-3.5 h-3.5" />
                                            Developer Inline Customizer (Modify Before Merge):
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono">
                                            Editable Code Patch
                                        </span>
                                    </div>

                                    <textarea
                                        value={modifiedCode}
                                        onChange={(e) => setModifiedCode(e.target.value)}
                                        rows={6}
                                        className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 font-mono text-xs text-sky-200 focus:outline-none focus:border-sky-400"
                                    />

                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => setIsModifying(false)}
                                            className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-400 hover:text-white"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleModifySave}
                                            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md"
                                        >
                                            Confirm & Merge Modified Solution
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ============================================================== */}
                    {/* TAB 3: SCREENSHOT 2 — Feature 4 — Risk Score for Every Edit   */}
                    {/* ============================================================== */}
                    {activeTab === 'risk_matrix' && (
                        <div className="space-y-5">
                            <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-b from-slate-900/90 to-slate-950 p-5 sm:p-6 shadow-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-base">🆕</span>
                                    <h4 className="text-base sm:text-lg font-bold text-white">
                                        Feature 4 — Risk Score for Every Edit
                                    </h4>
                                </div>
                                
                                <p className="text-xs text-slate-300 mb-4">
                                    Give every concurrent change a risk score:
                                </p>

                                {/* Verbatim Screenshot 2 Table */}
                                <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-inner font-mono">
                                    <div className="grid grid-cols-2 p-3.5 bg-slate-900/90 border-b border-slate-800 text-xs font-bold text-slate-300">
                                        <span>Change</span>
                                        <span className="text-right">Risk</span>
                                    </div>

                                    <div className="divide-y divide-slate-800/80 text-xs">
                                        {riskMatrixItems.map((item, idx) => (
                                            <div 
                                                key={idx}
                                                className="grid grid-cols-2 p-3.5 items-center hover:bg-slate-900/60 transition-colors"
                                            >
                                                <div className="flex items-center gap-2 text-slate-200">
                                                    <span>{item.change}</span>
                                                </div>

                                                <div className="flex items-center justify-end gap-2">
                                                    <span className="text-sm select-none">{item.dot}</span>
                                                    <span className={`font-bold font-mono px-2 py-0.5 rounded-md border text-xs ${item.colorClass}`}>
                                                        {item.risk}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Verbatim Screenshot 2 Subtext */}
                                <p className="mt-4 text-xs sm:text-sm text-slate-300">
                                    The system can prioritize which edits need attention.
                                </p>
                            </div>

                            {/* Real-time Prioritization Matrix Explanation */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                                    <div className="flex items-center gap-2 text-rose-400 font-bold mb-1">
                                        <span>🔴 High Risk (91% & 65%)</span>
                                    </div>
                                    <p className="text-slate-400 text-[11px] leading-relaxed">
                                        API & function contract changes. The system automatically pushes these to the top of the concurrent stream so collaborators catch them before collisions occur.
                                    </p>
                                </div>

                                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                                    <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                                        <span>🟢 Low Risk (5% & 35%)</span>
                                    </div>
                                    <p className="text-slate-400 text-[11px] leading-relaxed">
                                        Documentation, comments, and local variable renames. Handled safely with automated convergence and minimal alerts.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-slate-800 p-4 bg-slate-900/90 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                    >
                        Close
                    </button>

                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                        <span>Solution 2 (96% Confidence)</span>
                        <span className="text-emerald-400 font-bold">✓ Ready for Merge</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
