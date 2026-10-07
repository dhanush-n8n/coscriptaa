/**
 * AST PARSER SERVICE
 * 
 * Extracts Abstract Syntax Tree (AST) representations from code files.
 * Captures:
 * - Function declarations (name, parameters, defaults, async, export)
 * - Call expressions (invoked function, argument count, line)
 * - Variable and constant declarations
 * - Import and export declarations
 * 
 * Supports JavaScript, TypeScript, Python, and C-like syntaxes.
 */

export interface ASTFunction {
    name: string;
    params: string[];
    minParams: number;
    maxParams: number;
    isAsync: boolean;
    isExported: boolean;
    startLine: number;
    endLine: number;
    file: string;
    rawSignature: string;
    bodySnippet?: string;
    returnOperation?: string;
    returnExpression?: string;
}

export interface ASTCallExpression {
    calleeName: string;
    argumentCount: number;
    argumentsText: string[];
    line: number;
    file: string;
    contextLine: string;
    enclosingFunction?: string;
}

export interface ASTVariable {
    name: string;
    kind: 'const' | 'let' | 'var' | 'def' | 'val';
    isExported: boolean;
    line: number;
    file: string;
}

export interface ASTImport {
    symbols: string[];
    source: string;
    line: number;
    file: string;
}

export interface ASTExport {
    symbols: string[];
    line: number;
    file: string;
}

export interface FileAST {
    file: string;
    language: string;
    functions: ASTFunction[];
    calls: ASTCallExpression[];
    variables: ASTVariable[];
    imports: ASTImport[];
    exports: ASTExport[];
}

export class ASTParser {
    /**
     * Parses a code string into a structural AST representation
     */
    public static parseFile(fileName: string, code: string, language?: string): FileAST {
        const lang = language || this.detectLanguage(fileName);
        const lines = code.split('\n');

        const functions: ASTFunction[] = [];
        const calls: ASTCallExpression[] = [];
        const variables: ASTVariable[] = [];
        const imports: ASTImport[] = [];
        const exports: ASTExport[] = [];

        if (lang === 'python') {
            this.parsePython(lines, fileName, { functions, calls, variables, imports, exports });
        } else {
            // Default to JS/TS-like syntax
            this.parseJavaScript(lines, fileName, { functions, calls, variables, imports, exports });
        }

        // Attach enclosingFunction to each call expression
        calls.forEach(call => {
            const enclosing = functions.find(fn => call.line >= fn.startLine && call.line <= fn.endLine);
            if (enclosing) {
                call.enclosingFunction = enclosing.name;
            }
        });

        return {
            file: fileName,
            language: lang,
            functions,
            calls,
            variables,
            imports,
            exports
        };
    }

    private static detectLanguage(fileName: string): string {
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (ext === 'py') return 'python';
        if (ext === 'ts' || ext === 'tsx') return 'typescript';
        if (ext === 'cpp' || ext === 'c' || ext === 'h') return 'cpp';
        if (ext === 'go') return 'go';
        return 'javascript';
    }

    /**
     * Parse JavaScript and TypeScript structural elements
     */
    private static parseJavaScript(
        lines: string[], 
        fileName: string, 
        ast: { functions: ASTFunction[]; calls: ASTCallExpression[]; variables: ASTVariable[]; imports: ASTImport[]; exports: ASTExport[] }
    ) {
        // Regex patterns
        // 1. function declaration: export? async? function name(a, b = 1)
        const funcDeclRegex = /(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)/;
        
        // 2. arrow / const function: export? const name = async? (a, b) =>
        const arrowFuncRegex = /(?:export\s+)?(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?(?:\(([^)]*)\)|([a-zA-Z0-9_$]+))\s*=>/;

        // 3. variable declaration: export? const/let/var x =
        const varDeclRegex = /(?:export\s+)?(const|let|var)\s+([a-zA-Z0-9_$]+)\s*=/;

        // 4. import: import { a, b } from './utils.js' or import x from 'y'
        const importRegex = /import\s+(?:\{([^}]+)\}|([a-zA-Z0-9_$]+))\s+from\s+['"]([^'"]+)['"]/;

        // 5. export: export { a, b } or export function/const
        const exportNamedRegex = /export\s+\{([^}]+)\}/;

        // 6. call expression: name(arg1, arg2)
        const callRegex = /([a-zA-Z0-9_$]+)\s*\(([^)]*)\)/g;

        lines.forEach((lineText, idx) => {
            const lineNum = idx + 1;
            const trimmed = lineText.trim();
            if (trimmed.startsWith('//') || trimmed.startsWith('/*')) return;

            const isExported = trimmed.startsWith('export');

            // --- FUNCTION DECLARATION ---
            let match = trimmed.match(funcDeclRegex);
            if (match) {
                const name = match[1];
                const rawParams = match[2];
                const params = this.extractParams(rawParams);
                const minParams = params.filter(p => !p.includes('=')).length;

                // Lookahead for function body & return statement
                let returnExpr = '';
                let returnOp = '';
                const bodyLines: string[] = [];
                for (let j = idx; j < Math.min(lines.length, idx + 30); j++) {
                    const l = lines[j];
                    bodyLines.push(l);
                    const retMatch = l.match(/return\s+([^;]+)/);
                    if (retMatch && !returnExpr) {
                        returnExpr = retMatch[1].trim();
                        returnOp = this.detectOperation(returnExpr);
                    }
                    if (j > idx && l.includes('}') && !l.includes('{')) break;
                }

                ast.functions.push({
                    name,
                    params: params.map(p => p.split('=')[0].trim().split(':')[0].trim()),
                    minParams,
                    maxParams: params.length,
                    isAsync: trimmed.includes('async '),
                    isExported,
                    startLine: lineNum,
                    endLine: Math.min(lines.length, idx + bodyLines.length),
                    file: fileName,
                    rawSignature: `function ${name}(${rawParams.trim()})`,
                    bodySnippet: bodyLines.join('\n'),
                    returnExpression: returnExpr,
                    returnOperation: returnOp
                });
            }

            // --- ARROW FUNCTION ---
            match = trimmed.match(arrowFuncRegex);
            if (match) {
                const name = match[1];
                const rawParams = match[2] !== undefined ? match[2] : match[3];
                const params = this.extractParams(rawParams || '');
                const minParams = params.filter(p => !p.includes('=')).length;

                let returnExpr = '';
                let returnOp = '';
                const bodyLines: string[] = [];
                for (let j = idx; j < Math.min(lines.length, idx + 30); j++) {
                    const l = lines[j];
                    bodyLines.push(l);
                    const retMatch = l.match(/return\s+([^;]+)/);
                    if (retMatch && !returnExpr) {
                        returnExpr = retMatch[1].trim();
                        returnOp = this.detectOperation(returnExpr);
                    }
                    if (j > idx && l.includes('}') && !l.includes('{')) break;
                }

                ast.functions.push({
                    name,
                    params: params.map(p => p.split('=')[0].trim().split(':')[0].trim()),
                    minParams,
                    maxParams: params.length,
                    isAsync: trimmed.includes('async'),
                    isExported,
                    startLine: lineNum,
                    endLine: Math.min(lines.length, idx + bodyLines.length),
                    file: fileName,
                    rawSignature: `const ${name} = (${(rawParams || '').trim()}) =>`,
                    bodySnippet: bodyLines.join('\n'),
                    returnExpression: returnExpr,
                    returnOperation: returnOp
                });
            }

            // --- VARIABLES ---
            match = trimmed.match(varDeclRegex);
            if (match && !trimmed.includes('=>')) {
                ast.variables.push({
                    name: match[2],
                    kind: match[1] as any,
                    isExported,
                    line: lineNum,
                    file: fileName
                });
            }

            // --- IMPORTS ---
            match = trimmed.match(importRegex);
            if (match) {
                const symbolsStr = match[1] || match[2] || '';
                const symbols = symbolsStr.split(',').map(s => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean);
                ast.imports.push({
                    symbols,
                    source: match[3],
                    line: lineNum,
                    file: fileName
                });
            }

            // --- NAMED EXPORTS ---
            match = trimmed.match(exportNamedRegex);
            if (match) {
                const symbols = match[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean);
                ast.exports.push({
                    symbols,
                    line: lineNum,
                    file: fileName
                });
            }

            // --- CALL EXPRESSIONS ---
            // Find all invocation patterns in the line
            let callMatch: RegExpExecArray | null;
            const re = new RegExp(callRegex);
            while ((callMatch = re.exec(trimmed)) !== null) {
                const callee = callMatch[1];
                // Ignore JS control flow keywords that use parentheses
                if (['if', 'for', 'while', 'switch', 'catch', 'function', 'return', 'import', 'require'].includes(callee)) {
                    continue;
                }
                const rawArgs = callMatch[2];
                const args = this.extractParams(rawArgs);

                ast.calls.push({
                    calleeName: callee,
                    argumentCount: rawArgs.trim() === '' ? 0 : args.length,
                    argumentsText: args,
                    line: lineNum,
                    file: fileName,
                    contextLine: trimmed
                });
            }
        });
    }

    /**
     * Parse Python structural elements
     */
    private static parsePython(
        lines: string[], 
        fileName: string, 
        ast: { functions: ASTFunction[]; calls: ASTCallExpression[]; variables: ASTVariable[]; imports: ASTImport[]; exports: ASTExport[] }
    ) {
        const pyFuncRegex = /def\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/;
        const pyImportFromRegex = /from\s+([a-zA-Z0-9_.]+)\s+import\s+([^#\n]+)/;
        const pyImportRegex = /import\s+([^#\n]+)/;
        const callRegex = /([a-zA-Z0-9_]+)\s*\(([^)]*)\)/g;

        lines.forEach((lineText, idx) => {
            const lineNum = idx + 1;
            const trimmed = lineText.trim();
            if (trimmed.startsWith('#')) return;

            // def func(a, b=2):
            let match = trimmed.match(pyFuncRegex);
            if (match) {
                const name = match[1];
                const rawParams = match[2];
                const params = this.extractParams(rawParams).filter(p => p !== 'self' && p !== 'cls');
                const minParams = params.filter(p => !p.includes('=')).length;
                ast.functions.push({
                    name,
                    params: params.map(p => p.split('=')[0].trim().split(':')[0].trim()),
                    minParams,
                    maxParams: params.length,
                    isAsync: trimmed.startsWith('async def'),
                    isExported: true, // Python exports top-level defs by default
                    startLine: lineNum,
                    endLine: lineNum,
                    file: fileName,
                    rawSignature: `def ${name}(${rawParams.trim()}):`
                });
            }

            // from module import a, b
            match = trimmed.match(pyImportFromRegex);
            if (match) {
                const symbols = match[2].split(',').map(s => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean);
                ast.imports.push({
                    symbols,
                    source: match[1],
                    line: lineNum,
                    file: fileName
                });
            }

            // call expressions
            let callMatch: RegExpExecArray | null;
            const re = new RegExp(callRegex);
            while ((callMatch = re.exec(trimmed)) !== null) {
                const callee = callMatch[1];
                if (['if', 'for', 'while', 'def', 'class', 'elif', 'return', 'except'].includes(callee)) {
                    continue;
                }
                const rawArgs = callMatch[2];
                const args = this.extractParams(rawArgs);

                ast.calls.push({
                    calleeName: callee,
                    argumentCount: rawArgs.trim() === '' ? 0 : args.length,
                    argumentsText: args,
                    line: lineNum,
                    file: fileName,
                    contextLine: trimmed
                });
            }
        });
    }

    /**
     * Splits comma-separated arguments/parameters while respecting nested brackets
     */
    private static extractParams(str: string): string[] {
        if (!str || str.trim() === '') return [];
        const result: string[] = [];
        let depth = 0;
        let current = '';

        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            if (char === '(' || char === '[' || char === '{') depth++;
            else if (char === ')' || char === ']' || char === '}') depth--;
            
            if (char === ',' && depth === 0) {
                if (current.trim()) result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        if (current.trim()) result.push(current.trim());
        return result;
    }

    /**
     * Determines the primary arithmetic or logical operator inside a return expression
     */
    public static detectOperation(expr: string): string {
        const cleaned = expr.trim();
        if (/\+/.test(cleaned) && !/\+\+/.test(cleaned)) return 'Addition (+)';
        if (/\*/.test(cleaned) && !/\*\*/.test(cleaned)) return 'Multiplication (*)';
        if (/\-/.test(cleaned) && !/\-\-/.test(cleaned)) return 'Subtraction (-)';
        if (/\//.test(cleaned)) return 'Division (/)';
        if (/%/.test(cleaned)) return 'Modulo (%)';
        if (/&&|\|\|/.test(cleaned)) return 'Logical Boolean';
        if (/===|!==|==|!=/.test(cleaned)) return 'Equality Comparison';
        return 'Expression';
    }
}

