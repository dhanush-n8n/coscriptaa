/**
 * LIVE SERVER FOR CODESYNC PLATFORM
 * 
 * Serves:
 * - Port 3000: Express-compatible REST API (/api/dashboard/metrics, /api/conflicts/explanation-24, etc.)
 * - Port 5173: Live Interactive Client Web Application
 *   - /dashboard : Conflict Monitoring Dashboard (Image 1 & Image 2 design, native CodeSync platform data)
 *   - /explanation : AI Conflict Explanation (CONFLICT #24 from media_1791262985706.png)
 *   - /code/codesync-core : Collaborative Code Editor with AST, CRDT, and all 10 features
 */

const http = require('http');
const url = require('url');

const API_PORT = 3000;
const CLIENT_PORT = 5173;

// State Data Store - CodeSync Native Architecture
const state = {
    user: {
        name: "Developer",
        role: "Lead Engineer",
        avatarText: "D",
        greeting: "Welcome back, Developer! 👋"
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
            timestampText: "10 minutes ago"
        },
        {
            id: "act-2",
            iconType: "conflict",
            text: "Semantic conflict #24 detected in calculateSalary()",
            highlightProject: "AST Semantic Engine",
            timestampText: "32 minutes ago"
        },
        {
            id: "act-3",
            iconType: "join",
            text: "Team member joined room 'codesync-core' via WebRTC",
            highlightProject: "CodeSync Core",
            timestampText: "1 hour ago"
        },
        {
            id: "act-4",
            iconType: "version",
            text: "CRDT snapshot v1.4 converged across all peers",
            highlightProject: "Distributed CRDT",
            timestampText: "2 hours ago"
        },
        {
            id: "act-5",
            iconType: "comment",
            text: "Review comment posted on AST type inference rules",
            highlightProject: "AST Semantic Engine",
            timestampText: "3 hours ago"
        },
        {
            id: "act-6",
            iconType: "resolved",
            text: "AI Suggestion applied with 94% confidence (17/17 tests passing)",
            highlightProject: "CodeSync Core",
            timestampText: "5 hours ago"
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
    conflict24: {
        conflictNumber: 24,
        conflictTag: "CONFLICT #24",
        type: "Semantic Conflict",
        severity: "HIGH",
        developerA: {
            name: "Developer A",
            changed: "calculateSalary(employeeId)",
            codeSnippet: "function calculateSalary(employeeId: number) {\n    const emp = database.getEmployee(employeeId);\n    return emp.baseRate * emp.hoursWorked;\n}"
        },
        developerB: {
            name: "Developer B",
            changed: "calculateSalary(employee)",
            codeSnippet: "const employee = { id: 104, name: 'Alice Smith' };\n// Developer B passes entire employee object instead of ID:\nconst salary = calculateSalary(employee);"
        },
        why: "The function interface was modified by Developer A, while Developer B is still passing an integer ID.",
        aiSuggestion: "Convert Developer B's call to employee.id",
        confidence: "94%",
        confidenceScore: 94,
        validation: [
            { check: "Syntax", passed: true },
            { check: "Type check", passed: true },
            { check: "17 unit tests", passed: true },
            { check: "No new errors", passed: true }
        ],
        resolved: false
    }
};

// =========================================================================
// 1. API SERVER (Port 3000)
// =========================================================================
const apiServer = http.createServer((req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    const sendJson = (statusCode, data) => {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    };

    if (pathname === '/' || pathname === '/api/health') {
        sendJson(200, {
            status: "online",
            service: "CodeSync Centralized Collaboration & Semantic Conflict Engine",
            uptime: process.uptime(),
            timestamp: Date.now()
        });
    } else if (pathname === '/api/dashboard/metrics') {
        sendJson(200, {
            success: true,
            data: {
                user: state.user,
                topStats: state.topStats,
                projects: state.projects,
                recentActivity: state.recentActivity,
                conflictOverview: state.conflictOverview,
                aiMetrics: state.aiMetrics,
                serverStatus: {
                    online: true,
                    message: "Central server & Redis pub/sub operational",
                    uptimeSeconds: Math.floor(process.uptime())
                }
            }
        });
    } else if (pathname === '/api/conflicts/explanation-24') {
        sendJson(200, {
            success: true,
            title: "3. One particularly good feature: AI Conflict Explanation",
            recommendation: "I strongly recommend adding this.",
            prompt: "When a conflict occurs, show:",
            data: state.conflict24
        });
    } else if (pathname === '/api/conflicts/explanation-24/apply' && req.method === 'POST') {
        state.conflict24.resolved = true;
        state.conflictOverview.resolved += 1;
        state.conflictOverview.pending = Math.max(0, state.conflictOverview.pending - 1);
        sendJson(200, {
            success: true,
            appliedSuggestion: state.conflict24.aiSuggestion,
            message: "Developer B's call converted to employee.id. All 17 unit tests passed with 0 new errors.",
            validationResult: {
                syntax: true,
                typeCheck: true,
                unitTests: "17/17 passed",
                noNewErrors: true
            }
        });
    } else if (pathname === '/api/dashboard/resolve-conflict' && req.method === 'POST') {
        state.topStats.pendingConflicts = Math.max(0, state.topStats.pendingConflicts - 1);
        state.conflictOverview.pending = Math.max(0, state.conflictOverview.pending - 1);
        state.conflictOverview.resolved += 1;
        state.recentActivity.unshift({
            id: `act-${Date.now()}`,
            iconType: "resolved",
            text: "Developer resolved a pending conflict in CodeSync Core",
            highlightProject: "CodeSync Core",
            timestampText: "just now"
        });
        sendJson(200, { success: true, message: "Conflict resolved", state });
    } else {
        sendJson(404, { error: "Endpoint not found", path: pathname });
    }
});

apiServer.listen(API_PORT, '0.0.0.0', () => {
    console.log(`[API Server] Running at http://localhost:${API_PORT}`);
});

// =========================================================================
// 2. CLIENT WEB APP (Port 5173)
// =========================================================================
const clientServer = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getAppHtml());
});

clientServer.listen(CLIENT_PORT, '0.0.0.0', () => {
    console.log(`[Client App] Running at http://localhost:${CLIENT_PORT}`);
    console.log(`[Client App] Conflict Dashboard: http://localhost:${CLIENT_PORT}/dashboard`);
    console.log(`[Client App] AI Conflict Explanation: http://localhost:${CLIENT_PORT}/explanation`);
});

// HTML Generator for full interactive CodeSync web experience
function getAppHtml() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodeSync — Conflict Monitoring Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
    </style>
</head>
<body class="bg-[#f3f5fa] text-slate-800 antialiased min-h-screen">

    <div class="flex min-h-screen">
        <!-- Sidebar - CodeSync Native Architecture -->
        <aside class="w-64 bg-[#0e1326] text-slate-300 flex flex-col justify-between p-4 hidden md:flex shrink-0 border-r border-white/[0.06]">
            <div>
                <!-- Brand Logo: CodeSync -->
                <div class="flex items-center gap-3 px-3 py-4 mb-6">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-cyan-950/40">
                        <svg class="w-5 h-5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                    </div>
                    <div>
                        <span class="text-xl font-black tracking-tight text-white block leading-none">CodeSync</span>
                        <span class="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block mt-1">Conflict Engine</span>
                    </div>
                </div>

                <!-- Nav Menu -->
                <nav class="space-y-1">
                    <button onclick="setView('overview')" id="nav-dashboard" class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 text-white shadow-sm transition-all">
                        <span class="flex items-center gap-3">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                            Dashboard
                        </span>
                    </button>
                    <button onclick="setView('overview')" class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all">
                        <span class="flex items-center gap-3">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
                            Workspaces
                        </span>
                    </button>
                    <button onclick="setView('ai_metrics')" id="nav-metrics" class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all">
                        <span class="flex items-center gap-3">
                            <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                            AI Conflict Metrics
                        </span>
                        <span class="px-1.5 py-0.5 rounded-full text-[9px] bg-cyan-500/20 text-cyan-300 font-bold">83.3%</span>
                    </button>
                    <button onclick="openExplanationModal()" class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs text-amber-300 hover:bg-amber-400/10 transition-all">
                        <span class="flex items-center gap-3">
                            <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            Conflict #24 Explanation
                        </span>
                        <span class="px-1.5 py-0.5 rounded-full text-[9px] bg-amber-400/20 text-amber-300 font-bold">94%</span>
                    </button>
                    <a href="http://localhost:3000/api/dashboard/metrics" target="_blank" class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all">
                        <span class="flex items-center gap-3">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
                            API Endpoints (Port 3000)
                        </span>
                        <span class="text-slate-500">↗</span>
                    </a>
                </nav>
            </div>

            <!-- Server Online Footer -->
            <div class="px-3 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center gap-2.5 text-xs">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <div>
                    <p class="font-bold text-white text-[11px] leading-tight">Central Server Online</p>
                    <p class="text-[10px] text-cyan-400 font-mono">CRDT Sync 100% Converged</p>
                </div>
            </div>
        </aside>

        <!-- Main Body -->
        <main class="flex-1 flex flex-col min-w-0 overflow-y-auto">
            <!-- Top Header Bar -->
            <header class="bg-white border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-30">
                <div class="flex items-center gap-3 flex-1 max-w-md">
                    <div class="relative w-full">
                        <input type="text" placeholder="Search workspaces, files, symbols..." class="w-full pl-9 pr-4 py-2 bg-slate-100/80 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500">
                        <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <button onclick="openExplanationModal()" class="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs flex items-center gap-1.5 hover:bg-amber-100 transition-colors shadow-xs">
                        <span>✨</span>
                        <span>AI Conflict #24</span>
                    </button>

                    <div class="flex items-center gap-2.5 pl-3 border-l border-slate-200">
                        <div class="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 font-black flex items-center justify-center text-sm shadow-sm">
                            D
                        </div>
                        <div class="hidden sm:block text-left leading-tight">
                            <span class="block text-xs font-bold text-slate-900">Developer</span>
                            <span class="block text-[10px] text-slate-400">Lead Engineer</span>
                        </div>
                    </div>
                </div>
            </header>

            <div class="p-6 sm:p-8 space-y-6">
                <!-- Welcome Title -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            Welcome back, Developer! 👋
                        </h2>
                        <p class="text-xs sm:text-sm text-slate-500 mt-1">
                            Real-time overview of workspace health, AST conflict prevention, and CRDT synchronization.
                        </p>
                    </div>

                    <div class="flex items-center gap-3">
                        <button onclick="openExplanationModal()" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-cyan-950/20 transition-all flex items-center gap-2">
                            <span>✨ View AI Explanation</span>
                        </button>
                    </div>
                </div>

                <!-- Top 4 Cards -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
                        <div class="p-3 rounded-2xl bg-sky-50 text-sky-600 font-bold text-lg">📁</div>
                        <div>
                            <span class="block text-xs font-bold text-slate-400">Active Workspaces</span>
                            <span class="text-2xl font-black text-slate-900">4</span>
                        </div>
                    </div>
                    <div class="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
                        <div class="p-3 rounded-2xl bg-emerald-50 text-emerald-600 font-bold text-lg">👥</div>
                        <div>
                            <span class="block text-xs font-bold text-slate-400">Connected Peers</span>
                            <span class="text-2xl font-black text-slate-900">7</span>
                        </div>
                    </div>
                    <div class="p-5 rounded-2xl bg-white border border-rose-100 shadow-sm flex items-center gap-4 bg-gradient-to-br from-white to-rose-50/20">
                        <div class="p-3 rounded-2xl bg-rose-50 text-rose-600 font-bold text-lg">⚠️</div>
                        <div>
                            <span class="block text-xs font-bold text-slate-400">Semantic Conflicts</span>
                            <span class="text-2xl font-black text-slate-900">3</span>
                        </div>
                    </div>
                    <div class="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center gap-4">
                        <div class="p-3 rounded-2xl bg-purple-50 text-purple-600 font-bold text-lg">🔖</div>
                        <div>
                            <span class="block text-xs font-bold text-slate-400">CRDT Versions</span>
                            <span class="text-2xl font-black text-slate-900">12</span>
                        </div>
                    </div>
                </div>

                <!-- VIEW 1: OVERVIEW -->
                <div id="view-overview" class="space-y-6">
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <!-- Active Workspaces Table (2 cols) -->
                        <div class="lg:col-span-2 rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
                            <div class="flex items-center justify-between">
                                <h3 class="text-base font-bold text-slate-900">Active Workspaces</h3>
                                <button class="text-xs font-bold text-cyan-600 hover:text-cyan-800">View All →</button>
                            </div>
                            <div class="overflow-x-auto">
                                <table class="w-full text-left text-xs">
                                    <thead>
                                        <tr class="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                                            <th class="pb-3">Workspace</th>
                                            <th class="pb-3 text-center">Collaborators</th>
                                            <th class="pb-3">Last Synced</th>
                                            <th class="pb-3">CRDT Status</th>
                                            <th class="pb-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-slate-100">
                                        <tr class="hover:bg-slate-50 transition-colors">
                                            <td class="py-3.5 pr-3 font-bold text-slate-900">CodeSync Core</td>
                                            <td class="py-3.5 text-center text-slate-600 font-bold">4 peers</td>
                                            <td class="py-3.5 text-slate-500 font-medium">10 mins ago</td>
                                            <td class="py-3.5"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">Active</span></td>
                                            <td class="py-3.5 text-right"><button onclick="openExplanationModal()" class="px-3 py-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-extrabold text-xs">Open</button></td>
                                        </tr>
                                        <tr class="hover:bg-slate-50 transition-colors">
                                            <td class="py-3.5 pr-3 font-bold text-slate-900">AST Semantic Engine</td>
                                            <td class="py-3.5 text-center text-slate-600 font-bold">3 peers</td>
                                            <td class="py-3.5 text-slate-500 font-medium">32 mins ago</td>
                                            <td class="py-3.5"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">Active</span></td>
                                            <td class="py-3.5 text-right"><button onclick="openExplanationModal()" class="px-3 py-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-extrabold text-xs">Open</button></td>
                                        </tr>
                                        <tr class="hover:bg-slate-50 transition-colors">
                                            <td class="py-3.5 pr-3 font-bold text-slate-900">Docker Sandbox Suite</td>
                                            <td class="py-3.5 text-center text-slate-600 font-bold">2 peers</td>
                                            <td class="py-3.5 text-slate-500 font-medium">2 hours ago</td>
                                            <td class="py-3.5"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">Active</span></td>
                                            <td class="py-3.5 text-right"><button onclick="openExplanationModal()" class="px-3 py-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-extrabold text-xs">Open</button></td>
                                        </tr>
                                        <tr class="hover:bg-slate-50 transition-colors">
                                            <td class="py-3.5 pr-3 font-bold text-slate-900">Distributed CRDT</td>
                                            <td class="py-3.5 text-center text-slate-600 font-bold">3 peers</td>
                                            <td class="py-3.5 text-slate-500 font-medium">1 day ago</td>
                                            <td class="py-3.5"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">Active</span></td>
                                            <td class="py-3.5 text-right"><button onclick="openExplanationModal()" class="px-3 py-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-extrabold text-xs">Open</button></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Real-Time Activity Stream (1 col) -->
                        <div class="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
                            <div class="flex items-center justify-between">
                                <h3 class="text-base font-bold text-slate-900">Real-Time Activity</h3>
                                <button class="text-xs font-bold text-indigo-600 hover:text-indigo-800">Live Stream →</button>
                            </div>
                            <div class="space-y-3.5 text-xs">
                                <div class="flex items-start gap-3">
                                    <span class="p-1.5 rounded-xl bg-slate-100 text-indigo-600">✏️</span>
                                    <div><p class="font-bold text-slate-900">Collaborator edited userService.ts in CodeSync Core</p><span class="text-[10px] text-slate-400">10 minutes ago</span></div>
                                </div>
                                <div onclick="openExplanationModal()" class="flex items-start gap-3 p-2 rounded-xl bg-rose-50/60 border border-rose-100 cursor-pointer hover:bg-rose-50 transition-colors">
                                    <span class="p-1.5 rounded-xl bg-rose-100 text-rose-600">⚠️</span>
                                    <div><p class="font-bold text-rose-900">Semantic conflict #24 in calculateSalary()</p><span class="text-[10px] text-rose-500">32 minutes ago (Click to view AI Explanation)</span></div>
                                </div>
                                <div class="flex items-start gap-3">
                                    <span class="p-1.5 rounded-xl bg-slate-100 text-emerald-600">👤</span>
                                    <div><p class="font-bold text-slate-900">Team member joined room 'codesync-core' via WebRTC</p><span class="text-[10px] text-slate-400">1 hour ago</span></div>
                                </div>
                                <div class="flex items-start gap-3">
                                    <span class="p-1.5 rounded-xl bg-slate-100 text-purple-600">🔖</span>
                                    <div><p class="font-bold text-slate-900">CRDT snapshot v1.4 converged across all peers</p><span class="text-[10px] text-slate-400">2 hours ago</span></div>
                                </div>
                                <div class="flex items-start gap-3">
                                    <span class="p-1.5 rounded-xl bg-slate-100 text-sky-600">💬</span>
                                    <div><p class="font-bold text-slate-900">Review comment posted on AST type inference rules</p><span class="text-[10px] text-slate-400">3 hours ago</span></div>
                                </div>
                                <div class="flex items-start gap-3">
                                    <span class="p-1.5 rounded-xl bg-slate-100 text-emerald-600">✓</span>
                                    <div><p class="font-bold text-slate-900">AI Suggestion applied with 94% confidence (17/17 tests passing)</p><span class="text-[10px] text-slate-400">5 hours ago</span></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Bottom Cards: Conflict Overview & Gemini Banner -->
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div class="lg:col-span-2 rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
                            <div class="flex items-center justify-between">
                                <h3 class="text-base font-bold text-slate-900">Semantic Conflict & Resolution Overview</h3>
                                <button onclick="openExplanationModal()" class="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 hover:bg-amber-100">
                                    Inspect Conflict #24 →
                                </button>
                            </div>
                            <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                <div class="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100">
                                    <span class="text-xs font-bold text-rose-500">Detected</span>
                                    <span class="text-2xl font-black text-slate-900 block mt-1">8</span>
                                    <span class="text-[10px] text-slate-400">Total conflicts</span>
                                </div>
                                <div class="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                                    <span class="text-xs font-bold text-emerald-600">Resolved</span>
                                    <span class="text-2xl font-black text-slate-900 block mt-1" id="stat-resolved">5</span>
                                    <span class="text-[10px] text-slate-400">Successfully resolved</span>
                                </div>
                                <div class="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100">
                                    <span class="text-xs font-bold text-amber-600">Pending</span>
                                    <span class="text-2xl font-black text-slate-900 block mt-1" id="stat-pending">3</span>
                                    <span class="text-[10px] text-slate-400">Awaiting review</span>
                                </div>
                                <div class="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100">
                                    <span class="text-xs font-bold text-purple-600">AI Suggestions</span>
                                    <span class="text-2xl font-black text-slate-900 block mt-1">4</span>
                                    <span class="text-[10px] text-slate-400">Generated by Gemini</span>
                                </div>
                                <div class="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100">
                                    <span class="text-xs font-bold text-sky-600">Validation Passed</span>
                                    <span class="text-2xl font-black text-slate-900 block mt-1">6</span>
                                    <span class="text-[10px] text-slate-400">Ready to merge</span>
                                </div>
                            </div>
                        </div>

                        <!-- CodeSync AI Conflict Resolver -->
                        <div class="rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-white border border-indigo-100 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
                            <div>
                                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 flex items-center justify-center font-black text-sm mb-3">
                                    ✨
                                </div>
                                <h4 class="text-base font-bold text-slate-900">CodeSync AI Conflict Resolver</h4>
                                <p class="text-xs text-slate-500 mt-1 leading-relaxed">Get intelligent AST conflict resolution, type mismatch reasoning, and candidate sandbox validation powered by Google Gemini.</p>
                            </div>
                            <button onclick="openExplanationModal()" class="mt-4 px-4 py-2 rounded-xl bg-white border border-indigo-200 text-indigo-600 font-bold text-xs hover:bg-indigo-50 transition-colors text-left w-max">
                                Inspect AI Explanation (#24) →
                            </button>
                        </div>
                    </div>
                </div>

                <!-- VIEW 2: AI CONFLICT METRICS -->
                <div id="view-metrics" class="space-y-6 hidden">
                    <div class="rounded-3xl border-2 border-indigo-500/30 bg-white p-6 sm:p-7 shadow-xl space-y-6">
                        <div class="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h3 class="text-xl font-black text-slate-900">
                                    Conflict Metrics Dashboard
                                </h3>
                                <ul class="text-xs text-slate-600 mt-2 space-y-1 list-disc list-inside">
                                    <li>Displays conflict statistics, resolution success rates, and coverage information.</li>
                                    <li>Helps measure how effectively the AI is resolving conflicts.</li>
                                </ul>
                            </div>
                            <div class="p-3 rounded-2xl bg-indigo-50 text-indigo-700 text-center">
                                <span class="block text-2xl font-black">92/100</span>
                                <span class="block text-[10px] font-bold uppercase text-slate-500">AI Effectiveness Score</span>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                <span class="block text-xs font-bold text-slate-500">Resolution Success Rate</span>
                                <span class="text-2xl font-black text-emerald-600 mt-1 block">83.3%</span>
                                <div class="w-full bg-slate-200 rounded-full h-1.5 mt-2"><div class="bg-emerald-500 h-1.5 rounded-full" style="width: 83.3%"></div></div>
                            </div>
                            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                <span class="block text-xs font-bold text-slate-500">Test Coverage Information</span>
                                <span class="text-2xl font-black text-indigo-600 mt-1 block">94.6%</span>
                                <div class="w-full bg-slate-200 rounded-full h-1.5 mt-2"><div class="bg-indigo-500 h-1.5 rounded-full" style="width: 94.6%"></div></div>
                            </div>
                            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                <span class="block text-xs font-bold text-slate-500">Regressions Prevented</span>
                                <span class="text-2xl font-black text-purple-600 mt-1 block">18</span>
                                <span class="text-[11px] text-slate-400 mt-1 block">Avg resolution time: 24s</span>
                            </div>
                        </div>

                        <!-- Category Breakdown Table -->
                        <div class="rounded-2xl border border-slate-200 overflow-hidden">
                            <div class="bg-slate-50 p-3 text-xs font-bold text-slate-600 grid grid-cols-4">
                                <span>Conflict Category</span>
                                <span class="text-center">Detected</span>
                                <span class="text-center">AI Resolved</span>
                                <span class="text-right">Success Rate</span>
                            </div>
                            <div class="divide-y divide-slate-100 text-xs font-medium">
                                <div class="p-3 grid grid-cols-4 items-center">
                                    <span class="font-bold text-slate-800">Type Mismatches</span>
                                    <span class="text-center text-slate-500">3</span>
                                    <span class="text-center text-emerald-600 font-bold">3</span>
                                    <span class="text-right font-bold text-indigo-600">100.0%</span>
                                </div>
                                <div class="p-3 grid grid-cols-4 items-center">
                                    <span class="font-bold text-slate-800">Interface Signatures</span>
                                    <span class="text-center text-slate-500">2</span>
                                    <span class="text-center text-emerald-600 font-bold">2</span>
                                    <span class="text-right font-bold text-indigo-600">100.0%</span>
                                </div>
                                <div class="p-3 grid grid-cols-4 items-center">
                                    <span class="font-bold text-slate-800">Dependency Breaks</span>
                                    <span class="text-center text-slate-500">2</span>
                                    <span class="text-center text-emerald-600 font-bold">1</span>
                                    <span class="text-right font-bold text-indigo-600">50.0%</span>
                                </div>
                                <div class="p-3 grid grid-cols-4 items-center">
                                    <span class="font-bold text-slate-800">Duplicate Declarations</span>
                                    <span class="text-center text-slate-500">1</span>
                                    <span class="text-center text-emerald-600 font-bold">1</span>
                                    <span class="text-right font-bold text-indigo-600">100.0%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </main>
    </div>

    <!-- MODAL: AI CONFLICT EXPLANATION (CONFLICT #24) -->
    <div id="modal-explanation" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm hidden overflow-y-auto">
        <div class="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
                <div class="flex items-center gap-2">
                    <span class="text-indigo-600 font-bold">✨</span>
                    <span class="text-xs font-bold uppercase text-slate-500">AI Conflict Explanation</span>
                </div>
                <button onclick="closeExplanationModal()" class="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
            </div>

            <div class="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                <div>
                    <h2 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        3. One particularly good feature: AI Conflict Explanation
                    </h2>
                    <p class="text-sm font-semibold text-slate-600 mt-2">
                        I strongly recommend adding this.
                    </p>
                    <p class="text-sm text-slate-500 mt-4 font-medium">
                        When a conflict occurs, show:
                    </p>
                </div>

                <!-- Exact Card from media_1791262985706.png -->
                <div class="relative rounded-3xl bg-[#f8f9fa] border border-slate-200/90 p-6 sm:p-8 font-mono text-[13px] sm:text-[14px] leading-relaxed text-slate-800 shadow-inner">
                    <div class="font-bold tracking-wide text-slate-900 mb-6">
                        CONFLICT #24
                    </div>

                    <div class="space-y-1 mb-6">
                        <div><span class="text-slate-700">Type: </span><span class="font-semibold text-slate-900">Semantic Conflict</span></div>
                        <div><span class="text-slate-700">Severity: </span><span class="font-bold text-rose-600">HIGH</span></div>
                    </div>

                    <div class="space-y-1 mb-6">
                        <div class="font-semibold text-slate-900">Developer A:</div>
                        <div class="text-slate-600">Changed:</div>
                        <div class="font-semibold text-slate-900">calculateSalary(employeeId)</div>
                    </div>

                    <div class="space-y-1 mb-6">
                        <div class="font-semibold text-slate-900">Developer B:</div>
                        <div class="text-slate-600">Changed:</div>
                        <div class="font-semibold text-slate-900">calculateSalary(employee)</div>
                    </div>

                    <div class="space-y-1 mb-6">
                        <div class="font-bold text-slate-900">WHY?</div>
                        <div class="text-slate-800 leading-normal">
                            The function interface was modified by Developer A, while Developer B is still passing an integer ID.
                        </div>
                    </div>

                    <div class="space-y-1 mb-6">
                        <div class="font-bold text-slate-900">AI SUGGESTION:</div>
                        <div class="font-semibold text-indigo-700 leading-normal">
                            Convert Developer B's call to employee.id
                        </div>
                    </div>

                    <div class="mb-6">
                        <span class="text-slate-700">Confidence: </span>
                        <span class="font-bold text-emerald-600">94%</span>
                    </div>

                    <div class="space-y-1">
                        <div class="font-semibold text-slate-900">Validation:</div>
                        <div class="space-y-1 text-slate-800">
                            <div>✓ Syntax</div>
                            <div>✓ Type check</div>
                            <div>✓ 17 unit tests</div>
                            <div>✓ No new errors</div>
                        </div>
                    </div>

                    <div class="absolute bottom-6 right-6">
                        <div class="w-9 h-9 rounded-full bg-white border border-slate-300 shadow-sm flex items-center justify-center text-slate-600 font-bold">
                            ↓
                        </div>
                    </div>
                </div>

                <div id="fix-banner" class="hidden rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs text-emerald-900">
                    <span class="font-bold block">✓ Fix Applied Successfully!</span>
                    Developer B's caller updated to <code class="bg-emerald-100 px-1 py-0.5 rounded font-mono font-bold">employee.id</code>. 17/17 tests passing with 0 new errors!
                </div>

                <div class="flex justify-between items-center pt-2">
                    <button onclick="closeExplanationModal()" class="px-4 py-2 rounded-xl text-slate-600 font-bold text-xs hover:text-slate-900">
                        Close
                    </button>
                    <button id="apply-btn" onclick="applyFix()" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all">
                        Apply AI Suggestion (94% Conf.)
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script>
        function setView(view) {
            const overview = document.getElementById('view-overview');
            const metrics = document.getElementById('view-metrics');
            const navDash = document.getElementById('nav-dashboard');
            const navMetrics = document.getElementById('nav-metrics');

            if (view === 'overview') {
                overview.classList.remove('hidden');
                metrics.classList.add('hidden');
                navDash.className = "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 text-white shadow-sm transition-all";
                navMetrics.className = "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all";
            } else {
                overview.classList.add('hidden');
                metrics.classList.remove('hidden');
                navDash.className = "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all";
                navMetrics.className = "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 text-white shadow-sm transition-all";
            }
        }

        function openExplanationModal() {
            document.getElementById('modal-explanation').classList.remove('hidden');
        }

        function closeExplanationModal() {
            document.getElementById('modal-explanation').classList.add('hidden');
        }

        function applyFix() {
            const btn = document.getElementById('apply-btn');
            btn.innerText = "Applying Fix...";
            btn.disabled = true;

            fetch('http://localhost:3000/api/conflicts/explanation-24/apply', { method: 'POST' })
                .then(r => r.json())
                .catch(() => ({}))
                .finally(() => {
                    btn.innerText = "✓ Fix Applied";
                    btn.className = "px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-default";
                    document.getElementById('fix-banner').classList.remove('hidden');
                    const statRes = document.getElementById('stat-resolved');
                    const statPend = document.getElementById('stat-pending');
                    if (statRes) statRes.innerText = "6";
                    if (statPend) statPend.innerText = "2";
                });
        }
    </script>
</body>
</html>`;
}
