import React, { useState, useEffect } from 'react';
import { 
    LayoutDashboard, 
    FolderKanban, 
    Activity as ActivityIcon, 
    Zap, 
    History, 
    Users, 
    Settings, 
    Search, 
    Bell, 
    Sun, 
    Plus, 
    Folder, 
    GitBranch, 
    CheckCircle2, 
    Hourglass, 
    Sparkles, 
    ShieldCheck, 
    MoreVertical, 
    ArrowRight, 
    Code2, 
    Edit2, 
    MessageSquare, 
    Layers, 
    ExternalLink, 
    TrendingUp, 
    Gauge, 
    Check, 
    X,
    Filter
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { userAtom } from '../atoms/userAtom';
import { FullDashboardData } from '../types/dashboard';
import { AIConflictExplanationModal } from '../components/AIConflictExplanationModal';

export const ConflictDashboard: React.FC = () => {
    const navigate = useNavigate();
    const activeUser = useRecoilValue(userAtom);
    const displayName = activeUser?.name?.trim() ? activeUser.name : "Developer";

    const [activeNav, setActiveNav] = useState<'dashboard' | 'projects' | 'activity' | 'conflicts' | 'versions' | 'team' | 'settings'>('dashboard');
    const [viewMode, setViewMode] = useState<'overview' | 'ai_metrics'>('overview');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState<boolean>(false);
    const [newProjectName, setNewProjectName] = useState<string>('');
    const [dashboardData, setDashboardData] = useState<FullDashboardData | null>(null);
    const [isGeminiModalOpen, setIsGeminiModalOpen] = useState<boolean>(false);
    const [isConflict24ModalOpen, setIsConflict24ModalOpen] = useState<boolean>(false);

    // Initial load from backend or defaults matching CodeSync architecture
    useEffect(() => {
        const fetchMetrics = async () => {
            const backendUrl = import.meta.env.VITE_PRIMARY_BACKEND_URL || `http://${window.location.hostname}:3000`;
            try {
                const res = await fetch(`${backendUrl}/api/dashboard/metrics`);
                const json = await res.json();
                if (json.success && json.data) {
                    setDashboardData(json.data);
                    return;
                }
            } catch (e) {
                // fallback to static state
            }

            // Defaults matching CodeSync platform
            setDashboardData({
                user: {
                    name: displayName,
                    role: "Lead Engineer",
                    avatarText: displayName.charAt(0).toUpperCase() || "D",
                    greeting: `Welcome back, ${displayName}! 👋`
                },
                topStats: {
                    myProjects: 4,
                    activeUsers: 7,
                    pendingConflicts: 3,
                    recentVersions: 12
                },
                projects: [
                    {
                        id: "codesync-core",
                        name: "CodeSync Core",
                        description: "Real-time CRDT & WebRTC collaboration engine",
                        membersCount: 4,
                        memberAvatars: ["A", "D", "K", "S"],
                        lastModified: "10 mins ago",
                        status: "Active",
                        roomId: "codesync-core"
                    },
                    {
                        id: "ast-semantic-engine",
                        name: "AST Semantic Engine",
                        description: "Structural AST parser & AI conflict detector",
                        membersCount: 3,
                        memberAvatars: ["E", "M", "R"],
                        lastModified: "32 mins ago",
                        status: "Active",
                        roomId: "ast-engine"
                    },
                    {
                        id: "docker-sandbox-suite",
                        name: "Docker Sandbox Suite",
                        description: "Isolated multi-test execution runner",
                        membersCount: 2,
                        memberAvatars: ["T", "V"],
                        lastModified: "2 hours ago",
                        status: "Active",
                        roomId: "docker-sandbox"
                    },
                    {
                        id: "distributed-crdt",
                        name: "Distributed CRDT",
                        description: "Centralized Redis state persistence & pub/sub",
                        membersCount: 3,
                        memberAvatars: ["N", "P", "Y"],
                        lastModified: "1 day ago",
                        status: "Active",
                        roomId: "distributed-crdt"
                    }
                ],
                recentActivity: [
                    {
                        id: "act-1",
                        iconType: "edit",
                        text: "Collaborator edited userService.ts in CodeSync Core",
                        highlightProject: "CodeSync Core",
                        timestampText: "10 minutes ago",
                        timestamp: Date.now() - 10 * 60 * 1000
                    },
                    {
                        id: "act-2",
                        iconType: "conflict",
                        text: "Semantic conflict #24 detected in calculateSalary()",
                        highlightProject: "AST Semantic Engine",
                        timestampText: "32 minutes ago",
                        timestamp: Date.now() - 32 * 60 * 1000
                    },
                    {
                        id: "act-3",
                        iconType: "join",
                        text: "Team member joined room 'codesync-core' via WebRTC",
                        highlightProject: "CodeSync Core",
                        timestampText: "1 hour ago",
                        timestamp: Date.now() - 60 * 60 * 1000
                    },
                    {
                        id: "act-4",
                        iconType: "version",
                        text: "CRDT snapshot v1.4 converged across all peers",
                        highlightProject: "Distributed CRDT",
                        timestampText: "2 hours ago",
                        timestamp: Date.now() - 2 * 60 * 60 * 1000
                    },
                    {
                        id: "act-5",
                        iconType: "comment",
                        text: "Review comment posted on AST type inference rules",
                        highlightProject: "AST Semantic Engine",
                        timestampText: "3 hours ago",
                        timestamp: Date.now() - 3 * 60 * 60 * 1000
                    },
                    {
                        id: "act-6",
                        iconType: "resolved",
                        text: "AI Suggestion applied with 94% confidence (17/17 tests passing)",
                        highlightProject: "CodeSync Core",
                        timestampText: "5 hours ago",
                        timestamp: Date.now() - 5 * 60 * 60 * 1000
                    }
                ],
                conflictOverview: {
                    detected: 8,
                    resolved: 5,
                    pending: 3,
                    aiSuggestions: 4,
                    validationPassed: 6
                },
                aiMetrics: {
                    resolutionSuccessRate: 83.3,
                    overallResolutionRate: 62.5,
                    lineCoverageAvg: 94.6,
                    branchCoverageAvg: 92.5,
                    aiEffectivenessScore: 92,
                    averageResolutionTimeSeconds: 24,
                    regressionsPrevented: 18,
                    categoryBreakdown: [
                        { category: "Type Mismatches", detected: 3, aiResolved: 3, successRate: 100.0 },
                        { category: "Interface Signatures", detected: 2, aiResolved: 2, successRate: 100.0 },
                        { category: "Dependency Breaks", detected: 2, aiResolved: 1, successRate: 50.0 },
                        { category: "Duplicate Declarations", detected: 1, aiResolved: 1, successRate: 100.0 }
                    ]
                },
                serverStatus: {
                    online: true,
                    message: "All systems operational",
                    uptimeSeconds: 3600
                }
            });
        };

        fetchMetrics();
    }, []);

    if (!dashboardData) {
        return (
            <div className="min-h-screen bg-[#f3f4f9] flex items-center justify-center font-sans">
                <div className="flex items-center gap-3 text-cyan-600 font-bold">
                    <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    <span>Loading CodeSync Dashboard...</span>
                </div>
            </div>
        );
    }

    const filteredProjects = dashboardData.projects.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleOpenProject = (roomId: string) => {
        navigate(`/code/${roomId}`);
    };

    return (
        <div className="min-h-screen bg-[#f3f5fa] flex font-sans text-slate-800">
            
            {/* ============================================================== */}
            {/* LEFT SIDEBAR                                                   */}
            {/* ============================================================== */}
            <aside className="w-64 bg-[#0e1326] text-slate-300 flex flex-col justify-between p-5 shrink-0 hidden md:flex border-r border-white/[.06]">
                <div className="space-y-8">
                    {/* Brand Logo */}
                    <div className="flex items-center gap-3 px-2">
                        <div className="rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 p-2 shadow-lg shadow-cyan-950/40">
                            <Code2 className="w-5 h-5 text-slate-950" />
                        </div>
                        <div>
                            <span className="text-xl font-black tracking-tight text-white block leading-none">
                                CodeSync
                            </span>
                            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block mt-1">
                                Conflict Engine
                            </span>
                        </div>
                    </div>

                    {/* Nav Menu */}
                    <nav className="space-y-1.5">
                        <button
                            onClick={() => { setActiveNav('dashboard'); setViewMode('overview'); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                                activeNav === 'dashboard' && viewMode === 'overview'
                                    ? 'bg-[#3b49df] text-white shadow-lg shadow-indigo-500/25'
                                    : 'text-slate-400 hover:text-white hover:bg-white/[.05]'
                            }`}
                        >
                            <LayoutDashboard className="w-5 h-5" />
                            <span>Dashboard</span>
                        </button>

                        <button
                            onClick={() => setActiveNav('projects')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                                activeNav === 'projects'
                                    ? 'bg-[#3b49df] text-white shadow-lg shadow-indigo-500/25'
                                    : 'text-slate-400 hover:text-white hover:bg-white/[.05]'
                            }`}
                        >
                            <FolderKanban className="w-5 h-5" />
                            <span>Workspaces</span>
                        </button>

                        <button
                            onClick={() => setActiveNav('activity')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                                activeNav === 'activity'
                                    ? 'bg-[#3b49df] text-white shadow-lg shadow-indigo-500/25'
                                    : 'text-slate-400 hover:text-white hover:bg-white/[.05]'
                            }`}
                        >
                            <ActivityIcon className="w-5 h-5" />
                            <span>Live Activity</span>
                        </button>

                        <button
                            onClick={() => { setActiveNav('conflicts'); setViewMode('ai_metrics'); }}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                                (activeNav === 'conflicts' || viewMode === 'ai_metrics')
                                    ? 'bg-[#3b49df] text-white shadow-lg shadow-indigo-500/25'
                                    : 'text-slate-400 hover:text-white hover:bg-white/[.05]'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <Zap className="w-5 h-5" />
                                <span>Semantic Conflicts</span>
                            </div>
                            <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-black flex items-center justify-center">
                                3
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveNav('versions')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                                activeNav === 'versions'
                                    ? 'bg-[#3b49df] text-white shadow-lg shadow-indigo-500/25'
                                    : 'text-slate-400 hover:text-white hover:bg-white/[.05]'
                            }`}
                        >
                            <History className="w-5 h-5" />
                            <span>CRDT Snapshots</span>
                        </button>

                        <button
                            onClick={() => setActiveNav('team')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                                activeNav === 'team'
                                    ? 'bg-[#3b49df] text-white shadow-lg shadow-indigo-500/25'
                                    : 'text-slate-400 hover:text-white hover:bg-white/[.05]'
                            }`}
                        >
                            <Users className="w-5 h-5" />
                            <span>Collaborators</span>
                        </button>

                        <button
                            onClick={() => setActiveNav('settings')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                                activeNav === 'settings'
                                    ? 'bg-[#3b49df] text-white shadow-lg shadow-indigo-500/25'
                                    : 'text-slate-400 hover:text-white hover:bg-white/[.05]'
                            }`}
                        >
                            <Settings className="w-5 h-5" />
                            <span>Settings</span>
                        </button>
                    </nav>
                </div>

                {/* Bottom Status Indicator (Matching Image 1 bottom-left) */}
                <div className="rounded-2xl bg-white/[.04] p-3.5 border border-white/[.06]">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold text-white">Server Online</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                        All systems operational
                    </p>
                </div>
            </aside>

            {/* ============================================================== */}
            {/* MAIN CONTENT AREA                                              */}
            {/* ============================================================== */}
            <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                
                {/* Top Header Bar (Matching Image 1) */}
                <header className="h-18 bg-white border-b border-slate-200/80 px-6 sm:px-8 flex items-center justify-between shrink-0">
                    {/* Search Bar */}
                    <div className="relative w-full max-w-md">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search projects, files, or users..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100/80 border border-slate-200/60 text-xs sm:text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                        />
                    </div>

                    {/* Right Controls */}
                    <div className="flex items-center gap-4">
                        {/* Tab Switcher: Overview vs AI Conflict Metrics */}
                        <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                            <button
                                onClick={() => setViewMode('overview')}
                                className={`px-3 py-1.5 rounded-lg transition-all ${
                                    viewMode === 'overview'
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                Workspace Overview
                            </button>
                            <button
                                onClick={() => setViewMode('ai_metrics')}
                                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                                    viewMode === 'ai_metrics'
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                                <span>AI Conflict Metrics</span>
                            </button>
                        </div>

                        {/* Notification Bell */}
                        <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
                        </button>

                        {/* Theme Toggle */}
                        <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
                            <Sun className="w-5 h-5" />
                        </button>

                        {/* User Profile */}
                        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 font-black flex items-center justify-center text-sm shadow-sm">
                                {dashboardData.user.avatarText}
                            </div>
                            <div className="hidden sm:block text-left leading-tight">
                                <span className="block text-xs font-bold text-slate-800">
                                    {dashboardData.user.name}
                                </span>
                                <span className="block text-[11px] text-slate-400">
                                    {dashboardData.user.role}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dashboard Scrollable Body */}
                <div className="p-6 sm:p-8 space-y-6">

                    {/* Welcome Banner + New Workspace Button */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                {dashboardData.user.greeting}
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                Real-time overview of workspace health, AST conflict prevention, and CRDT synchronization.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsNewProjectModalOpen(true)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-cyan-900/20 transition-all transform active:scale-95"
                            >
                                <Plus className="w-4 h-4" />
                                <span>New Workspace</span>
                            </button>
                        </div>
                    </div>

                    {/* Top 4 Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                        {/* Card 1: Active Workspaces */}
                        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-sky-50 text-sky-600">
                                <Folder className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-slate-400">Active Workspaces</span>
                                <span className="block text-2xl font-black text-slate-900 leading-tight">
                                    {dashboardData.topStats.myProjects}
                                </span>
                                <span className="block text-[11px] text-slate-400 mt-0.5">Total workspaces</span>
                            </div>
                        </div>

                        {/* Card 2: Connected Peers */}
                        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-slate-400">Connected Peers</span>
                                <span className="block text-2xl font-black text-slate-900 leading-tight">
                                    {dashboardData.topStats.activeUsers}
                                </span>
                                <span className="block text-[11px] text-slate-400 mt-0.5">Currently online</span>
                            </div>
                        </div>

                        {/* Card 3: Semantic Conflicts */}
                        <div className="p-5 rounded-2xl bg-white border border-rose-100 shadow-sm flex items-center gap-4 bg-gradient-to-br from-white to-rose-50/20">
                            <div className="p-3 rounded-2xl bg-rose-50 text-rose-500">
                                <Zap className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-slate-400">Semantic Conflicts</span>
                                <span className="block text-2xl font-black text-slate-900 leading-tight">
                                    {dashboardData.topStats.pendingConflicts}
                                </span>
                                <span className="block text-[11px] text-rose-500 font-semibold mt-0.5">Need your attention</span>
                            </div>
                        </div>

                        {/* Card 4: CRDT Versions */}
                        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-purple-50 text-purple-600">
                                <GitBranch className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-slate-400">CRDT Versions</span>
                                <span className="block text-2xl font-black text-slate-900 leading-tight">
                                    {dashboardData.topStats.recentVersions}
                                </span>
                                <span className="block text-[11px] text-slate-400 mt-0.5">Synchronized snapshots</span>
                            </div>
                        </div>
                    </div>

                    {/* ============================================================== */}
                    {/* VIEW MODE: IMAGE 2 (Conflict Metrics & AI Effectiveness)       */}
                    {/* ============================================================== */}
                    {viewMode === 'ai_metrics' && (
                        <div className="rounded-3xl border-2 border-indigo-500/30 bg-white p-6 sm:p-7 shadow-xl space-y-6 animate-in fade-in duration-200">
                            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-base font-black text-indigo-600">8.</span>
                                        <h3 className="text-xl font-black text-slate-900">
                                            Conflict Metrics Dashboard
                                        </h3>
                                    </div>
                                    <ul className="text-xs text-slate-600 mt-2 space-y-1 list-disc list-inside">
                                        <li>Displays conflict statistics, resolution success rates, and coverage information.</li>
                                        <li>Helps measure how effectively the AI is resolving conflicts.</li>
                                    </ul>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-700 text-center">
                                        <span className="block text-2xl font-black">{dashboardData.aiMetrics.aiEffectivenessScore}%</span>
                                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">AI Effectiveness</span>
                                    </div>
                                </div>
                            </div>

                            {/* Key Metrics Cards matching Image 2 Bullets */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                                    <span className="block text-xs font-bold text-slate-500">Resolution Success Rate</span>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className="text-2xl font-black text-emerald-600">{dashboardData.aiMetrics.resolutionSuccessRate}%</span>
                                        <span className="text-xs text-slate-400">({dashboardData.conflictOverview.resolved}/{dashboardData.conflictOverview.detected} resolved)</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-3">
                                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${dashboardData.aiMetrics.resolutionSuccessRate}%` }} />
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                                    <span className="block text-xs font-bold text-slate-500">Test Coverage Information</span>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className="text-2xl font-black text-indigo-600">{dashboardData.aiMetrics.lineCoverageAvg}%</span>
                                        <span className="text-xs text-slate-400">(Docker Sandbox Verified)</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-3">
                                        <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${dashboardData.aiMetrics.lineCoverageAvg}%` }} />
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                                    <span className="block text-xs font-bold text-slate-500">Regressions Prevented</span>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className="text-2xl font-black text-purple-600">{dashboardData.aiMetrics.regressionsPrevented}</span>
                                        <span className="text-xs text-slate-400">breaking caller bugs avoided</span>
                                    </div>
                                    <span className="block text-[11px] text-slate-400 mt-2">Avg resolution time: {dashboardData.aiMetrics.averageResolutionTimeSeconds}s</span>
                                </div>
                            </div>

                            {/* Category Breakdown Table */}
                            <div className="rounded-2xl border border-slate-200 overflow-hidden">
                                <div className="bg-slate-50 p-3 text-xs font-bold text-slate-600 grid grid-cols-4">
                                    <span>Conflict Category</span>
                                    <span className="text-center">Detected</span>
                                    <span className="text-center">AI Resolved</span>
                                    <span className="text-right">Success Rate</span>
                                </div>
                                <div className="divide-y divide-slate-100 text-xs font-medium">
                                    {dashboardData.aiMetrics.categoryBreakdown.map((cat, i) => (
                                        <div key={i} className="p-3 grid grid-cols-4 items-center hover:bg-slate-50/50">
                                            <span className="font-bold text-slate-800">{cat.category}</span>
                                            <span className="text-center text-slate-500">{cat.detected}</span>
                                            <span className="text-center text-emerald-600 font-bold">{cat.aiResolved}</span>
                                            <span className="text-right font-bold text-indigo-600">{cat.successRate}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ============================================================== */}
                    {/* MIDDLE SECTION: MY PROJECTS & RECENT ACTIVITY (Image 1)        */}
                    {/* ============================================================== */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Left / 2 Columns: Active Workspaces Table */}
                        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Folder className="w-5 h-5 text-cyan-600" />
                                    <h3 className="text-base font-bold text-slate-900">
                                        Active Workspaces
                                    </h3>
                                </div>
                                <button className="text-xs font-bold text-cyan-600 hover:text-cyan-800 flex items-center gap-1">
                                    <span>View All</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Workspaces Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                            <th className="pb-3">Workspace</th>
                                            <th className="pb-3 text-center">Collaborators</th>
                                            <th className="pb-3">Last Synced</th>
                                            <th className="pb-3">CRDT Status</th>
                                            <th className="pb-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredProjects.map((p) => (
                                            <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                                                {/* Project Name & Icon */}
                                                <td className="py-3.5 pr-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                                                            p.id === 'codesync-core' ? 'bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 shadow-sm' :
                                                            p.id === 'ast-semantic-engine' ? 'bg-indigo-600 text-white' :
                                                            p.id === 'docker-sandbox-suite' ? 'bg-sky-600 text-white' :
                                                            'bg-purple-600 text-white'
                                                        }`}>
                                                            {p.id === 'codesync-core' ? <Code2 className="w-4 h-4" /> :
                                                             p.id === 'ast-semantic-engine' ? <Layers className="w-4 h-4" /> :
                                                             p.id === 'docker-sandbox-suite' ? <ShieldCheck className="w-4 h-4" /> :
                                                             <GitBranch className="w-4 h-4" />}
                                                        </div>
                                                        <div>
                                                            <span className="block font-bold text-slate-900 text-sm">
                                                                {p.name}
                                                            </span>
                                                            <span className="block text-[11px] text-slate-400">
                                                                {p.description}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Members Avatars */}
                                                <td className="py-3.5 text-center">
                                                    <div className="flex items-center justify-center -space-x-1.5">
                                                        {p.memberAvatars.map((m, idx) => (
                                                            <div 
                                                                key={idx}
                                                                className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white text-[10px] font-bold text-slate-700 flex items-center justify-center shadow-xs"
                                                            >
                                                                {m}
                                                            </div>
                                                        ))}
                                                        {p.membersCount > 2 && (
                                                            <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white text-[9px] font-bold text-slate-500 flex items-center justify-center">
                                                                +{p.membersCount - 1}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Last Modified */}
                                                <td className="py-3.5 text-slate-500 font-medium">
                                                    {p.lastModified}
                                                </td>

                                                {/* Status Badge */}
                                                <td className="py-3.5">
                                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                                        p.status === 'Active' 
                                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                                                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                                                    }`}>
                                                        {p.status}
                                                    </span>
                                                </td>

                                                {/* Action Button */}
                                                <td className="py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => handleOpenProject(p.roomId)}
                                                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs transition-all shadow-sm"
                                                        >
                                                            Open
                                                        </button>
                                                        <button className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Right / 1 Column: Recent Activity Stream (Matching Image 1) */}
                        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <ActivityIcon className="w-5 h-5 text-indigo-600" />
                                        <h3 className="text-base font-bold text-slate-900">
                                            Recent Activity
                                        </h3>
                                    </div>
                                    <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                                        <span>View All</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Activity List */}
                                <div className="space-y-3.5">
                                    {dashboardData.recentActivity.map((act) => (
                                        <div key={act.id} className="flex items-start gap-3 text-xs">
                                            <div className="mt-0.5 p-1.5 rounded-xl bg-slate-100 text-indigo-600 shrink-0">
                                                {act.iconType === 'edit' && <Edit2 className="w-3.5 h-3.5" />}
                                                {act.iconType === 'conflict' && <Zap className="w-3.5 h-3.5 text-rose-500" />}
                                                {act.iconType === 'join' && <Users className="w-3.5 h-3.5 text-emerald-500" />}
                                                {act.iconType === 'version' && <GitBranch className="w-3.5 h-3.5 text-purple-500" />}
                                                {act.iconType === 'comment' && <MessageSquare className="w-3.5 h-3.5 text-sky-500" />}
                                                {act.iconType === 'resolved' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-slate-800 leading-snug">
                                                    {act.text}
                                                </p>
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    {act.timestampText}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ============================================================== */}
                    {/* BOTTOM SECTION: CONFLICT OVERVIEW & GEMINI BANNER (Image 1)    */}
                    {/* ============================================================== */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Left / 2 Columns: Conflict & Resolution Overview */}
                        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-indigo-600" />
                                    <h3 className="text-base font-bold text-slate-900">
                                        Conflict & Resolution Overview
                                    </h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setIsConflict24ModalOpen(true)}
                                        className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/90 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                                        title="View AI Conflict Explanation (CONFLICT #24)"
                                    >
                                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                        <span>Conflict #24 Explanation</span>
                                    </button>
                                    <button 
                                        onClick={() => setViewMode('ai_metrics')}
                                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                    >
                                        <span>View Conflicts</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* 5 Mini-Cards (Matching Image 1 bottom-left) */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                {/* 1. Detected */}
                                <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 flex flex-col justify-between">
                                    <div className="flex items-center gap-1.5 text-rose-500 mb-2">
                                        <Zap className="w-4 h-4" />
                                        <span className="text-xs font-bold">Detected</span>
                                    </div>
                                    <div>
                                        <span className="text-2xl font-black text-slate-900 block leading-tight">
                                            {dashboardData.conflictOverview.detected}
                                        </span>
                                        <span className="text-[10px] text-slate-400">Total conflicts</span>
                                    </div>
                                </div>

                                {/* 2. Resolved */}
                                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between">
                                    <div className="flex items-center gap-1.5 text-emerald-600 mb-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span className="text-xs font-bold">Resolved</span>
                                    </div>
                                    <div>
                                        <span className="text-2xl font-black text-slate-900 block leading-tight">
                                            {dashboardData.conflictOverview.resolved}
                                        </span>
                                        <span className="text-[10px] text-slate-400">Successfully resolved</span>
                                    </div>
                                </div>

                                {/* 3. Pending */}
                                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100 flex flex-col justify-between">
                                    <div className="flex items-center gap-1.5 text-amber-500 mb-2">
                                        <Hourglass className="w-4 h-4" />
                                        <span className="text-xs font-bold">Pending</span>
                                    </div>
                                    <div>
                                        <span className="text-2xl font-black text-slate-900 block leading-tight">
                                            {dashboardData.conflictOverview.pending}
                                        </span>
                                        <span className="text-[10px] text-slate-400">Awaiting review</span>
                                    </div>
                                </div>

                                {/* 4. AI Suggestions */}
                                <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 flex flex-col justify-between">
                                    <div className="flex items-center gap-1.5 text-purple-600 mb-2">
                                        <Sparkles className="w-4 h-4" />
                                        <span className="text-xs font-bold">AI Suggestions</span>
                                    </div>
                                    <div>
                                        <span className="text-2xl font-black text-slate-900 block leading-tight">
                                            {dashboardData.conflictOverview.aiSuggestions}
                                        </span>
                                        <span className="text-[10px] text-slate-400">Generated by Gemini</span>
                                    </div>
                                </div>

                                {/* 5. Validation Passed */}
                                <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100 flex flex-col justify-between">
                                    <div className="flex items-center gap-1.5 text-sky-600 mb-2">
                                        <ShieldCheck className="w-4 h-4" />
                                        <span className="text-xs font-bold">Validation Passed</span>
                                    </div>
                                    <div>
                                        <span className="text-2xl font-black text-slate-900 block leading-tight">
                                            {dashboardData.conflictOverview.validationPassed}
                                        </span>
                                        <span className="text-[10px] text-slate-400">Ready to merge</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right / 1 Column: CodeSync AI Conflict Resolver */}
                        <div className="rounded-2xl bg-gradient-to-br from-indigo-50/80 via-purple-50/60 to-white border border-indigo-100 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
                            <div className="space-y-3">
                                <div className="w-12 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 flex items-center justify-center font-black shadow-md shadow-cyan-900/20">
                                    <Sparkles className="w-5 h-5 text-slate-950" />
                                </div>

                                <div>
                                    <h4 className="text-base font-bold text-slate-900">
                                        CodeSync AI Conflict Engine
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                        Get intelligent AST conflict resolution, type mismatch reasoning, and candidate sandbox validation powered by Google Gemini.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 flex items-center gap-2">
                                <button
                                    onClick={() => setIsConflict24ModalOpen(true)}
                                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                                >
                                    <span>Conflict #24</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => setIsGeminiModalOpen(true)}
                                    className="px-3.5 py-2 rounded-xl border border-indigo-200 bg-white text-indigo-600 hover:bg-indigo-50 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                                >
                                    <span>Learn More</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal: New Project creation */}
            {isNewProjectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-base font-bold text-slate-900">Create New Project</h4>
                            <button onClick={() => setIsNewProjectModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <input
                            type="text"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="Project Name (e.g. Cloud Sync)"
                            className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                        />
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setIsNewProjectModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700">
                                Cancel
                            </button>
                            <button 
                                onClick={() => {
                                    if (newProjectName) {
                                        navigate(`/code/${newProjectName.toLowerCase().replace(/\s+/g, '-')}`);
                                    }
                                }} 
                                className="px-4 py-2 text-xs font-bold bg-[#3b49df] text-white rounded-xl shadow-md"
                            >
                                Create & Open Editor
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Gemini AI Info */}
            {isGeminiModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-600" />
                                <h4 className="text-base font-bold text-slate-900">Google Gemini AI Conflict Resolver</h4>
                            </div>
                            <button onClick={() => setIsGeminiModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Google Gemini automatically inspects AST syntax discrepancies, calculates confidence scores (e.g. 96%), and tests proposed candidate patches in Docker sandboxes before asking developers for approval.
                        </p>
                        <div className="flex justify-end pt-2">
                            <button onClick={() => setIsGeminiModalOpen(false)} className="px-4 py-2 text-xs font-bold bg-[#3b49df] text-white rounded-xl">
                                Got It
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: AI Conflict Explanation (CONFLICT #24) */}
            <AIConflictExplanationModal
                isOpen={isConflict24ModalOpen}
                onClose={() => setIsConflict24ModalOpen(false)}
            />
        </div>
    );
};
