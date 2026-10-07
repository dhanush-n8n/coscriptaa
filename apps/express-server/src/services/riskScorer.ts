/**
 * RISK SCORING & DEVELOPER APPROVAL SERVICE
 * 
 * Feature 9: Confidence and Risk Scoring
 * Corresponds to:
 * 1. "🆕 Feature 4 — Risk Score for Every Edit" (Screenshot 2):
 *    - Comment change              -> 5%  (Green)
 *    - Variable rename             -> 35% (Yellow)
 *    - Function modification       -> 65% (Orange)
 *    - API/interface modification  -> 91% (Red)
 *    "The system can prioritize which edits need attention."
 * 
 * 2. "7. Give confidence score" (Screenshot 1):
 *    - Solution 1: 12/17 tests -> 72% confidence
 *    - Solution 2: 17/17 tests -> 96% confidence (Top pick)
 *    - Solution 3: 14/17 tests -> 81% confidence
 *    "The system recommends Solution 2 because it passes all validation checks."
 * 
 * 3. "8. Developer approves the solution" (Screenshot 3):
 *    AI Recommendation
 *    -----------------
 *    Solution 2
 *    Confidence: 96%
 *    Tests Passed: 17/17
 *    [Accept]  [Reject]  [Modify]
 *    "Only after developer approval is the resolved version merged."
 */

export type EditChangeCategory = 
    | 'comment_change' 
    | 'variable_rename' 
    | 'function_modification' 
    | 'api_interface_modification';

export interface EditRiskScore {
    changeType: EditChangeCategory;
    changeLabel: string;
    riskPercent: number; // 5, 35, 65, 91
    riskLevel: 'LOW' | 'MEDIUM_LOW' | 'MEDIUM_HIGH' | 'CRITICAL';
    badgeColor: string;
    dotEmoji: '🟢' | '🟡' | '🟠' | '🔴';
    explanation: string;
    priorityRank: number; // 1 to 4 (1 = highest priority)
    attentionRequired: boolean;
}

export interface ScoredConcurrentEdit {
    id: string;
    userId: string;
    userName: string;
    userColor: string;
    fileId: string;
    fileName: string;
    timestamp: number;
    action: string;
    summary: string;
    risk: EditRiskScore;
}

export interface AIConfidenceOption {
    solutionId: number;
    solutionName: string;
    testsPassed: number;
    testsTotal: number;
    testFraction: string; // "12/17", "17/17", "14/17"
    confidenceScore: number; // 72%, 96%, 81%
    isRecommended: boolean;
    recommendationNote: string;
}

export interface DeveloperApprovalDecision {
    conflictId: string;
    solutionId: number;
    action: 'accept' | 'reject' | 'modify';
    modifiedCode?: string;
    approvedBy: string;
    timestamp: number;
    merged: boolean;
    summary: string;
}

export class RiskScorerService {
    /**
     * Standard 4-Tier Risk Matrix as specified in Screenshot 2
     */
    public static readonly RISK_MATRIX: Record<EditChangeCategory, EditRiskScore> = {
        comment_change: {
            changeType: 'comment_change',
            changeLabel: 'Comment change',
            riskPercent: 5,
            riskLevel: 'LOW',
            badgeColor: '#10b981', // green
            dotEmoji: '🟢',
            explanation: 'Documentation or comment alteration with zero runtime execution semantic divergence.',
            priorityRank: 4,
            attentionRequired: false
        },
        variable_rename: {
            changeType: 'variable_rename',
            changeLabel: 'Variable rename',
            riskPercent: 35,
            riskLevel: 'MEDIUM_LOW',
            badgeColor: '#f59e0b', // yellow
            dotEmoji: '🟡',
            explanation: 'Local identifier scope rename. Low probability of external caller failure if scoped within block.',
            priorityRank: 3,
            attentionRequired: false
        },
        function_modification: {
            changeType: 'function_modification',
            changeLabel: 'Function modification',
            riskPercent: 65,
            riskLevel: 'MEDIUM_HIGH',
            badgeColor: '#f97316', // orange
            dotEmoji: '🟠',
            explanation: 'Internal function algorithm, loop, or return behavior altered. May affect callers relying on exact computation.',
            priorityRank: 2,
            attentionRequired: true
        },
        api_interface_modification: {
            changeType: 'api_interface_modification',
            changeLabel: 'API/interface modification',
            riskPercent: 91,
            riskLevel: 'CRITICAL',
            badgeColor: '#ef4444', // red
            dotEmoji: '🔴',
            explanation: 'Public export interface, function signature, or parameter type contract modified. High probability of breaking downstream callers.',
            priorityRank: 1,
            attentionRequired: true
        }
    };

    /**
     * Analyzes an edit delta and computes its risk score according to the 4-tier matrix
     */
    public static scoreEdit(
        fileName: string, 
        summary: string, 
        contentSample?: string
    ): EditRiskScore {
        const text = (summary + ' ' + (contentSample || '')).toLowerCase();

        // 1. Check for API / interface modifications (91%)
        if (
            text.includes('export') || 
            text.includes('interface') || 
            text.includes('signature') || 
            text.includes('parameter type') || 
            text.includes('user_id: string') || 
            text.includes('user_id: number') || 
            text.includes('api') || 
            text.includes('endpoint')
        ) {
            return { ...this.RISK_MATRIX.api_interface_modification };
        }

        // 2. Check for function modifications (65%)
        if (
            text.includes('function') || 
            text.includes('return') || 
            text.includes('calculate') || 
            text.includes('algorithm') || 
            text.includes('handler') || 
            text.includes('method') || 
            text.includes('logic')
        ) {
            return { ...this.RISK_MATRIX.function_modification };
        }

        // 3. Check for variable renames (35%)
        if (
            text.includes('rename') || 
            text.includes('variable') || 
            text.includes('identifier') || 
            text.includes('const ') || 
            text.includes('let ')
        ) {
            return { ...this.RISK_MATRIX.variable_rename };
        }

        // 4. Default to comment change (5%)
        if (
            text.includes('comment') || 
            text.includes('doc') || 
            text.includes('note') || 
            text.includes('whitespace') || 
            text.includes('//') || 
            text.includes('/*')
        ) {
            return { ...this.RISK_MATRIX.comment_change };
        }

        // Fallback heuristics: if modifying JS/TS file without explicit export, assign variable rename or function
        if (fileName.endsWith('.js') || fileName.endsWith('.ts')) {
            return { ...this.RISK_MATRIX.function_modification };
        }

        return { ...this.RISK_MATRIX.comment_change };
    }

    /**
     * Generates the Confidence Scores Table exactly matching Screenshot 1:
     * Solution 1: 12/17 tests -> 72%
     * Solution 2: 17/17 tests -> 96%
     * Solution 3: 14/17 tests -> 81%
     */
    public static getConfidenceScoreTable(): AIConfidenceOption[] {
        return [
            {
                solutionId: 1,
                solutionName: "Solution 1",
                testsPassed: 12,
                testsTotal: 17,
                testFraction: "12/17",
                confidenceScore: 72,
                isRecommended: false,
                recommendationNote: "Fails 5 unit test assertions on legacy numeric parameters."
            },
            {
                solutionId: 2,
                solutionName: "Solution 2",
                testsPassed: 17,
                testsTotal: 17,
                testFraction: "17/17",
                confidenceScore: 96,
                isRecommended: true,
                recommendationNote: "Passes all validation checks (17/17 passed) with zero breaking changes."
            },
            {
                solutionId: 3,
                solutionName: "Solution 3",
                testsPassed: 14,
                testsTotal: 17,
                testFraction: "14/17",
                confidenceScore: 81,
                isRecommended: false,
                recommendationNote: "Fails 3 regression tests on external calling modules."
            }
        ];
    }

    /**
     * Prioritizes concurrent edits stream so developers can focus on edits that need attention
     */
    public static prioritizeEdits(edits: ScoredConcurrentEdit[]): ScoredConcurrentEdit[] {
        return [...edits].sort((a, b) => a.risk.priorityRank - b.risk.priorityRank);
    }
}
