import React, { useState } from 'react';
import { 
    X, 
    Check, 
    Sparkles, 
    ShieldCheck, 
    ArrowDown, 
    Play, 
    CheckCircle2, 
    Copy, 
    AlertTriangle,
    FlaskConical
} from 'lucide-react';

interface AIConflictExplanationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApplySuggestion?: (suggestedFix: string) => void;
}

export const AIConflictExplanationModal: React.FC<AIConflictExplanationModalProps> = ({
    isOpen,
    onClose,
    onApplySuggestion
}) => {
    const [applied, setApplied] = useState<boolean>(false);
    const [validating, setValidating] = useState<boolean>(false);
    const [copied, setCopied] = useState<boolean>(false);

    if (!isOpen) return null;

    const handleApply = () => {
        setValidating(true);
        setTimeout(() => {
            setValidating(false);
            setApplied(true);
            if (onApplySuggestion) {
                onApplySuggestion("Convert Developer B's call to employee.id");
            }
        }, 600);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText("Convert Developer B's call to employee.id");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
                
                {/* Modal Top Bar */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
                    <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                            <Sparkles className="w-4 h-4" />
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            AI Conflict Explanation
                        </span>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                    {/* Header matching user prompt screenshot exactly */}
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                            3. One particularly good feature: AI Conflict Explanation
                        </h2>
                        <p className="text-sm font-semibold text-slate-600 mt-2">
                            I strongly recommend adding this.
                        </p>
                        <p className="text-sm text-slate-500 mt-4 font-medium">
                            When a conflict occurs, show:
                        </p>
                    </div>

                    {/* Main Card — Styled faithfully to screenshot media_1791262985706.png */}
                    <div className="relative rounded-3xl bg-[#f8f9fa] border border-slate-200/90 p-6 sm:p-8 font-mono text-[13px] sm:text-[14px] leading-relaxed text-slate-800 shadow-inner">
                        
                        {/* CONFLICT #24 */}
                        <div className="font-bold tracking-wide text-slate-900 mb-6">
                            CONFLICT #24
                        </div>

                        {/* Type & Severity */}
                        <div className="space-y-1 mb-6">
                            <div>
                                <span className="text-slate-700">Type: </span>
                                <span className="font-semibold text-slate-900">Semantic Conflict</span>
                            </div>
                            <div>
                                <span className="text-slate-700">Severity: </span>
                                <span className="font-bold text-rose-600">HIGH</span>
                            </div>
                        </div>

                        {/* Developer A Section */}
                        <div className="space-y-1 mb-6">
                            <div className="font-semibold text-slate-900">Developer A:</div>
                            <div className="text-slate-600">Changed:</div>
                            <div className="font-semibold text-slate-900">
                                calculateSalary(employeeId)
                            </div>
                        </div>

                        {/* Developer B Section */}
                        <div className="space-y-1 mb-6">
                            <div className="font-semibold text-slate-900">Developer B:</div>
                            <div className="text-slate-600">Changed:</div>
                            <div className="font-semibold text-slate-900">
                                calculateSalary(employee)
                            </div>
                        </div>

                        {/* WHY? Section */}
                        <div className="space-y-1 mb-6">
                            <div className="font-bold text-slate-900">WHY?</div>
                            <div className="text-slate-800 leading-normal">
                                The function interface was modified by Developer A, while Developer B is still passing an integer ID.
                            </div>
                        </div>

                        {/* AI SUGGESTION Section */}
                        <div className="space-y-1 mb-6">
                            <div className="font-bold text-slate-900">AI SUGGESTION:</div>
                            <div className="font-semibold text-indigo-700 leading-normal">
                                Convert Developer B's call to employee.id
                            </div>
                        </div>

                        {/* Confidence Section */}
                        <div className="mb-6">
                            <span className="text-slate-700">Confidence: </span>
                            <span className="font-bold text-emerald-600">94%</span>
                        </div>

                        {/* Validation Section */}
                        <div className="space-y-1">
                            <div className="font-semibold text-slate-900">Validation:</div>
                            <div className="space-y-1 text-slate-800">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-emerald-600 font-bold">✓</span>
                                    <span>Syntax</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-emerald-600 font-bold">✓</span>
                                    <span>Type check</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-emerald-600 font-bold">✓</span>
                                    <span>17 unit tests</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-emerald-600 font-bold">✓</span>
                                    <span>No new errors</span>
                                </div>
                            </div>
                        </div>

                        {/* Floating Scroll/Action Arrow from screenshot bottom right */}
                        <div className="absolute bottom-6 right-6">
                            <div className="w-9 h-9 rounded-full bg-white border border-slate-300 shadow-sm flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-400 transition-colors">
                                <ArrowDown className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    {/* Resolution Action Status */}
                    {applied && (
                        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 flex items-center gap-3 animate-in fade-in">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <div className="text-xs text-emerald-900">
                                <span className="font-bold block">AI Suggestion Successfully Applied!</span>
                                Developer B's caller updated to <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono font-bold">employee.id</code>. All 17 unit tests passed with 0 regressions.
                            </div>
                        </div>
                    )}

                    {/* Interactive Action Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <button
                            onClick={handleCopy}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copied ? "Copied Suggestion" : "Copy Suggestion"}</span>
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={onClose}
                                className="px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 font-bold text-xs transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleApply}
                                disabled={validating || applied}
                                className={`px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-lg flex items-center gap-2 transition-all ${
                                    applied 
                                        ? 'bg-emerald-600 cursor-default'
                                        : validating 
                                            ? 'bg-indigo-400 cursor-wait' 
                                            : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25 active:scale-95'
                                }`}
                            >
                                {applied ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        <span>Fix Applied</span>
                                    </>
                                ) : validating ? (
                                    <>
                                        <FlaskConical className="w-4 h-4 animate-spin" />
                                        <span>Running Sandbox Tests...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        <span>Apply AI Suggestion (94% Conf.)</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
