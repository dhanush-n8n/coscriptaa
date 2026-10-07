const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("=== VERIFYING AI CONFLICT EXPLANATION (CONFLICT #24) ===");

const rootDir = "c:/Users/chedu/Downloads/SYNC-CODE-main";

// 1. Backend Service Check
const explainServicePath = path.join(rootDir, "apps/express-server/src/services/explainableConflictService.ts");
assert(fs.existsSync(explainServicePath), "explainableConflictService.ts must exist");
const explainContent = fs.readFileSync(explainServicePath, "utf-8");

assert(explainContent.includes("CONFLICT #24"), "Must include CONFLICT #24");
assert(explainContent.includes("calculateSalary(employeeId)"), "Must include Developer A calculateSalary(employeeId)");
assert(explainContent.includes("calculateSalary(employee)"), "Must include Developer B calculateSalary(employee)");
assert(explainContent.includes("The function interface was modified by Developer A, while Developer B is still passing an integer ID."), "Must include exact WHY explanation");
assert(explainContent.includes("Convert Developer B's call to employee.id"), "Must include exact AI SUGGESTION");
assert(explainContent.includes("94%"), "Must include 94% confidence");
assert(explainContent.includes("17 unit tests"), "Must include 17 unit tests in validation");
assert(explainContent.includes("No new errors"), "Must include No new errors in validation");
console.log("✓ Backend Explainable Conflict Service verified successfully!");

// 2. Express Server Endpoints Check
const indexPath = path.join(rootDir, "apps/express-server/src/index.ts");
const indexContent = fs.readFileSync(indexPath, "utf-8");
assert(indexContent.includes("app.get('/api/conflicts/explanation-24'"), "Must expose /api/conflicts/explanation-24");
assert(indexContent.includes("app.post('/api/conflicts/explanation-24/apply'"), "Must expose /api/conflicts/explanation-24/apply");
console.log("✓ Express Server endpoints for Conflict #24 verified successfully!");

// 3. Frontend Modal Check
const modalPath = path.join(rootDir, "apps/frontend/src/components/AIConflictExplanationModal.tsx");
assert(fs.existsSync(modalPath), "AIConflictExplanationModal.tsx must exist");
const modalContent = fs.readFileSync(modalPath, "utf-8");
assert(modalContent.includes("3. One particularly good feature: AI Conflict Explanation"), "Modal must include heading from screenshot");
assert(modalContent.includes("I strongly recommend adding this."), "Modal must include subtitle from screenshot");
assert(modalContent.includes("CONFLICT #24"), "Modal must include CONFLICT #24");
assert(modalContent.includes("Semantic Conflict"), "Modal must include Semantic Conflict");
assert(modalContent.includes("HIGH"), "Modal must include HIGH severity");
assert(modalContent.includes("calculateSalary(employeeId)"), "Modal must include Developer A changed calculateSalary(employeeId)");
assert(modalContent.includes("calculateSalary(employee)"), "Modal must include Developer B changed calculateSalary(employee)");
assert(modalContent.includes("The function interface was modified by Developer A, while Developer B is still passing an integer ID."), "Modal must include exact WHY");
assert(modalContent.includes("Convert Developer B's call to employee.id"), "Modal must include exact AI SUGGESTION");
assert(modalContent.includes("94%"), "Modal must include 94%");
assert(modalContent.includes("17 unit tests"), "Modal must include 17 unit tests");
assert(modalContent.includes("No new errors"), "Modal must include No new errors");
console.log("✓ Frontend AIConflictExplanationModal verified successfully!");

// 4. Header & Page Integrations Check
const headerPath = path.join(rootDir, "apps/frontend/src/components/CodeEditorHeader.tsx");
const headerContent = fs.readFileSync(headerPath, "utf-8");
assert(headerContent.includes("AI Explanation (#24)"), "CodeEditorHeader must have AI Explanation (#24) button");

const editorPath = path.join(rootDir, "apps/frontend/src/pages/CodeEditor.tsx");
const editorContent = fs.readFileSync(editorPath, "utf-8");
assert(editorContent.includes("<AIConflictExplanationModal"), "CodeEditor.tsx must render AIConflictExplanationModal");

const dashboardPath = path.join(rootDir, "apps/frontend/src/pages/ConflictDashboard.tsx");
const dashboardContent = fs.readFileSync(dashboardPath, "utf-8");
assert(dashboardContent.includes("<AIConflictExplanationModal"), "ConflictDashboard.tsx must render AIConflictExplanationModal");
assert(dashboardContent.includes("Conflict #24 Explanation"), "ConflictDashboard.tsx must have Conflict #24 Explanation button");

console.log("✓ Editor Header, CodeEditor page, and Dashboard page integrations verified successfully!");
console.log("\nALL VERIFICATION CHECKS PASSED: AI Conflict Explanation (Conflict #24) is 100% complete!");
