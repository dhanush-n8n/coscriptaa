export interface DependencyNode {
    id: string;
    name: string;
    type: 'function' | 'variable' | 'module';
    file: string;
    line: number;
    exportStatus?: boolean;
    signature?: string;
    dependenciesCount: number;
    dependentsCount: number;
}

export interface DependencyEdge {
    id: string;
    from: string;
    to: string;
    type: 'calls' | 'imports' | 'reads_variable' | 'modifies_variable' | 'depends_on';
    contextLine?: string;
}

export interface CodebaseDependencyGraph {
    nodes: DependencyNode[];
    edges: DependencyEdge[];
    modulesCount: number;
    functionsCount: number;
    variablesCount: number;
    totalRelationships: number;
}

export interface AISolutionOption {
    id: number;
    title: string;
    description: string;
    codePatch: string;
    affectedFile: string;
    tradeoffs: string;
    sandboxStatus?: 'pending' | 'tested' | 'verified';
}

export interface IndirectConflict {
    id: string;
    conflictType: 
        | 'INDIRECT_BEHAVIORAL_BREAK' 
        | 'INDIRECT_SIGNATURE_MISMATCH' 
        | 'SHARED_MUTABLE_STATE_CONFLICT' 
        | 'INDIRECT_RETURN_TYPE_DRIFT' 
        | 'CROSS_MODULE_EXPORT_SHADOW';
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    title: string;
    description: string;
    targetSymbol: string;
    targetFile: string;
    targetLine: number;
    componentA: {
        name: string;
        type: 'function' | 'variable' | 'module';
        file: string;
        line: number;
        developer: string;
        changeSummary: string;
        codeSnippet: string;
    };
    componentB: {
        name: string;
        type: 'function' | 'variable' | 'module';
        file: string;
        line: number;
        developer: string;
        changeSummary: string;
        codeSnippet: string;
    };
    dependencyPath: string[];
    impactedComponents: string[];
    impactRadius: number;

    // AI Context (Screenshot 4)
    aiContext: {
        baseCode: string;
        devACode: string;
        devBCode: string;
        astDifferences: string[];
        relatedDependencies: string[];
        conflictType: string;
        codeBertClassification: {
            intent: string;
            confidence: number;
            attentionFocus: string;
            embeddingSimilarity: number;
        };
    };

    // Three AI Solutions (Screenshot 5)
    aiSolutions: {
        solution1: AISolutionOption;
        solution2: AISolutionOption;
        solution3: AISolutionOption;
    };
}
