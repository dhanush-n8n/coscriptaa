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

export type ConflictRiskTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ConflictRiskFactor {
    name: string;
    score: number;
    maxScore: number;
    weightPercent: number;
    description: string;
}

export interface ConflictRiskAssessment {
    score: number; // 0 - 100
    level: ConflictRiskTier;
    label: string; // "Low Risk", "Medium Risk", "High Risk", "Critical Risk"
    color: string;
    badgeColor: string;
    summary: string;
    factors: {
        overlappingModifications: ConflictRiskFactor;
        sharedSymbols: ConflictRiskFactor;
        dependencyRelationships: ConflictRiskFactor;
        breakingSeverity: ConflictRiskFactor;
        affectedModules: ConflictRiskFactor;
    };
    affectedModulesCount: number;
    affectedCallersCount: number;
}

export interface ValidationCheckResult {
    name: string;
    passed: boolean;
    durationMs: number;
    details: string;
    error?: string;
}

export interface ConfidenceEvidenceFactors {
    syntaxScore: number;          // e.g. 30/30
    interfaceScore: number;       // e.g. 20/20
    executionScore: number;       // e.g. 25/25
    testScore: number;            // e.g. 5/5
    preservationScore: number;    // e.g. 20/20 for dual merge, 6/20 for single dev
    total: number;
}

export interface ResolutionOption {
    id: 1 | 2 | 3;
    type: 'KEEP_CURRENT' | 'KEEP_INCOMING' | 'AI_MERGED';
    title: string;
    author: string;
    description: string;
    code: string;
    confidenceScore: number; // 0 - 100
    explanation: string;
    confidenceExplanation?: string;
    validationPerformed?: boolean;
    confidenceFactors?: ConfidenceEvidenceFactors;
    preservationScore?: number;
    validation: {
        syntaxCheck: ValidationCheckResult;
        interfaceCheck: ValidationCheckResult;
        executionCheck: ValidationCheckResult;
        typeCheck?: ValidationCheckResult;
        unitTests?: ValidationCheckResult;
        overallPassed: boolean;
    };
}

export interface GenuineConflict {
    id: string;
    roomId: string;
    fileId: string;
    fileName: string;
    language?: string;
    symbolName: string;
    devA: {
        userId: string;
        userName: string;
        codeSnippet: string;
        language?: string;
        params: string[];
        returnExpr?: string;
        timestamp: number;
    };
    devB: {
        userId: string;
        userName: string;
        codeSnippet: string;
        language?: string;
        params: string[];
        returnExpr?: string;
        timestamp: number;
    };
    baseCodeSnippet: string;
    conflictType: 'DIRECT_FUNCTION_DIVERGENCE' | 'INTERFACE_ARITY_MISMATCH' | 'TYPE_MISMATCH' | 'VARIABLE_COLLISION' | 'LANGUAGE_MISMATCH';
    reason: string;
    severity: 'HIGH' | 'CRITICAL';
    detectedAt: number;
    riskAssessment?: ConflictRiskAssessment;
    solutions?: ResolutionOption[];
}

export interface ConflictHistoryRecord {
    id: string;
    conflictId: string;
    roomId: string;
    fileName: string;
    language?: string;
    symbolName: string;
    resolvedAt: number;
    resolvedBy: string;
    chosenOption: 1 | 2 | 3;
    chosenOptionTitle: string;
    baseCodeSnippet: string;
    devACodeSnippet: string;
    devBCodeSnippet: string;
    resolvedCode: string;
    explanation: string;
    validationSummary: {
        syntax: boolean;
        interface: boolean;
        execution: boolean;
    };
}

