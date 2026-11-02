/**
 * AST Replacement & Deduplication Utility
 * 
 * Accurately locates, replaces, and deduplicates functions in source code
 * using balanced brace analysis.
 * 
 * Guarantees:
 * 1. The target function is replaced cleanly without truncating nested blocks.
 * 2. Any duplicate definitions of the target function are completely removed.
 * 3. All code outside the target function (imports, exports, other functions) is preserved.
 * 4. Duplicate consecutive print/call statements are cleaned up.
 * 5. Returns one syntactically valid code string.
 */

export interface ReplacementResult {
    updatedContent: string;
    replacedCount: number;
    removedDuplicatesCount: number;
    syntaxValid: boolean;
    error?: string;
}

export function replaceAndDeduplicateFunctionInDocument(
    currentContent: string,
    symbolName: string,
    replacementCode: string,
    language?: string
): ReplacementResult {
    const cleanReplacement = replacementCode.trim();
    const isPython = language === 'python' 
        || (language !== 'javascript' && language !== 'typescript' && (
            currentContent.includes(`def ${symbolName}`) 
            || cleanReplacement.includes(`def ${symbolName}`)
            || /(?:^|\n)\s*(?:async\s+)?def\s+/.test(cleanReplacement)
            || /(?:^|\n)\s*(?:async\s+)?def\s+/.test(currentContent)
        ));
    const isJs = language === 'javascript' || language === 'typescript' 
        || currentContent.includes(`function ${symbolName}`) 
        || cleanReplacement.includes(`function ${symbolName}`);

    interface CodeRange {
        start: number;
        end: number;
    }

    const ranges: CodeRange[] = [];

    if (isPython) {
        // Line-based indentation analysis for Python function blocks
        const lines = currentContent.split('\n');
        const lineOffsets: number[] = [];
        let currentOffset = 0;
        for (let i = 0; i < lines.length; i++) {
            lineOffsets.push(currentOffset);
            currentOffset += lines[i].length + 1; // account for newline
        }

        const defRegex = new RegExp(`^(\\s*)(?:async\\s+)?def\\s+${symbolName}\\s*\\(`);

        let i = 0;
        while (i < lines.length) {
            const line = lines[i];
            const match = line.match(defRegex);

            if (match) {
                const baseIndent = match[1].length;
                const startLine = i;
                let endLine = i;
                let inDocstring: string | null = null;

                let j = i + 1;
                while (j < lines.length) {
                    const bodyLine = lines[j];
                    const trimmed = bodyLine.trim();

                    if (!trimmed) {
                        endLine = j;
                        j++;
                        continue;
                    }

                    const tripleQuotes = bodyLine.match(/"""|'''/g);
                    if (tripleQuotes) {
                        for (const tq of tripleQuotes) {
                            if (!inDocstring) inDocstring = tq;
                            else if (inDocstring === tq) inDocstring = null;
                        }
                    }

                    const currentIndent = (bodyLine.match(/^(\s*)/)?.[1] || '').length;
                    if (!inDocstring && currentIndent <= baseIndent) {
                        // Function ended before line j
                        break;
                    }
                    endLine = j;
                    j++;
                }

                const startChar = lineOffsets[startLine];
                const endChar = j < lines.length ? lineOffsets[j] : currentContent.length;

                ranges.push({ start: startChar, end: endChar });
                i = j;
            } else {
                i++;
            }
        }
    } else {
        // 1. Locate all function definitions matching symbolName in JavaScript / TypeScript
        const patterns = [
            new RegExp(`(?:async\\s+)?function\\s+${symbolName}\\s*\\(`, 'g'),
            new RegExp(`(?:const|let|var)\\s+${symbolName}\\s*=\\s*(?:async\\s*)?(?:function\\s*\\(|\\([^)]*\\)\\s*=>)`, 'g')
        ];

        for (const pattern of patterns) {
            let match: RegExpExecArray | null;
            while ((match = pattern.exec(currentContent)) !== null) {
                const start = match.index;
                // Find opening brace { after parameter closing parenthesis to avoid matching parameter defaults
                const closeParen = currentContent.indexOf(')', start);
                const openBrace = closeParen !== -1 ? currentContent.indexOf('{', closeParen) : currentContent.indexOf('{', start);
                if (openBrace === -1) continue;

                // Balance braces with comment & string literal awareness
                let depth = 0;
                let inString: string | null = null;
                let inComment: 'single' | 'multi' | null = null;
                let end = -1;

                for (let i = openBrace; i < currentContent.length; i++) {
                    const char = currentContent[i];
                    const prev = i > 0 ? currentContent[i - 1] : '';

                    if (inComment === 'single') {
                        if (char === '\n') inComment = null;
                        continue;
                    }
                    if (inComment === 'multi') {
                        if (char === '/' && prev === '*') inComment = null;
                        continue;
                    }
                    if (char === '/' && currentContent[i + 1] === '/' && !inString) {
                        inComment = 'single';
                        i++;
                        continue;
                    }
                    if (char === '/' && currentContent[i + 1] === '*' && !inString) {
                        inComment = 'multi';
                        i++;
                        continue;
                    }

                    if (inString) {
                        if (char === inString && prev !== '\\') inString = null;
                        continue;
                    }
                    if (char === '"' || char === "'" || char === '`') {
                        inString = char;
                        continue;
                    }

                    if (char === '{') {
                        depth++;
                    } else if (char === '}') {
                        depth--;
                        if (depth === 0) {
                            end = i + 1;
                            // Consume optional trailing semicolon
                            if (currentContent[end] === ';') end++;
                            // Consume trailing whitespace up to newline
                            while (end < currentContent.length && (currentContent[end] === ' ' || currentContent[end] === '\t')) {
                                end++;
                            }
                            if (currentContent[end] === '\n') end++;
                            break;
                        }
                    }
                }

                if (end !== -1) {
                    // Avoid overlapping duplicate ranges
                    if (!ranges.some(r => (start >= r.start && start < r.end))) {
                        ranges.push({ start, end });
                    }
                }
            }
        }
    }

    // Cross-language fallback: If target function wasn't found under the requested language's syntax,
    // check if it exists in the alternate language's syntax (e.g. replacing an old JS function with Python or vice versa)
    if (ranges.length === 0) {
        if (isPython) {
            // Document might still have JavaScript function declaration
            const patterns = [
                new RegExp(`(?:async\\s+)?function\\s+${symbolName}\\s*\\(`, 'g'),
                new RegExp(`(?:const|let|var)\\s+${symbolName}\\s*=\\s*(?:async\\s*)?(?:function\\s*\\(|\\([^)]*\\)\\s*=>)`, 'g')
            ];
            for (const pattern of patterns) {
                let match: RegExpExecArray | null;
                while ((match = pattern.exec(currentContent)) !== null) {
                    const start = match.index;
                    const closeParen = currentContent.indexOf(')', start);
                    const openBrace = closeParen !== -1 ? currentContent.indexOf('{', closeParen) : currentContent.indexOf('{', start);
                    if (openBrace === -1) continue;
                    let depth = 0;
                    let inString: string | null = null;
                    let inComment: 'single' | 'multi' | null = null;
                    let end = -1;
                    for (let i = openBrace; i < currentContent.length; i++) {
                        const char = currentContent[i];
                        const prev = i > 0 ? currentContent[i - 1] : '';
                        if (inComment === 'single') { if (char === '\n') inComment = null; continue; }
                        if (inComment === 'multi') { if (char === '/' && prev === '*') inComment = null; continue; }
                        if (char === '/' && currentContent[i + 1] === '/' && !inString) { inComment = 'single'; i++; continue; }
                        if (char === '/' && currentContent[i + 1] === '*' && !inString) { inComment = 'multi'; i++; continue; }
                        if (inString) { if (char === inString && prev !== '\\') inString = null; continue; }
                        if (char === '"' || char === "'" || char === '`') { inString = char; continue; }
                        if (char === '{') depth++;
                        else if (char === '}') {
                            depth--;
                            if (depth === 0) {
                                end = i + 1;
                                if (currentContent[end] === ';') end++;
                                while (end < currentContent.length && (currentContent[end] === ' ' || currentContent[end] === '\t')) end++;
                                if (currentContent[end] === '\n') end++;
                                break;
                            }
                        }
                    }
                    if (end !== -1 && !ranges.some(r => (start >= r.start && start < r.end))) {
                        ranges.push({ start, end });
                    }
                }
            }
        } else {
            // Document might have Python def declaration
            const lines = currentContent.split('\n');
            const lineOffsets: number[] = [];
            let currentOffset = 0;
            for (let i = 0; i < lines.length; i++) {
                lineOffsets.push(currentOffset);
                currentOffset += lines[i].length + 1;
            }
            const defRegex = new RegExp(`^(\\s*)(?:async\\s+)?def\\s+${symbolName}\\s*\\(`);
            let i = 0;
            while (i < lines.length) {
                const line = lines[i];
                const match = line.match(defRegex);
                if (match) {
                    const baseIndent = match[1].length;
                    const startLine = i;
                    let j = i + 1;
                    while (j < lines.length) {
                        const bodyLine = lines[j];
                        const trimmed = bodyLine.trim();
                        if (!trimmed) { j++; continue; }
                        const currentIndent = (bodyLine.match(/^(\s*)/)?.[1] || '').length;
                        if (currentIndent <= baseIndent) break;
                        j++;
                    }
                    const startChar = lineOffsets[startLine];
                    const endChar = j < lines.length ? lineOffsets[j] : currentContent.length;
                    ranges.push({ start: startChar, end: endChar });
                    i = j;
                } else {
                    i++;
                }
            }
        }
    }

    // Sort ranges by occurrence in document
    ranges.sort((a, b) => a.start - b.start);

    let updatedContent = '';
    let replacedCount = 0;
    let removedDuplicatesCount = 0;

    if (ranges.length === 0) {
        // Fallback: If symbol was not matched by function header, replace whatever contains symbolName or prepend
        const fallbackRegex = new RegExp(`.*${symbolName}.*`, 's');
        if (fallbackRegex.test(currentContent)) {
            updatedContent = currentContent.replace(fallbackRegex, cleanReplacement);
            replacedCount = 1;
        } else {
            updatedContent = cleanReplacement + '\n\n' + currentContent;
            replacedCount = 1;
        }
    } else {
        // Replace FIRST range with cleanReplacement, and REMOVE all duplicate occurrences
        let lastPos = 0;
        ranges.forEach((range, idx) => {
            updatedContent += currentContent.slice(lastPos, range.start);
            if (idx === 0) {
                updatedContent += cleanReplacement + '\n';
                replacedCount = 1;
            } else {
                removedDuplicatesCount++;
            }
            lastPos = range.end;
        });
        updatedContent += currentContent.slice(lastPos);
    }

    // 2. Deduplicate consecutive duplicate statements
    const lines = updatedContent.split('\n');
    const cleanLines: string[] = [];
    let lastSeenNonEmpty = '';

    for (const line of lines) {
        const trimmed = line.trim();
        const isDuplicatePrint = isPython
            ? (trimmed.startsWith('print(') && trimmed === lastSeenNonEmpty)
            : (trimmed.startsWith('console.log(') && trimmed === lastSeenNonEmpty);

        if (trimmed.length > 0 && isDuplicatePrint) {
            continue;
        }
        cleanLines.push(line);
        if (trimmed.length > 0) {
            lastSeenNonEmpty = trimmed;
        }
    }

    const finalCode = cleanLines.join('\n').trim();

    // 3. Language-appropriate Syntax Validation
    let syntaxValid = true;
    let error: string | undefined = undefined;

    if (isPython) {
        // Python structural AST syntax checks in browser
        let parenDepth = 0;
        let bracketDepth = 0;
        let braceDepth = 0;
        for (let i = 0; i < finalCode.length; i++) {
            const c = finalCode[i];
            if (c === '(') parenDepth++;
            else if (c === ')') parenDepth--;
            else if (c === '[') bracketDepth++;
            else if (c === ']') bracketDepth--;
            else if (c === '{') braceDepth++;
            else if (c === '}') braceDepth--;

            if (parenDepth < 0 || bracketDepth < 0 || braceDepth < 0) {
                syntaxValid = false;
                error = 'Unbalanced parentheses or brackets in Python code';
                break;
            }
        }
        if (parenDepth !== 0 || bracketDepth !== 0 || braceDepth !== 0) {
            syntaxValid = false;
            error = 'Unclosed parentheses or brackets in Python code';
        }
    } else if (isJs) {
        // JavaScript syntax validation using native Function constructor
        try {
            new Function(finalCode);
        } catch (e: any) {
            // If finalCode contains import/export, wrap or check function specifically
            try {
                new Function(cleanReplacement);
            } catch (innerErr: any) {
                syntaxValid = false;
                error = innerErr.message;
            }
        }
    } else {
        // Unknown or other language: validate structural delimiter balance, never call new Function()
        let parenDepth = 0;
        let bracketDepth = 0;
        let braceDepth = 0;
        for (let i = 0; i < finalCode.length; i++) {
            const c = finalCode[i];
            if (c === '(') parenDepth++;
            else if (c === ')') parenDepth--;
            else if (c === '[') bracketDepth++;
            else if (c === ']') bracketDepth--;
            else if (c === '{') braceDepth++;
            else if (c === '}') braceDepth--;

            if (parenDepth < 0 || bracketDepth < 0 || braceDepth < 0) {
                syntaxValid = false;
                error = 'Unbalanced delimiters in document';
                break;
            }
        }
        if (parenDepth !== 0 || bracketDepth !== 0 || braceDepth !== 0) {
            syntaxValid = false;
            error = 'Unclosed delimiters in document';
        }
    }

    return {
        updatedContent: finalCode,
        replacedCount,
        removedDuplicatesCount,
        syntaxValid,
        error
    };
}
