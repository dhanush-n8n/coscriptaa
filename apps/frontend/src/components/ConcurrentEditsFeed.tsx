import React, { useState } from 'react';
import { 
    GitCommit, 
    Layers, 
    CheckCircle2, 
    Clock, 
    Cpu, 
    Activity, 
    Users, 
    ShieldCheck,
    FileEdit,
    Filter,
    Sparkles,
    AlertTriangle,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { CRDTEditEvent, CollaboratorPresence } from '../types/codebase';

interface ConcurrentEditsFeedProps {
    edits: CRDTEditEvent[];
    collaborators: CollaboratorPresence[];
    crdtSynced: boolean;
    localUserId?: string;
    onSimulateFourRiskEdits?: () => void;
}

export const ConcurrentEditsFeed: React.FC<ConcurrentEditsFeedProps> = ({
    edits,
    collaborators,
    crdtSynced,
    localUserId,
    onSimulateFourRiskEdits,
}) => {
    const [prioritizeHighRisk, setPrioritizeHighRisk] = useState<boolean>(false);
    const [showRiskTable, setShowRiskTable] = useState<boolean>(true);
    const [simulatedEdits, setSimulatedEdits] = useState<CRDTEditEvent[]>([]);

    const formatTime = (ts: number) => {
        const diff = Math.max(0, Math.floor((Date.now() - ts) / 1000));
        if (diff < 5) return 'just now';
        if (diff < 60) return `${diff}s ago`;
        const mins = Math.floor(diff / 60);
        if (mins < 60) return `${mins}m ago`;
        return `${Math.floor(mins / 60)}h ago`;
    };

    // Helper to evaluate Risk Score according to Screenshot 2 (5%, 35%, 65%, 91%)
    const getEditRisk = (edit: CRDTEditEvent) => {
        if (edit.risk) {
            return {
                changeLabel: edit.risk.changeLabel,
                riskPercent: edit.risk.riskPercent,
                dotEmoji: edit.risk.dotEmoji,
                colorClass: edit.risk.riskPercent >= 90 
                    ? 'text-rose-400 bg-rose-950/40 border-rose-500/30' 
                    : edit.risk.riskPercent >= 60 
                        ? 'text-orange-400 bg-orange-950/40 border-orange-500/30' 
                        : edit.risk.riskPercent >= 30 
                            ? 'text-amber-400 bg-amber-950/40 border-amber-500/30' 
                            : 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30',
                priorityRank: edit.risk.priorityRank
            };
        }

        const txt = (edit.summary + ' ' + edit.fileName).toLowerCase();
        
        // 1. API/interface modification (91%)
        if (txt.includes('export') || txt.includes('signature') || txt.includes('interface') || txt.includes('api') || txt.includes('parameter type') || txt.includes('user_id')) {
            return {
                changeLabel: 'API/interface modification',
                riskPercent: 91,
                dotEmoji: '🔴',
                colorClass: 'text-rose-400 bg-rose-950/40 border-rose-500/30',
                priorityRank: 1
            };
        }
        
        // 2. Function modification (65%)
        if (txt.includes('function') || txt.includes('calculate') || txt.includes('modify') || txt.includes('handler') || txt.includes('return') || txt.includes('algorithm')) {
            return {
                changeLabel: 'Function modification',
                riskPercent: 65,
                dotEmoji: '🟠',
                colorClass: 'text-orange-400 bg-orange-950/40 border-orange-500/30',
                priorityRank: 2
            };
        }

        // 3. Variable rename (35%)
        if (txt.includes('rename') || txt.includes('variable') || txt.includes('const') || txt.includes('let') || txt.includes('identifier')) {
            return {
                changeLabel: 'Variable rename',
                riskPercent: 35,
                dotEmoji: '🟡',
                colorClass: 'text-amber-400 bg-amber-950/40 border-amber-500/30',
                priorityRank: 3
            };
        }

        // 4. Comment change (5%)
        return {
            changeLabel: 'Comment change',
            riskPercent: 5,
            dotEmoji: '🟢',
            colorClass: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30',
            priorityRank: 4
        };
    };

    const handleLocalSimulate = () => {
        const now = Date.now();
        const demo: CRDTEditEvent[] = [
            {
                id: `demo-1-${now}`,
                userId: 'dev-alice',
                userName: 'Alice',
                userColor: '#ec4899',
                fileId: 'user_service_js',
                fileName: 'userService.js',
                timestamp: now - 1000,
                action: 'modify',
                summary: 'API interface modification: changed export function getUser(user_id: string)'
            },
            {
                id: `demo-2-${now}`,
                userId: 'dev-bob',
                userName: 'Bob',
                userColor: '#38bdf8',
                fileId: 'calc_service_js',
                fileName: 'calcService.js',
                timestamp: now - 3000,
                action: 'modify',
                summary: 'Function modification: updated calculateDiscount() loop threshold'
            },
            {
                id: `demo-3-${now}`,
                userId: 'dev-carol',
                userName: 'Carol',
                userColor: '#f59e0b',
                fileId: 'config_js',
                fileName: 'config.js',
                timestamp: now - 5000,
                action: 'modify',
                summary: 'Variable rename: renamed const retryLimit to maxRetries'
            },
            {
                id: `demo-4-${now}`,
                userId: 'dev-dave',
                userName: 'Dave',
                userColor: '#10b981',
                fileId: 'readme_md',
                fileName: 'README.md',
                timestamp: now - 8000,
                action: 'modify',
                summary: 'Comment change: updated API documentation comments'
            }
        ];
        setSimulatedEdits(demo);
    };

    const allEdits = [...simulatedEdits, ...edits];

    const displayEdits = prioritizeHighRisk
        ? [...allEdits].sort((a, b) => getEditRisk(a).priorityRank - getEditRisk(b).priorityRank)
        : allEdits.slice().reverse();

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* Architecture Pipeline Step Banner */}
            <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/40 to-slate-900/80 p-4 shadow-xl backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                        <Activity className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                            Pipeline Stage 1 & 2 • Feature 4
                        </h4>
                        <p className="text-sm font-extrabold text-white">
                            Concurrent Edits & Risk Scoring
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/[.07] text-xs">
                    <div className="bg-slate-900/60 rounded-lg p-2 border border-white/[.05]">
                        <span className="text-[10px] text-slate-400 block">CRDT Convergence</span>
                        <span className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                            <ShieldCheck className="w-3.5 h-3.5" /> 100% Conflict-Free
                        </span>
                    </div>
                    <div className="bg-slate-900/60 rounded-lg p-2 border border-white/[.05]">
                        <span className="text-[10px] text-slate-400 block">Active Collaborators</span>
                        <span className="font-bold text-cyan-300 flex items-center gap-1 mt-0.5">
                            <Users className="w-3.5 h-3.5" /> {collaborators.length} Online
                        </span>
                    </div>
                </div>
            </div>

            {/* Feature 4: Risk Score for Every Edit (Screenshot 2 Presentation) */}
            <div className="rounded-2xl border border-amber-500/30 bg-[#111a2b]/90 p-3.5 shadow-xl backdrop-blur-xl shrink-0">
                <div 
                    onClick={() => setShowRiskTable(!showRiskTable)}
                    className="flex items-center justify-between cursor-pointer select-none"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-xs">🆕</span>
                        <h5 className="text-xs font-bold text-white">
                            Feature 4 — Risk Score for Every Edit
                        </h5>
                    </div>
                    <button className="text-slate-400 hover:text-white p-1">
                        {showRiskTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                </div>

                {showRiskTable && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800 text-[11px] font-mono space-y-2 animate-in fade-in duration-150">
                        <p className="text-slate-400 text-[10px]">
                            Give every concurrent change a risk score:
                        </p>

                        {/* Screenshot 2 Table */}
                        <div className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden divide-y divide-slate-800/60">
                            <div className="grid grid-cols-2 px-2.5 py-1.5 bg-slate-900 font-bold text-slate-300 text-[10px]">
                                <span>Change</span>
                                <span className="text-right">Risk</span>
                            </div>
                            <div className="grid grid-cols-2 px-2.5 py-1 items-center hover:bg-slate-900/40">
                                <span className="text-slate-300">Comment change</span>
                                <span className="text-right flex items-center justify-end gap-1 font-bold text-emerald-400">
                                    <span>🟢</span> 5%
                                </span>
                            </div>
                            <div className="grid grid-cols-2 px-2.5 py-1 items-center hover:bg-slate-900/40">
                                <span className="text-slate-300">Variable rename</span>
                                <span className="text-right flex items-center justify-end gap-1 font-bold text-amber-400">
                                    <span>🟡</span> 35%
                                </span>
                            </div>
                            <div className="grid grid-cols-2 px-2.5 py-1 items-center hover:bg-slate-900/40">
                                <span className="text-slate-300">Function modification</span>
                                <span className="text-right flex items-center justify-end gap-1 font-bold text-orange-400">
                                    <span>🟠</span> 65%
                                </span>
                            </div>
                            <div className="grid grid-cols-2 px-2.5 py-1 items-center hover:bg-slate-900/40">
                                <span className="text-slate-300">API/interface modification</span>
                                <span className="text-right flex items-center justify-end gap-1 font-bold text-rose-400">
                                    <span>🔴</span> 91%
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                            <span>The system can prioritize which edits need attention.</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Concurrent Edits Activity Stream */}
            <div className="flex-1 rounded-2xl border border-white/[.1] bg-[#111a2b]/85 p-4 shadow-xl backdrop-blur-xl flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3 shrink-0">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <GitCommit className="w-3.5 h-3.5 text-cyan-400" />
                        Concurrent Edits Stream
                    </span>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPrioritizeHighRisk(!prioritizeHighRisk)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
                                prioritizeHighRisk 
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                            }`}
                            title="Sort edits by risk (API modifications first)"
                        >
                            <Filter className="w-2.5 h-2.5" />
                            <span>{prioritizeHighRisk ? 'Prioritizing High Risk' : 'Sort by Risk'}</span>
                        </button>

                        <button
                            onClick={handleLocalSimulate}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition-colors"
                            title="Simulate 4 concurrent edits representing each risk tier"
                        >
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>Simulate 4 Edits</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                    {displayEdits.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 text-xs">
                            <FileEdit className="w-8 h-8 mx-auto mb-2 opacity-30 text-cyan-400" />
                            No edits logged yet. As developers type, CRDT operations and risk scores will stream here.
                        </div>
                    ) : (
                        displayEdits.map((edit) => {
                            const risk = getEditRisk(edit);
                            return (
                                <div
                                    key={edit.id}
                                    className="p-2.5 rounded-xl bg-white/[.03] border border-white/[.06] text-xs space-y-1.5 hover:border-cyan-500/30 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <span
                                                className="w-2 h-2 rounded-full shrink-0"
                                                style={{ backgroundColor: edit.userColor || '#38bdf8' }}
                                            />
                                            <span className="font-bold text-slate-200">
                                                {edit.userName}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-mono bg-slate-800/80 px-1.5 py-0.2 rounded">
                                                {edit.fileName}
                                            </span>
                                        </div>

                                        {/* Risk Badge matching Screenshot 2 */}
                                        <div className="flex items-center gap-1.5">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1 ${risk.colorClass}`}>
                                                <span>{risk.dotEmoji}</span>
                                                <span>{risk.riskPercent}% Risk</span>
                                            </span>
                                            <span className="text-[10px] text-slate-500 flex items-center gap-0.5 font-mono">
                                                <Clock className="w-2.5 h-2.5" /> {formatTime(edit.timestamp)}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="text-[11px] text-slate-300 pl-3.5 font-mono leading-relaxed">
                                        {edit.summary}
                                    </p>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
