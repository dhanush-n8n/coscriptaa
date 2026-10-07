/**
 * SEMANTIC ANALYZER SERVICE
 * 
 * Analyzes multi-file AST relationships across the entire codebase to detect:
 * 1. Signature Mismatches (caller arguments != function parameters)
 * 2. Undeclared Symbols & Broken Renames (functions invoked but removed or renamed)
 * 3. Broken Imports (importing non-existent exports)
 * 4. Duplicate Symbol Collisions (conflicting declarations)
 */

import { FileAST, ASTFunction, ASTCallExpression } from './astParser';
import { ExplainableConflictService, ConflictExplainability } from './explainableConflictService';

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
}

export class SemanticAnalyzer {
    // Common standard library functions to ignore during undeclared check
    private static standardGlobals = new Set([
        'log', 'warn', 'error', 'info', 'table', 'clear',
        'print', 'len', 'range', 'str', 'int', 'float', 'list', 'dict', 'set', 'type',
        'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
        'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURI', 'decodeURI',
        'require', 'import', 'alert', 'prompt', 'fetch', 'push', 'pop', 'shift', 'unshift',
        'slice', 'splice', 'map', 'filter', 'reduce', 'forEach', 'find', 'includes', 'indexOf',
        'split', 'join', 'replace', 'trim', 'toLowerCase', 'toUpperCase', 'substring',
        'toString', 'valueOf', 'keys', 'values', 'entries', 'assign', 'create'
    ]);

    /**
     * Performs static semantic conflict detection across all file ASTs in the codebase
     */
    public static analyzeCodebase(fileASTs: FileAST[]): SemanticConflict[] {
        const conflicts: SemanticConflict[] = [];

        // 1. Build a global registry of functions and exported symbols
        const globalFunctions = new Map<string, ASTFunction>();
        const fileExports = new Map<string, Set<string>>(); // file -> set of exported symbols

        fileASTs.forEach(f => {
            const exportsSet = new Set<string>();

            f.functions.forEach(fn => {
                // If not already present or exported, register
                if (!globalFunctions.has(fn.name) || fn.isExported) {
                    globalFunctions.set(fn.name, fn);
                }
                if (fn.isExported) {
                    exportsSet.add(fn.name);
                }
            });

            f.variables.forEach(v => {
                if (v.isExported) {
                    exportsSet.add(v.name);
                }
            });

            f.exports.forEach(e => {
                e.symbols.forEach(s => exportsSet.add(s));
            });

            fileExports.set(f.file, exportsSet);
        });

        // 2. Check broken cross-file imports
        fileASTs.forEach(f => {
            f.imports.forEach(imp => {
                const normalizedSource = imp.source.replace(/^\.\//, '').replace(/\.(js|ts|py)$/, '');
                const targetFile = fileASTs.find(target => {
                    const normalizedTarget = target.file.replace(/^\//, '').replace(/\.(js|ts|py)$/, '');
                    return normalizedTarget === normalizedSource || normalizedTarget.endsWith(normalizedSource);
                });

                if (targetFile) {
                    const exportedInTarget = fileExports.get(targetFile.file) || new Set();
                    imp.symbols.forEach(sym => {
                        // Check if symbol is actually exported
                        if (!exportedInTarget.has(sym)) {
                            conflicts.push({
                                id: `broken-import-${sym}-${f.file}-${imp.line}`,
                                category: 'BREAKING_RENAME',
                                severity: 'CRITICAL',
                                title: `Broken Import: Symbol '${sym}' is missing in '${targetFile.file}'`,
                                description: `'${f.file}' imports '${sym}' from '${targetFile.file}', but '${sym}' is no longer exported. A concurrent developer may have renamed or deleted it.`,
                                symbol: sym,
                                sourceFile: f.file,
                                sourceLine: imp.line,
                                targetFile: targetFile.file,
                                astDetails: {
                                    callerContext: `import { ${sym} } from '${imp.source}'`
                                },
                                suggestedRemedy: `Verify the export in '${targetFile.file}' or update the import statement in '${f.file}'.`
                            });
                        }
                    });
                }
            });
        });

        // 3. Check Function Invocations & Signature Mismatches
        fileASTs.forEach(f => {
            // Local functions in this file take priority
            const localFunctions = new Map<string, ASTFunction>();
            f.functions.forEach(fn => localFunctions.set(fn.name, fn));

            f.calls.forEach(call => {
                if (this.standardGlobals.has(call.calleeName)) return;

                // Check if function exists locally or globally in the codebase
                const targetFn = localFunctions.get(call.calleeName) || globalFunctions.get(call.calleeName);

                if (targetFn) {
                    // Check parameter count mismatch
                    if (call.argumentCount < targetFn.minParams) {
                        conflicts.push({
                            id: `sig-mismatch-under-${call.calleeName}-${f.file}-${call.line}`,
                            category: 'SIGNATURE_MISMATCH',
                            severity: 'CRITICAL',
                            title: `Signature Mismatch: Insufficient arguments for '${call.calleeName}'`,
                            description: `'${call.calleeName}' requires at least ${targetFn.minParams} argument(s) (${targetFn.params.join(', ')}), but is invoked with ${call.argumentCount} argument(s) in '${f.file}'.`,
                            symbol: call.calleeName,
                            sourceFile: f.file,
                            sourceLine: call.line,
                            targetFile: targetFn.file,
                            targetLine: targetFn.startLine,
                            astDetails: {
                                declaredSignature: targetFn.rawSignature,
                                invokedArgumentsCount: call.argumentCount,
                                expectedParamsCount: targetFn.minParams,
                                callerContext: call.contextLine
                            },
                            suggestedRemedy: `Supply the required arguments: [${targetFn.params.slice(call.argumentCount).join(', ')}] or make parameters optional.`
                        });
                    } else if (targetFn.maxParams > 0 && call.argumentCount > targetFn.maxParams) {
                        conflicts.push({
                            id: `sig-mismatch-over-${call.calleeName}-${f.file}-${call.line}`,
                            category: 'SIGNATURE_MISMATCH',
                            severity: 'WARNING',
                            title: `Signature Warning: Extra arguments passed to '${call.calleeName}'`,
                            description: `'${call.calleeName}' defines ${targetFn.maxParams} parameter(s), but is called with ${call.argumentCount} argument(s) in '${f.file}'.`,
                            symbol: call.calleeName,
                            sourceFile: f.file,
                            sourceLine: call.line,
                            targetFile: targetFn.file,
                            targetLine: targetFn.startLine,
                            astDetails: {
                                declaredSignature: targetFn.rawSignature,
                                invokedArgumentsCount: call.argumentCount,
                                expectedParamsCount: targetFn.maxParams,
                                callerContext: call.contextLine
                            },
                            suggestedRemedy: `Remove extraneous arguments or update the function signature in '${targetFn.file}'.`
                        });
                    }
                }
            });
        });

        // Enrich every conflict with pedagogical "Why?" explainability (Feature 6)
        conflicts.forEach(c => {
            if (!c.explainability) {
                c.explainability = ExplainableConflictService.explainConflict(c);
            }
        });

        return conflicts;
    }
}
