export interface ProactiveDivergence {
    id: string;
    entityName: string;
    entityType: 'function' | 'variable';
    file: string;
    devA: {
        name: string;
        codeSnippet: string;
        params: string[];
        operation: string;
        returnExpr: string;
    };
    devB: {
        name: string;
        codeSnippet: string;
        params: string[];
        operation: string;
        returnExpr: string;
    };
    observations: string[];
    conflictSummary: string;
    riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    synthesizedResolution: string;
}

export interface ProactivePredictionResult {
    hasConflict: boolean;
    timestamp: number;
    divergences: ProactiveDivergence[];
    summary: string;
}
