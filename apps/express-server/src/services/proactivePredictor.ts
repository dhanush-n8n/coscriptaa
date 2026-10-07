/**
 * PROACTIVE CONFLICT PREDICTOR SERVICE
 * 
 * Feature 4: Proactive Conflict Prediction
 * Identifies potentially conflicting changes while developers are editing,
 * before they develop into actual merge conflicts.
 * 
 * Pipeline:
 * 1. Capture Concurrent Changes (Dev A vs Dev B in-flight code)
 * 2. Parse using AST (Extract symbols, parameters, and return operations)
 * 3. Detect Structural & Semantic Divergence (e.g. Addition vs Multiplication, Param renames)
 * 4. Generate Proactive Interventions before merge conflicts occur
 */

import { ASTParser, FileAST, ASTFunction } from './astParser';

export interface DeveloperVersion {
    developerId: string;
    developerName: string;
    file: string;
    code: string;
    timestamp?: number;
}

export interface ProactiveDivergence {
    id: string;
    entityName: string; // e.g. "calculate()"
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

export class ProactiveConflictPredictor {
    /**
     * Compares two concurrent developer versions to proactively predict conflicts
     */
    public static predictConflicts(
        versionA: DeveloperVersion,
        versionB: DeveloperVersion
    ): ProactivePredictionResult {
        const divergences: ProactiveDivergence[] = [];

        // 1. Parse both versions into ASTs
        const astA: FileAST = ASTParser.parseFile(versionA.file, versionA.code);
        const astB: FileAST = ASTParser.parseFile(versionB.file, versionB.code);

        // 2. Identify common functions modified in both versions
        astA.functions.forEach((fnA) => {
            const fnB = astB.functions.find(f => f.name === fnA.name);

            if (fnB) {
                // Check if the functions structurally diverge
                const paramsDiverged = JSON.stringify(fnA.params) !== JSON.stringify(fnB.params);
                const operationDiverged = (fnA.returnOperation || '') !== (fnB.returnOperation || '') && 
                                          Boolean(fnA.returnOperation && fnB.returnOperation);
                const returnExprDiverged = (fnA.returnExpression || '').replace(/\s+/g, '') !== 
                                          (fnB.returnExpression || '').replace(/\s+/g, '');
                const bodyDiverged = (fnA.bodySnippet || '').trim() !== (fnB.bodySnippet || '').trim();

                if (paramsDiverged || operationDiverged || (returnExprDiverged && bodyDiverged)) {
                    const observations: string[] = [];
                    observations.push(`Both developers concurrently modified '${fnA.name}()'`);

                    if (paramsDiverged) {
                        observations.push(`The parameters were changed/renamed: [${fnA.params.join(', ')}] vs [${fnB.params.join(', ')}]`);
                    }

                    if (operationDiverged) {
                        observations.push(`The return operation is different: '${fnA.returnOperation}' vs '${fnB.returnOperation}'`);
                    } else if (returnExprDiverged) {
                        observations.push(`Return expressions diverge: '${fnA.returnExpression}' vs '${fnB.returnExpression}'`);
                    }

                    observations.push("AST-based structural analysis detected logical divergence before textual merge collision.");

                    // Determine Risk Level
                    let risk: ProactiveDivergence['riskLevel'] = 'MEDIUM';
                    if (operationDiverged) {
                        risk = 'CRITICAL';
                    } else if (paramsDiverged) {
                        risk = 'HIGH';
                    }

                    // Synthesized smart resolution
                    const synthesized = this.generateSynthesizedResolution(fnA, fnB, versionA.developerName, versionB.developerName);

                    divergences.push({
                        id: `proactive-${fnA.name}-${Date.now()}`,
                        entityName: `${fnA.name}()`,
                        entityType: 'function',
                        file: versionA.file,
                        devA: {
                            name: versionA.developerName,
                            codeSnippet: fnA.bodySnippet || fnA.rawSignature,
                            params: fnA.params,
                            operation: fnA.returnOperation || 'Expression',
                            returnExpr: fnA.returnExpression || ''
                        },
                        devB: {
                            name: versionB.developerName,
                            codeSnippet: fnB.bodySnippet || fnB.rawSignature,
                            params: fnB.params,
                            operation: fnB.returnOperation || 'Expression',
                            returnExpr: fnB.returnExpression || ''
                        },
                        observations,
                        conflictSummary: `Proactive Conflict in '${fnA.name}()': ${versionA.developerName} implemented ${fnA.returnOperation || 'custom logic'}, while ${versionB.developerName} concurrently implemented ${fnB.returnOperation || 'differing logic'}.`,
                        riskLevel: risk,
                        synthesizedResolution: synthesized
                    });
                }
            }
        });

        return {
            hasConflict: divergences.length > 0,
            timestamp: Date.now(),
            divergences,
            summary: divergences.length > 0
                ? `Proactive Conflict Prediction: ${divergences.length} in-flight structural conflict(s) predicted.`
                : "No in-flight structural conflicts predicted."
        };
    }

    private static generateSynthesizedResolution(
        fnA: ASTFunction, 
        fnB: ASTFunction, 
        devAName: string, 
        devBName: string
    ): string {
        // If one did Addition (+) and one did Multiplication (*)
        if (fnA.returnOperation === 'Addition (+)' && fnB.returnOperation === 'Multiplication (*)') {
            return `// Unified function supporting both ${devAName}'s addition and ${devBName}'s multiplication:\nfunction ${fnA.name}(${fnA.params.join(', ')}, mode = 'add') {\n    if (mode === 'multiply') {\n        return ${fnB.returnExpression};\n    }\n    return ${fnA.returnExpression};\n}`;
        }

        if (fnA.returnOperation === 'Multiplication (*)' && fnB.returnOperation === 'Addition (+)') {
            return `// Unified function supporting both ${devAName}'s multiplication and ${devBName}'s addition:\nfunction ${fnA.name}(${fnA.params.join(', ')}, mode = 'multiply') {\n    if (mode === 'add') {\n        return ${fnB.returnExpression};\n    }\n    return ${fnA.returnExpression};\n}`;
        }

        return `// Reconciled signature combining both developers' intents:\nfunction ${fnA.name}(${Array.from(new Set([...fnA.params, ...fnB.params])).join(', ')}) {\n    // Resolve: ${devAName} (${fnA.returnExpression || 'logic A'}) vs ${devBName} (${fnB.returnExpression || 'logic B'})\n    return ${fnA.returnExpression || fnB.returnExpression};\n}`;
    }
}
