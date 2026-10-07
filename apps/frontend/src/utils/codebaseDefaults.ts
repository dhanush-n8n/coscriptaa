import type { CodebaseFile } from "../types/CodebaseExplorer";

export const getLanguageFromFilename = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'js':
        case 'jsx':
        case 'mjs':
            return 'javascript';
        case 'ts':
        case 'tsx':
            return 'typescript';
        case 'py':
            return 'python';
        case 'cpp':
        case 'cc':
        case 'cxx':
        case 'h':
        case 'hpp':
            return 'cpp';
        case 'c':
            return 'c';
        case 'go':
            return 'go';
        case 'java':
            return 'java';
        case 'rs':
            return 'rust';
        case 'html':
            return 'html';
        case 'css':
            return 'css';
        case 'json':
            return 'json';
        case 'md':
            return 'markdown';
        default:
            return 'javascript';
    }
};

export const getDefaultStarterFiles = (preferredLang = 'javascript'): { files: CodebaseFile[], contents: Record<string, string> } => {
    const now = Date.now();
    
    if (preferredLang === 'python') {
        const files: CodebaseFile[] = [
            {
                id: 'main_py',
                name: 'main.py',
                path: '/main.py',
                language: 'python',
                createdAt: now,
                updatedAt: now,
                createdBy: 'system',
                isEntry: true,
            },
            {
                id: 'utils_py',
                name: 'utils.py',
                path: '/utils.py',
                language: 'python',
                createdAt: now,
                updatedAt: now,
                createdBy: 'system',
            },
            {
                id: 'readme_md',
                name: 'README.md',
                path: '/README.md',
                language: 'markdown',
                createdAt: now,
                updatedAt: now,
                createdBy: 'system',
            }
        ];

        const contents: Record<string, string> = {
            'main_py': `# Collaborative Multi-User Python Codebase
# Real-time synchronization enabled via CRDT (Yjs)

from utils import calculate_metrics, greet_developer

def main():
    print(greet_developer("Dev Team"))
    metrics = calculate_metrics(edits=42)
    print(f"CRDT Status: {metrics['status']}, Conflicts: {metrics['conflicts']}")

if __name__ == "__main__":
    main()
`,
            'utils_py': `def greet_developer(team_name: str) -> str:
    return f"Hello, {team_name}! Concurrent edits are synchronized conflict-free."

def calculate_metrics(edits: int):
    return {
        "status": "Synchronized",
        "conflicts": 0,
        "algorithm": "CRDT Eventual Consistency"
    }
`,
            'readme_md': `# Real-Time Python Codebase
Multiple developers can edit \`main.py\` and \`utils.py\` concurrently.
CRDT ensures zero lost edits and mathematical convergence.
`
        };

        return { files, contents };
    }

    if (preferredLang === 'cpp') {
        const files: CodebaseFile[] = [
            {
                id: 'main_cpp',
                name: 'main.cpp',
                path: '/main.cpp',
                language: 'cpp',
                createdAt: now,
                updatedAt: now,
                createdBy: 'system',
                isEntry: true,
            },
            {
                id: 'helper_h',
                name: 'helper.h',
                path: '/helper.h',
                language: 'cpp',
                createdAt: now,
                updatedAt: now,
                createdBy: 'system',
            }
        ];

        const contents: Record<string, string> = {
            'main_cpp': `#include <iostream>
#include "helper.h"

int main() {
    std::cout << "=== Multi-Developer CRDT Codebase ===" << std::endl;
    printGreeting("Collaborators");
    return 0;
}
`,
            'helper_h': `#pragma once
#include <iostream>
#include <string>

inline void printGreeting(const std::string& name) {
    std::cout << "Hello, " << name << "! CRDT synchronization is active." << std::endl;
}
`
        };

        return { files, contents };
    }

    if (preferredLang === 'go') {
        const files: CodebaseFile[] = [
            {
                id: 'main_go',
                name: 'main.go',
                path: '/main.go',
                language: 'go',
                createdAt: now,
                updatedAt: now,
                createdBy: 'system',
                isEntry: true,
            }
        ];

        const contents: Record<string, string> = {
            'main_go': `package main

import "fmt"

func main() {
    fmt.Println("Real-time CRDT Code Collaboration Active")
}
`
        };

        return { files, contents };
    }

    // Default: JavaScript / TypeScript
    const files: CodebaseFile[] = [
        {
            id: 'main_js',
            name: 'main.js',
            path: '/main.js',
            language: 'javascript',
            createdAt: now,
            updatedAt: now,
            createdBy: 'system',
            isEntry: true,
        },
        {
            id: 'utils_js',
            name: 'utils.js',
            path: '/utils.js',
            language: 'javascript',
            createdAt: now,
            updatedAt: now,
            createdBy: 'system',
        },
        {
            id: 'readme_md',
            name: 'README.md',
            path: '/README.md',
            language: 'markdown',
            createdAt: now,
            updatedAt: now,
            createdBy: 'system',
        }
    ];

    const contents: Record<string, string> = {
        'main_js': `// Collaborative Codebase Entry Point
// Multiple developers can edit simultaneously using CRDT synchronization

import { formatGreeting, getSyncStatus } from './utils.js';

function startApplication() {
    const greeting = formatGreeting("Dev Team");
    console.log(greeting);
    
    const sync = getSyncStatus();
    console.log(\`CRDT Status: \${sync.status} | Conflicts: \${sync.conflicts}\`);
}

startApplication();
`,
        'utils_js': `// Utility module for multi-developer collaboration

export function formatGreeting(name) {
    return \`Hello, \${name}! Welcome to real-time CRDT code collaboration.\`;
}

export function getSyncStatus() {
    return {
        status: "Active & Converged",
        conflicts: 0,
        crdtModel: "Yjs Logoot / Fractional-Index Convergence"
    };
}
`,
        'readme_md': `# Real-Time Collaborative Workspace
Synchronized using Conflict-Free Replicated Data Types (CRDT).

- **Concurrent Edits**: Edit separate files or the same file concurrently without locking.
- **Awareness**: View teammate cursors, selections, and active files in real time.
- **Deterministic Merge**: Edits converge conflict-free across all connected peers.
`
    };

    return { files, contents };
};

export const generateFileId = (name: string): string => {
    return `file_${name.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Math.random().toString(36).substring(2, 7)}`;
};
