import React from 'react';
import { AlertTriangle, ArrowRight, ShieldAlert, Sparkles, X } from 'lucide-react';
import { ProactiveDivergence } from '../types/proactive';

interface ProactiveAlertBannerProps {
    divergence: ProactiveDivergence | null;
    onInspect: () => void;
    onDismiss?: () => void;
}

export const ProactiveAlertBanner: React.FC<ProactiveAlertBannerProps> = ({
    divergence,
    onInspect,
    onDismiss,
}) => {
    if (!divergence) return null;

    return (
        <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-amber-950/80 via-orange-950/70 to-slate-900 border-b border-amber-500/30 text-white select-none animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2.5 text-xs min-w-0">
                <span className="flex items-center justify-center p-1 rounded bg-amber-500/20 text-amber-400 shrink-0">
                    <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
                </span>
                <span className="font-extrabold text-amber-300 uppercase tracking-wider text-[10px] shrink-0">
                    Proactive Conflict Alert:
                </span>
                <span className="truncate text-slate-200 font-mono text-[11px]">
                    Concurrent divergence in <strong className="text-white bg-slate-800/80 px-1 rounded">{divergence.entityName}</strong>: {divergence.devA.name} ({divergence.devA.operation}) vs {divergence.devB.name} ({divergence.devB.operation})
                </span>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-3">
                <button
                    onClick={onInspect}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition-all hover:scale-105"
                >
                    <span>Inspect Divergence</span>
                    <ArrowRight className="w-3 h-3" />
                </button>
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                        title="Dismiss alert"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
};
