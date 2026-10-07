import { Code2, Play, Loader2, PenTool, Layout, Circle, Share2, Check, Users, ShieldCheck, Zap, Network, FlaskConical, Box, Sparkles, LayoutDashboard, Lightbulb, LogOut, ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"
import { LanguageDropdown } from "./LanguageDropDown"
import { Button } from "./ui/button"

interface CodeEditorHeaderProps {
  language: string
  onLanguageChange: (language: string) => void
  onSubmit: () => void
  isLoading: boolean
  currentButtonState: string
  activeView: 'editor' | 'whiteboard'
  onViewChange: (view: 'editor' | 'whiteboard') => void
  onInvite: () => void
  inviteCopied: boolean
  connectedUsersCount: number
  crdtSynced?: boolean
  activeFileName?: string
  conflictsCount?: number
  onOpenConflicts?: () => void
  onSimulateProactive?: () => void
  indirectConflictsCount?: number
  onOpenDependencies?: () => void
  onSimulateIndirect?: () => void
  onOpenValidationPipeline?: () => void
  onOpenDockerSandbox?: () => void
  onOpenConfidenceAndRisk?: () => void
  onOpenAIExplanation?: () => void
  onBack?: () => void
}

export const CodeEditorHeader = ({
  language,
  onLanguageChange,
  onSubmit,
  isLoading,
  currentButtonState,
  activeView,
  onViewChange,
  onInvite,
  inviteCopied,
  connectedUsersCount,
  crdtSynced = true,
  activeFileName,
  conflictsCount = 0,
  onOpenConflicts,
  onSimulateProactive,
  indirectConflictsCount = 0,
  onOpenDependencies,
  onSimulateIndirect,
  onOpenValidationPipeline,
  onOpenDockerSandbox,
  onOpenConfidenceAndRisk,
  onOpenAIExplanation,
  onBack,
}: CodeEditorHeaderProps) => {
  return (
    <div
      className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:flex-row xl:items-center sm:px-5 flex-wrap"
      style={{ position: "relative", zIndex: 10 }}
    >
      <div className="flex items-center justify-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-[#3b49df] to-[#2532a8] p-2.5 shadow-md shadow-blue-500/20">
          <Code2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight text-slate-900">CoScripta</span>
            {activeFileName && (
              <span className="text-xs font-mono text-[#3b49df] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                {activeFileName}
              </span>
            )}
            {conflictsCount > 0 ? (
              <button
                onClick={onOpenConflicts}
                className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md hover:bg-amber-100 transition-colors animate-pulse"
                title="Click to view semantic conflicts"
              >
                <span>⚠️ {conflictsCount} Semantic Conflict{conflictsCount > 1 ? 's' : ''}</span>
              </button>
            ) : null}
            {indirectConflictsCount > 0 ? (
              <button
                onClick={onOpenDependencies}
                className="flex items-center gap-1 text-[11px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-md hover:bg-cyan-100 transition-colors animate-pulse"
                title="Click to view dependency-aware indirect conflicts"
              >
                <span>🔗 {indirectConflictsCount} Indirect Conflict{indirectConflictsCount > 1 ? 's' : ''}</span>
              </button>
            ) : null}
            {conflictsCount === 0 && indirectConflictsCount === 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                ✓ AST & Deps Clean
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
            <span className="flex items-center gap-1">
              <Circle size={7} fill="currentColor" /> Centralized Workspace
            </span>
            {crdtSynced && (
              <span className="text-blue-600 font-mono font-semibold flex items-center gap-1 border-l border-slate-200 pl-2">
                <ShieldCheck className="w-3 h-3 text-blue-600" /> CRDT 100% Converged
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto flex shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-1 sm:mx-4 shadow-inner">
        <button
          onClick={() => onViewChange('editor')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all duration-200 ${activeView === 'editor' ? 'bg-white text-[#3b49df] shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'}`}
        >
          <Layout size={16} />
          Editor
        </button>
        <button
          onClick={() => onViewChange('whiteboard')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all duration-200 ${activeView === 'whiteboard' ? 'bg-white text-[#3b49df] shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'}`}
        >
          <PenTool size={16} />
          Whiteboard
        </button>
      </div>

      <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-row items-center justify-start sm:justify-end">
        {onBack && (
          <Button
            onClick={onBack}
            type="button"
            variant="outline"
            className="h-10 rounded-xl border-slate-200 bg-white px-3.5 font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm flex items-center gap-1.5"
            title="Go Back"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden xl:inline">Back</span>
          </Button>
        )}

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 mx-1 shadow-inner">
          <Users size={16} className="text-[#3b49df]" />
          <span>{connectedUsersCount}</span>
        </div>

        {activeView === 'editor' && (
          <LanguageDropdown value={language} onChange={onLanguageChange} />
        )}

        <Button
          onClick={onInvite}
          type="button"
          variant="outline"
          className="h-10 rounded-xl border-slate-200 bg-white px-4 font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-[#3b49df] shadow-sm"
        >
          {inviteCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4" />}
          {inviteCopied ? "Link copied" : "Invite"}
        </Button>

        {onSimulateProactive && (
          <Button
            onClick={onSimulateProactive}
            type="button"
            variant="outline"
            className="h-10 rounded-xl border-amber-200 bg-amber-50 px-3.5 font-bold text-amber-700 hover:bg-amber-100 hover:text-amber-800 transition shadow-sm flex items-center gap-1.5"
            title="Run Semantic Conflict Analysis on your current codebase"
          >
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="hidden xl:inline">Analyze Semantics</span>
          </Button>
        )}

        {onSimulateIndirect && (
          <Button
            onClick={onSimulateIndirect}
            type="button"
            variant="outline"
            className="h-10 rounded-xl border-cyan-200 bg-cyan-50 px-3.5 font-bold text-cyan-700 hover:bg-cyan-100 hover:text-cyan-800 transition shadow-sm flex items-center gap-1.5"
            title="Run Dependency Analysis & Generate AI Solutions on your codebase"
          >
            <Network className="h-4 w-4 text-cyan-500" />
            <span className="hidden xl:inline">Analyze Dependencies</span>
          </Button>
        )}

        {onOpenValidationPipeline && (
          <Button
            onClick={onOpenValidationPipeline}
            type="button"
            variant="outline"
            className="h-10 rounded-xl border-emerald-200 bg-emerald-50 px-3.5 font-bold text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 transition shadow-sm flex items-center gap-1.5"
            title="AI Multiple Solutions & 17 Unit Tests Validation Suite (Feature 7)"
          >
            <FlaskConical className="h-4 w-4 text-emerald-500" />
            <span className="hidden xl:inline">AI Solutions (17 Tests)</span>
          </Button>
        )}

        {onOpenDockerSandbox && (
          <Button
            onClick={onOpenDockerSandbox}
            type="button"
            variant="outline"
            className="h-10 rounded-xl border-sky-200 bg-sky-50 px-3.5 font-bold text-sky-700 hover:bg-sky-100 hover:text-sky-800 transition shadow-sm flex items-center gap-1.5"
            title="Docker Sandbox 4-Check Validation & Rollback (Feature 8)"
          >
            <Box className="h-4 w-4 text-sky-500" />
            <span className="hidden xl:inline">Docker Sandbox</span>
          </Button>
        )}

        {onOpenConfidenceAndRisk && (
          <Button
            onClick={onOpenConfidenceAndRisk}
            type="button"
            variant="outline"
            className="h-10 rounded-xl border-violet-200 bg-violet-50 px-3.5 font-bold text-violet-700 hover:bg-violet-100 hover:text-violet-800 transition shadow-sm flex items-center gap-1.5"
            title="Confidence Scores & Risk Scoring Matrix (Feature 9)"
          >
            <Sparkles className="h-4 w-4 text-violet-500" />
            <span className="hidden xl:inline">Confidence & Risk (Feature 9)</span>
          </Button>
        )}

        {onOpenAIExplanation && (
          <Button
            onClick={onOpenAIExplanation}
            type="button"
            variant="outline"
            className="h-10 rounded-xl border-amber-300 bg-amber-50 px-3.5 font-bold text-amber-700 hover:bg-amber-100 hover:text-amber-800 transition shadow-sm flex items-center gap-1.5"
            title="AI Conflict Explanation (CONFLICT #24) — calculateSalary interface mismatch"
          >
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <span className="hidden xl:inline">AI Explanation (#24)</span>
          </Button>
        )}

        <Link
          to="/dashboard"
          className="h-10 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 font-bold text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 transition shadow-sm flex items-center gap-1.5 text-xs inline-flex"
          title="Open Conflict Monitoring Dashboard (Feature 10)"
          target="_blank"
          rel="noopener noreferrer"
        >
          <LayoutDashboard className="h-4 w-4 text-indigo-500" />
          <span className="hidden xl:inline">Dashboard</span>
        </Link>

        <Button
          onClick={onSubmit}
          disabled={isLoading}
          type="button"
          className={`
            h-10 rounded-xl px-5 font-extrabold transition-all duration-300 transform
            ${isLoading
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-gradient-to-r from-[#3b49df] to-[#2532a8] text-white hover:from-blue-600 hover:to-indigo-700 hover:-translate-y-0.5 shadow-md hover:shadow-lg"
            }
            flex items-center gap-2
          `}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          <span>{currentButtonState}</span>
        </Button>
      </div>
    </div>
  )
}
