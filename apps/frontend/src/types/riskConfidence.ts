/**
 * CONFIDENCE & RISK SCORING TYPES
 * 
 * Feature 9: Confidence and Risk Scoring
 * Derived from Screenshots:
 * - Screenshot 1: "7. Give confidence score" (Solution 1: 12/17 72%, Solution 2: 17/17 96%, Solution 3: 14/17 81%)
 * - Screenshot 2: "🆕 Feature 4 — Risk Score for Every Edit" (5%, 35%, 65%, 91%)
 * - Screenshot 3: "8. Developer approves the solution" (Solution 2, Confidence: 96%, Tests Passed: 17/17, [Accept] [Reject] [Modify])
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
    priorityRank: number; // 1 to 4
    attentionRequired: boolean;
}

export interface AIConfidenceOption {
    solutionId: number;
    solutionName: string;
    testsPassed: number;
    testsTotal: number;
    testFraction: string; // "12/17", "17/17", "14/17"
    confidenceScore: number; // 72, 96, 81
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
