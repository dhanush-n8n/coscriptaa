export interface AISolution {
    id: number;
    title: string;
    description: string;
    codeDiffOrPatch: string;
}

export interface ValidatedAISolution {
    id: number;
    title: string;
    description: string;
    codeDiffOrPatch: string;
    confidenceScore: number; // e.g. 82, 94, 71
    typeCheckStatus: 'passed' | 'warning' | 'failed';
    typeCheckDetails: string;
    testsTotal: number;      // e.g. 17
    testsPassed: number;     // e.g. 17 for Sol 2, 14 for Sol 1, 15 for Sol 3
    testResults: Array<{
        name: string;
        passed: boolean;
        durationMs: number;
        errorMessage?: string;
    }>;
    isRecommended: boolean;  // true for Solution 2
    recommendationReason: string;
}

export interface ValidationPipelineRun {
    conflictId: string;
    conflictTitle: string;
    timestamp: number;
    stage: 'conflict_detected' | 'ai_generated' | 'tests_running' | 'validation_complete';
    solutions: ValidatedAISolution[];
    recommendedSolutionId: number; // 2
    testsTotal: number;
    recommendationHeadline: string;
    summary: string;
}

export interface ConflictExplainability {
    cause: string;               // e.g. "Developer A changed user_id from int -> string."
    expectation: string;         // e.g. "Developer B's function still expects int."
    impact: string;              // e.g. "This may cause a type mismatch in getUser()."
    category: 'TYPE_MISMATCH' | 'CHANGED_FUNCTION_INTERFACE' | 'DUPLICATE_DECLARATION' | 'INCOMPATIBLE_DEPENDENCY';
    categoryLabel: string;
    educationalExplanation: string; // Pedagogical context for students & developers
    targetEntity: string;        // e.g. "user_id" / "getUser()"
    devAName: string;
    devBName: string;
    beforeType?: string;
    afterType?: string;
    devACodeSnippet?: string;
    devBCodeSnippet?: string;
    remediationGuide: string;
}

import type { SandboxValidationSuiteResult } from './sandbox';

export interface SemanticConflict {
    id: string;
    category: 'SIGNATURE_MISMATCH' | 'UNDECLARED_SYMBOL' | 'BREAKING_RENAME' | 'DUPLICATE_DECLARATION' | 'TYPE_MISMATCH';
    severity: 'CRITICAL' | 'WARNING' | 'INFO';
    title: string;
    description: string;
    symbol: string;
    sourceFile: string;
    sourceLine: number;
    targetFile?: string;
    targetLine?: number;
    astDetails: {
        declaredSignature?: string;
        invokedArgumentsCount?: number;
        expectedParamsCount?: number;
        callerContext?: string;
    };
    suggestedRemedy?: string;
    explainability?: ConflictExplainability;
    validationRun?: ValidationPipelineRun;
    sandboxResult?: SandboxValidationSuiteResult;
    aiAnalysis?: {
        intentDivergence: string;
        riskScore: number;
        semanticRootCause: string;
        codeBertAttentionFocus: string;
        proposedSolutions: AISolution[];
    };
}
