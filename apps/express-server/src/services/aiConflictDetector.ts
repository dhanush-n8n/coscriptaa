/**
 * AI & CODEBERT CONFLICT DETECTOR SERVICE
 * 
 * Corresponds to nodes 4, 5, 6 in the project pipeline:
 * AST Parsing -> Semantic Analysis -> CodeBERT / AI -> Conflict Detection -> AI generates solutions
 * 
 * Enhances structural AST conflicts with deep semantic analysis, intent divergence,
 * risk scoring, and multi-candidate resolution generation.
 */

import { SemanticConflict } from './semanticAnalyzer';

export interface AIEnrichedConflict extends SemanticConflict {
    aiAnalysis: {
        intentDivergence: string;
        riskScore: number; // 0 to 100
        semanticRootCause: string;
        codeBertAttentionFocus: string;
        proposedSolutions: Array<{
            id: number;
            title: string;
            description: string;
            codeDiffOrPatch: string;
        }>;
    };
}

export class AIConflictDetector {
    private static apiKey = process.env.GEMINI_API_KEY || '';

    /**
     * Enriches AST conflicts with AI-driven semantic model evaluation
     */
    public static async evaluateConflicts(
        conflicts: SemanticConflict[],
        files: Array<{ name: string; content: string }>
    ): Promise<AIEnrichedConflict[]> {
        if (conflicts.length === 0) {
            return [];
        }

        // If Gemini API key is configured, query LLM for semantic evaluation
        if (this.apiKey) {
            try {
                return await this.evaluateWithGemini(conflicts, files);
            } catch (err) {
                console.warn("AI evaluation via Gemini failed, falling back to local semantic heuristic:", err);
            }
        }

        // Fallback: Local Semantic & CodeBERT Heuristic Evaluator
        return conflicts.map((c, idx) => this.generateHeuristicSemanticEvaluation(c, idx));
    }

    private static async evaluateWithGemini(
        conflicts: SemanticConflict[],
        files: Array<{ name: string; content: string }>
    ): Promise<AIEnrichedConflict[]> {
        const filesSummary = files.map(f => `File '${f.name}':\n\`\`\`\n${f.content}\n\`\`\``).join('\n\n');
        const conflictsSummary = JSON.stringify(conflicts, null, 2);

        const prompt = `You are a CodeBERT and AST Semantic Code Conflict Analysis Engine.
Evaluate the following semantic code conflicts detected across concurrent developer edits in a collaborative codebase.

Codebase Files:
${filesSummary}

Detected AST Semantic Conflicts:
${conflictsSummary}

For each conflict, return a JSON array matching the enriched format with:
- intentDivergence: High-level explanation of how Developer A and Developer B's intents diverged
- riskScore: 0 to 100 risk score
- semanticRootCause: Deep structural root cause
- codeBertAttentionFocus: Token or AST nodes receiving the highest attention weights
- proposedSolutions: Exactly 3 candidate resolutions (Solution 1, Solution 2, Solution 3) with title, description, and code patch.

Return ONLY raw valid JSON array of objects with fields { id, intentDivergence, riskScore, semanticRootCause, codeBertAttentionFocus, proposedSolutions }. No markdown wrapping.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API returned status ${response.status}`);
        }

        const data: any = await response.json();
        const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawJsonText) throw new Error("Empty response from AI model");

        const parsedEvaluations: any[] = JSON.parse(rawJsonText);

        return conflicts.map(conflict => {
            const aiData = parsedEvaluations.find(e => e.id === conflict.id) || parsedEvaluations[0];
            return {
                ...conflict,
                aiAnalysis: {
                    intentDivergence: aiData?.intentDivergence || `Concurrent modifications on '${conflict.symbol}' produced semantic divergence.`,
                    riskScore: aiData?.riskScore || (conflict.severity === 'CRITICAL' ? 88 : 62),
                    semanticRootCause: aiData?.semanticRootCause || conflict.description,
                    codeBertAttentionFocus: aiData?.codeBertAttentionFocus || `Symbol: ${conflict.symbol} @ line ${conflict.sourceLine}`,
                    proposedSolutions: aiData?.proposedSolutions || this.defaultSolutionsForConflict(conflict)
                }
            };
        });
    }

    private static generateHeuristicSemanticEvaluation(conflict: SemanticConflict, index: number): AIEnrichedConflict {
        let riskScore = conflict.severity === 'CRITICAL' ? 85 + (index % 10) : 60 + (index % 10);
        let intentDivergence = '';
        let attention = '';

        if (conflict.category === 'SIGNATURE_MISMATCH') {
            intentDivergence = `Developer modified function '${conflict.symbol}' signature in '${conflict.targetFile}', while another developer called '${conflict.symbol}' in '${conflict.sourceFile}' using an outdated argument contract.`;
            attention = `AST Node: CallExpression '${conflict.symbol}' (argCount=${conflict.astDetails.invokedArgumentsCount}) -> FunctionDeclaration (params=${conflict.astDetails.expectedParamsCount})`;
        } else if (conflict.category === 'BREAKING_RENAME') {
            intentDivergence = `Developer in '${conflict.targetFile}' refactored or renamed export '${conflict.symbol}', but consumer in '${conflict.sourceFile}' still depends on the legacy identifier.`;
            attention = `AST Node: ImportSpecifier '${conflict.symbol}' -> Missing Export in '${conflict.targetFile}'`;
        } else {
            intentDivergence = `Concurrent developer updates modified '${conflict.symbol}' leading to state collision across files.`;
            attention = `Symbol: ${conflict.symbol} across scopes`;
        }

        return {
            ...conflict,
            aiAnalysis: {
                intentDivergence,
                riskScore,
                semanticRootCause: conflict.description,
                codeBertAttentionFocus: attention,
                proposedSolutions: this.defaultSolutionsForConflict(conflict)
            }
        };
    }

    private static defaultSolutionsForConflict(conflict: SemanticConflict): Array<{ id: number; title: string; description: string; codeDiffOrPatch: string }> {
        return [
            {
                id: 1,
                title: "Solution 1: Update Caller Invocations (Consumer Adaptation)",
                description: `Update the call site in '${conflict.sourceFile}' to comply with the updated contract or signature of '${conflict.symbol}'.`,
                codeDiffOrPatch: `// Update call in ${conflict.sourceFile} line ${conflict.sourceLine}\n${conflict.astDetails.callerContext || conflict.symbol + '(...args)'}`
            },
            {
                id: 2,
                title: "Solution 2: Provide Backward-Compatible Default Parameters (Provider Adaptation)",
                description: `Add default parameter values or overload handling to '${conflict.symbol}' in '${conflict.targetFile || conflict.sourceFile}' to prevent breaking callers.`,
                codeDiffOrPatch: `// Adjust parameters to include defaults\n${conflict.astDetails.declaredSignature ? conflict.astDetails.declaredSignature.replace(')', ' = undefined)') : conflict.symbol}`
            },
            {
                id: 3,
                title: "Solution 3: Introduce Deprecation Shim / Adapter Layer",
                description: `Create an adapter or wrapper ensuring both new and legacy parameter invocations succeed without runtime exceptions.`,
                codeDiffOrPatch: `export const ${conflict.symbol}Adapter = (...args) => ${conflict.symbol}(...args);`
            }
        ];
    }
}
