/**
 * EXPLAINABLE CONFLICT DETECTION SERVICE
 * 
 * Feature 6: Explainable Conflict Detection
 * Explains WHY a conflict has occurred, such as:
 * 1. Type Mismatch (e.g. user_id changed from int -> string, while getUser() expects int)
 * 2. Changed Function Interface (e.g. parameter arity or signature changed)
 * 3. Duplicate Declaration (e.g. colliding variable or function declarations in same scope)
 * 4. Incompatible Dependency (e.g. cross-module import expecting deprecated or altered exports)
 * 
 * Makes the AI explanation pedagogical and transparent for students and developers,
 * moving beyond generic "Merge conflict detected" messages:
 * "This makes the AI useful for students and developers, not just automatic merging."
 */

import { SemanticConflict } from './semanticAnalyzer';

export interface ConflictExplainability {
    cause: string;               // e.g. "Developer A changed user_id from int -> string."
    expectation: string;         // e.g. "Developer B's function still expects int."
    impact: string;              // e.g. "This may cause a type mismatch in getUser()."
    category: 'TYPE_MISMATCH' | 'CHANGED_FUNCTION_INTERFACE' | 'DUPLICATE_DECLARATION' | 'INCOMPATIBLE_DEPENDENCY';
    categoryLabel: string;
    educationalExplanation: string; // Pedagogical breakdown for students & developers
    targetEntity: string;        // e.g. "user_id" / "getUser()"
    devAName: string;
    devBName: string;
    beforeType?: string;
    afterType?: string;
    devACodeSnippet?: string;
    devBCodeSnippet?: string;
    remediationGuide: string;
}

export interface AIConflictExplanationData {
    conflictNumber: number; // 24
    conflictTag: string; // "CONFLICT #24"
    type: string; // "Semantic Conflict"
    severity: string; // "HIGH"
    developerA: {
        name: string; // "Developer A"
        changed: string; // "calculateSalary(employeeId)"
        codeSnippet?: string;
    };
    developerB: {
        name: string; // "Developer B"
        changed: string; // "calculateSalary(employee)"
        codeSnippet?: string;
    };
    why: string; // "The function interface was modified by Developer A, while Developer B is still passing an integer ID."
    aiSuggestion: string; // "Convert Developer B's call to employee.id"
    confidence: string; // "94%"
    confidenceScore: number; // 94
    validationChecks: Array<{
        name: string;
        passed: boolean;
    }>;
}

export class ExplainableConflictService {
    /**
     * Generates a pedagogical "Why?" explanation for any detected conflict
     */
    public static explainConflict(conflict: SemanticConflict): ConflictExplainability {
        // 1. Check for Type Mismatch
        if (conflict.category === 'TYPE_MISMATCH' || conflict.description.toLowerCase().includes('type')) {
            return this.buildTypeMismatchExplanation(conflict);
        }

        // 2. Check for Duplicate Declaration
        if (conflict.category === 'DUPLICATE_DECLARATION') {
            return this.buildDuplicateDeclarationExplanation(conflict);
        }

        // 3. Check for Incompatible Dependency / Broken Import
        if (conflict.category === 'BREAKING_RENAME') {
            return this.buildIncompatibleDependencyExplanation(conflict);
        }

        // 4. Default: Changed Function Interface
        return this.buildChangedInterfaceExplanation(conflict);
    }

    /**
     * Exact Scenario from User Screenshot: "3. One particularly good feature: AI Conflict Explanation"
     * 
     * CONFLICT #24
     * Type: Semantic Conflict
     * Severity: HIGH
     * Developer A: Changed: calculateSalary(employeeId)
     * Developer B: Changed: calculateSalary(employee)
     * WHY? The function interface was modified by Developer A, while Developer B is still passing an integer ID.
     * AI SUGGESTION: Convert Developer B's call to employee.id
     * Confidence: 94%
     * Validation: ✓ Syntax, ✓ Type check, ✓ 17 unit tests, ✓ No new errors
     */
     public static getConflict24Explanation(): AIConflictExplanationData {
        return {
            conflictNumber: 24,
            conflictTag: "CONFLICT #24",
            type: "Semantic Conflict",
            severity: "HIGH",
            developerA: {
                name: "Developer A",
                changed: "calculateSalary(employeeId)",
                codeSnippet: "export function calculateSalary(employeeId: number): number {\n    const emp = database.getEmployee(employeeId);\n    return emp.baseRate * emp.hoursWorked;\n}"
            },
            developerB: {
                name: "Developer B",
                changed: "calculateSalary(employee)",
                codeSnippet: "const employee = { id: 104, name: 'Alice Smith', department: 'Engineering' };\n// Calling with entire employee object:\nconst salary = calculateSalary(employee);"
            },
            why: "The function interface was modified by Developer A, while Developer B is still passing an integer ID.",
            aiSuggestion: "Convert Developer B's call to employee.id",
            confidence: "94%",
            confidenceScore: 94,
            validationChecks: [
                { name: "Syntax", passed: true },
                { name: "Type check", passed: true },
                { name: "17 unit tests", passed: true },
                { name: "No new errors", passed: true }
            ]
        };
    }

    public static getConflict24SemanticConflict(): SemanticConflict {
        const data = this.getConflict24Explanation();
        return {
            id: "conflict-24-calculate-salary",
            category: "SIGNATURE_MISMATCH",
            severity: "CRITICAL",
            title: "CONFLICT #24: Semantic Conflict in calculateSalary()",
            description: data.why,
            symbol: "calculateSalary",
            sourceFile: "services/payrollService.ts",
            sourceLine: 24,
            targetFile: "models/employee.ts",
            targetLine: 12,
            astDetails: {
                declaredSignature: "calculateSalary(employeeId: number)",
                callerContext: "calculateSalary(employee)",
                invokedArgumentsCount: 1,
                expectedParamsCount: 1
            },
            suggestedRemedy: data.aiSuggestion,
            explainability: {
                cause: "Developer A changed calculateSalary signature to accept employeeId (integer).",
                expectation: "Developer B passes the employee entity object directly: calculateSalary(employee).",
                impact: data.why,
                category: "CHANGED_FUNCTION_INTERFACE",
                categoryLabel: "Semantic Conflict (HIGH)",
                educationalExplanation: "Why this matters: When a function expects an integer identifier (employeeId: number) but receives an object (employee), arithmetic or query lookups fail at runtime with NaN, unexpected cast, or type errors.",
                targetEntity: "calculateSalary",
                devAName: "Developer A",
                devBName: "Developer B",
                devACodeSnippet: data.developerA.codeSnippet,
                devBCodeSnippet: data.developerB.codeSnippet,
                remediationGuide: data.aiSuggestion
            }
        };
    }

    /**
     * Exact Scenario from User Screenshot:
     * Why?
     * Developer A changed user_id from int -> string.
     * Developer B's function still expects int.
     * This may cause a type mismatch in getUser().
     */
    public static getScreenshotExample(): SemanticConflict {
        return {
            id: `explainable-type-mismatch-${Date.now()}`,
            category: 'TYPE_MISMATCH',
            severity: 'CRITICAL',
            title: "Type Mismatch in 'getUser()'",
            description: "Developer A migrated identifier types to UUID strings, but Developer B's consumer logic strictly expects numerical integers.",
            symbol: 'user_id',
            sourceFile: 'services/userService.ts',
            sourceLine: 12,
            targetFile: 'models/user.ts',
            targetLine: 4,
            astDetails: {
                declaredSignature: 'function getUser(user_id: string): User',
                invokedArgumentsCount: 1,
                expectedParamsCount: 1,
                callerContext: 'getUser(1048576)'
            },
            suggestedRemedy: "Unify the parameter type to accept string | number with runtime coercion, or update the caller to stringify identifiers.",
            explainability: {
                cause: "Developer A changed user_id from int -> string.",
                expectation: "Developer B's function still expects int.",
                impact: "This may cause a type mismatch in getUser().",
                category: 'TYPE_MISMATCH',
                categoryLabel: "Type Mismatch",
                educationalExplanation: "Why this matters: In typed runtimes (TypeScript, C++, Java), passing a string where an integer is expected causes compile-time failure. In dynamically typed runtimes (JavaScript, Python), passing a string to numerical queries or math operations causes runtime NaN, SQL type mismatches, or unexpected coercion ('1' + 1 = '11').",
                targetEntity: 'user_id in getUser()',
                devAName: "Developer A",
                devBName: "Developer B",
                beforeType: "int",
                afterType: "string",
                devACodeSnippet: "// Developer A in models/user.ts\ninterface User {\n    user_id: string; // Changed to UUID string\n    name: string;\n}\n\nexport function getUser(user_id: string) {\n    return db.users.find({ id: user_id });\n}",
                devBCodeSnippet: "// Developer B in services/userService.ts\nimport { getUser } from '../models/user';\n\nexport function processSession(numericId: number) {\n    // Expects numeric int: getUser(1048576)\n    return getUser(numericId);\n}",
                remediationGuide: "Either support string | number polymorphism in getUser(user_id: string | number), or sanitize callers using String(numericId)."
            }
        };
    }

    /**
     * Scenario 2: Changed Function Interface
     */
    public static getChangedInterfaceExample(): SemanticConflict {
        return {
            id: `explainable-interface-${Date.now()}`,
            category: 'SIGNATURE_MISMATCH',
            severity: 'CRITICAL',
            title: "Changed Function Interface in 'calculateTotal()'",
            description: "Developer A added a required 'taxRate' parameter, but Developer B continues invoking calculateTotal with 2 arguments.",
            symbol: 'calculateTotal',
            sourceFile: 'controllers/checkout.ts',
            sourceLine: 28,
            targetFile: 'utils/pricing.ts',
            targetLine: 5,
            astDetails: {
                declaredSignature: 'function calculateTotal(subtotal, discount, taxRate)',
                invokedArgumentsCount: 2,
                expectedParamsCount: 3,
                callerContext: 'calculateTotal(cart.subtotal, cart.discount)'
            },
            suggestedRemedy: "Provide a default value for taxRate = 0.05 or update callers to pass taxRate.",
            explainability: {
                cause: "Developer A added a required 'taxRate' parameter to calculateTotal().",
                expectation: "Developer B's caller function still passes only 2 arguments: (subtotal, discount).",
                impact: "This causes an arity mismatch in calculateTotal(), evaluating taxRate as undefined and computing NaN.",
                category: 'CHANGED_FUNCTION_INTERFACE',
                categoryLabel: "Changed Function Interface",
                educationalExplanation: "Why this matters: Functions represent behavioral contracts. Adding non-optional parameters breaks backward compatibility for all existing call sites. To prevent interface breakage, newly introduced parameters should provide sensible defaults (e.g., taxRate = 0).",
                targetEntity: 'calculateTotal()',
                devAName: "Developer A",
                devBName: "Developer B",
                devACodeSnippet: "// Developer A in utils/pricing.ts\nexport function calculateTotal(subtotal: number, discount: number, taxRate: number) {\n    return (subtotal - discount) * (1 + taxRate);\n}",
                devBCodeSnippet: "// Developer B in controllers/checkout.ts\nimport { calculateTotal } from '../utils/pricing';\n\nconst total = calculateTotal(cart.subtotal, cart.discount); // Missing taxRate!",
                remediationGuide: "Update the provider signature: function calculateTotal(subtotal, discount, taxRate = 0) to preserve backward compatibility."
            }
        };
    }

    /**
     * Scenario 3: Duplicate Declaration
     */
    public static getDuplicateDeclarationExample(): SemanticConflict {
        return {
            id: `explainable-duplicate-${Date.now()}`,
            category: 'DUPLICATE_DECLARATION',
            severity: 'CRITICAL',
            title: "Duplicate Declaration of 'API_BASE_URL'",
            description: "Both developers independently declared conflicting constants named API_BASE_URL in the same module scope.",
            symbol: 'API_BASE_URL',
            sourceFile: 'config/constants.ts',
            sourceLine: 18,
            targetFile: 'config/constants.ts',
            targetLine: 8,
            astDetails: {
                callerContext: 'const API_BASE_URL = "https://staging.api.com";'
            },
            suggestedRemedy: "Consolidate into an environment-driven configuration object.",
            explainability: {
                cause: "Developer A declared 'const API_BASE_URL = \"https://prod.api.com\"'.",
                expectation: "Developer B concurrently declared 'const API_BASE_URL = \"https://staging.api.com\"' in the same file.",
                impact: "This causes a duplicate identifier collision (SyntaxError: Identifier 'API_BASE_URL' has already been declared).",
                category: 'DUPLICATE_DECLARATION',
                categoryLabel: "Duplicate Declaration",
                educationalExplanation: "Why this matters: JavaScript and TypeScript block multiple declarations of const or let bindings within the same lexical scope. Collisions arise when multiple developers add configurations without coordinating namespace ownership.",
                targetEntity: 'API_BASE_URL in constants.ts',
                devAName: "Developer A",
                devBName: "Developer B",
                devACodeSnippet: "// Developer A at line 8 in constants.ts\nexport const API_BASE_URL = 'https://prod.api.com';",
                devBCodeSnippet: "// Developer B at line 18 in constants.ts\nexport const API_BASE_URL = 'https://staging.api.com';",
                remediationGuide: "Use environment variables: export const API_BASE_URL = process.env.API_BASE_URL || 'https://prod.api.com';"
            }
        };
    }

    /**
     * Scenario 4: Incompatible Dependency
     */
    public static getIncompatibleDependencyExample(): SemanticConflict {
        return {
            id: `explainable-dependency-${Date.now()}`,
            category: 'BREAKING_RENAME',
            severity: 'CRITICAL',
            title: "Incompatible Dependency on 'authMiddleware'",
            description: "Developer A refactored auth module exports to export 'authenticateSession', breaking Developer B's import of 'verifyToken'.",
            symbol: 'verifyToken',
            sourceFile: 'routes/dashboard.ts',
            sourceLine: 3,
            targetFile: 'middleware/auth.ts',
            targetLine: 1,
            astDetails: {
                callerContext: "import { verifyToken } from '../middleware/auth';"
            },
            suggestedRemedy: "Export a backward-compatible alias export const verifyToken = authenticateSession in middleware/auth.ts.",
            explainability: {
                cause: "Developer A renamed and restructured export 'verifyToken' -> 'authenticateSession' in middleware/auth.ts.",
                expectation: "Developer B's dashboard route still imports 'verifyToken' from '../middleware/auth'.",
                impact: "This causes an incompatible dependency and ModuleNotFoundError / Named Export Missing at runtime.",
                category: 'INCOMPATIBLE_DEPENDENCY',
                categoryLabel: "Incompatible Dependency",
                educationalExplanation: "Why this matters: In modular architectures, public exports constitute external APIs. Renaming an export without an alias shim or deprecation cycle breaks all dependent modules throughout the repository.",
                targetEntity: 'verifyToken from middleware/auth.ts',
                devAName: "Developer A",
                devBName: "Developer B",
                devACodeSnippet: "// Developer A in middleware/auth.ts\nexport function authenticateSession(req, res, next) { /* new token verification */ }",
                devBCodeSnippet: "// Developer B in routes/dashboard.ts\nimport { verifyToken } from '../middleware/auth'; // Symbol missing!",
                remediationGuide: "Export an alias in middleware/auth.ts: export const verifyToken = authenticateSession; to prevent breaking consumers."
            }
        };
    }

    private static buildTypeMismatchExplanation(conflict: SemanticConflict): ConflictExplainability {
        return {
            cause: `Developer A modified data type representation for '${conflict.symbol}'.`,
            expectation: `Developer B in '${conflict.sourceFile}' expects original type contract for '${conflict.symbol}'.`,
            impact: `This may cause a type mismatch or unexpected coercion at runtime during invocations.`,
            category: 'TYPE_MISMATCH',
            categoryLabel: "Type Mismatch",
            educationalExplanation: "Type mismatches occur when one collaborator updates a variable or parameter structure without migrating all call sites. In strict compilers, this halts the build; in dynamic languages, this causes subtle logical bugs.",
            targetEntity: conflict.symbol,
            devAName: "Developer A",
            devBName: "Developer B",
            remediationGuide: conflict.suggestedRemedy || "Align type annotations or introduce type guards."
        };
    }

    private static buildDuplicateDeclarationExplanation(conflict: SemanticConflict): ConflictExplainability {
        return {
            cause: `Developer A declared identifier '${conflict.symbol}' in '${conflict.targetFile || conflict.sourceFile}'.`,
            expectation: `Developer B concurrently created a symbol named '${conflict.symbol}' in the same scope.`,
            impact: `This causes a duplicate declaration collision, violating lexical scoping rules.`,
            category: 'DUPLICATE_DECLARATION',
            categoryLabel: "Duplicate Declaration",
            educationalExplanation: "Block-scoped variables (let and const) cannot be re-declared in the same scope. Rename one of the symbols or encapsulate them within distinct namespaces or objects.",
            targetEntity: conflict.symbol,
            devAName: "Developer A",
            devBName: "Developer B",
            remediationGuide: conflict.suggestedRemedy || "Rename one identifier or consolidate into a single shared declaration."
        };
    }

    private static buildIncompatibleDependencyExplanation(conflict: SemanticConflict): ConflictExplainability {
        return {
            cause: `Developer A refactored or deleted exported symbol '${conflict.symbol}' in '${conflict.targetFile}'.`,
            expectation: `Developer B in '${conflict.sourceFile}' still depends on '${conflict.symbol}'.`,
            impact: `This causes an incompatible dependency, failing module resolution at build or runtime.`,
            category: 'INCOMPATIBLE_DEPENDENCY',
            categoryLabel: "Incompatible Dependency",
            educationalExplanation: "Cross-module dependencies break when exporting files alter symbol names without providing backward-compatible shims. Standard practice is to deprecate with an alias before deletion.",
            targetEntity: `${conflict.symbol} from ${conflict.targetFile}`,
            devAName: "Developer A",
            devBName: "Developer B",
            remediationGuide: conflict.suggestedRemedy || "Add an export alias or update the consumer import path."
        };
    }

    private static buildChangedInterfaceExplanation(conflict: SemanticConflict): ConflictExplainability {
        const expected = conflict.astDetails.expectedParamsCount || 2;
        const actual = conflict.astDetails.invokedArgumentsCount || 1;
        return {
            cause: `Developer A updated the parameter contract of '${conflict.symbol}()' to expect ${expected} arguments.`,
            expectation: `Developer B in '${conflict.sourceFile}' invokes '${conflict.symbol}()' with ${actual} arguments.`,
            impact: `This causes an interface contract violation in '${conflict.symbol}()'. Missing arguments receive undefined.`,
            category: 'CHANGED_FUNCTION_INTERFACE',
            categoryLabel: "Changed Function Interface",
            educationalExplanation: "Modifying function signatures changes the arity requirement. When arguments are omitted, parameters evaluate to undefined, frequently causing downstream TypeError: Cannot read properties of undefined.",
            targetEntity: `${conflict.symbol}()`,
            devAName: "Developer A",
            devBName: "Developer B",
            remediationGuide: conflict.suggestedRemedy || "Supply missing arguments or define default parameter values."
        };
    }
}
