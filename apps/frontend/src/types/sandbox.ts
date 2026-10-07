/**
 * DOCKER SANDBOX TYPES
 * 
 * Feature 8: Automatic Resolution Validation
 * Section 6: Validate every solution
 *  - Isolated Docker sandbox execution
 *  - 4 Checks:
 *      ✓ Syntax check
 *      ✓ Type check
 *      ✓ Unit tests
 *      ✓ Existing test cases
 *  - Coverage tracking (lines, branches, functions)
 *  - Rollback mechanism (pre-resolution snapshots)
 */

export interface SandboxCheckSubResult {
    title: string;
    passed: boolean;
    durationMs?: number;
    output?: string;
}

export interface SandboxCheckItem {
    name: 'Syntax check' | 'Type check' | 'Unit tests' | 'Existing test cases';
    status: 'passed' | 'failed' | 'warning';
    passed: boolean;
    durationMs: number;
    details: string;
    subResults?: SandboxCheckSubResult[];
}

export interface SandboxCoverageReport {
    lineCoverage: number;       // e.g. 94.6%
    branchCoverage: number;     // e.g. 92.5%
    functionCoverage: number;   // e.g. 100%
    statementCoverage: number;  // e.g. 95.1%
    uncoveredLines: number[];
    coverageGatePassed: boolean; // >= 90%
    metricSummary: string;
}

export interface RollbackSnapshot {
    snapshotId: string;
    roomId: string;
    conflictId: string;
    createdAt: number;
    description: string;
    files: Array<{
        id: string;
        name: string;
        content: string;
    }>;
    canRollback: boolean;
}

export interface DockerSandboxExecutionReport {
    solutionId: number;
    solutionTitle: string;
    containerId: string;
    image: string;
    memoryLimit: string;
    cpuQuota: string;
    networkIsolated: boolean;
    executionTimeMs: number;
    overallStatus: 'passed' | 'failed' | 'warning';
    
    // The 4 Core Checks from Screenshot
    checks: {
        syntaxCheck: SandboxCheckItem;
        typeCheck: SandboxCheckItem;
        unitTests: SandboxCheckItem;
        existingTestCases: SandboxCheckItem;
    };

    coverage: SandboxCoverageReport;
    rollback: {
        snapshotAvailable: boolean;
        snapshotId: string;
        safeToApply: boolean;
        rollbackNotice: string;
    };

    sandboxLogs: string[];
}

export interface SandboxValidationSuiteResult {
    conflictId: string;
    conflictTitle: string;
    timestamp: number;
    recommendedSolutionId: number;
    preResolutionSnapshotId: string;
    reports: DockerSandboxExecutionReport[];
    summary: {
        headline: string;
        description: string;
        sandboxExecutionReady: boolean;
        coveragePassed: boolean;
        rollbackPreserved: boolean;
    };
}
