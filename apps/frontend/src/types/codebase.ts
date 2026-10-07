export interface CodebaseFile {
    id: string;
    name: string;
    path: string;
    language: string;
    createdAt: number;
    updatedAt: number;
    createdBy?: string;
    isEntry?: boolean;
}

import type { EditRiskScore } from './riskConfidence';

export interface CRDTEditEvent {
    id: string;
    userId: string;
    userName: string;
    userColor: string;
    fileId: string;
    fileName: string;
    timestamp: number;
    action: 'insert' | 'delete' | 'modify' | 'create_file' | 'delete_file';
    summary: string;
    risk?: EditRiskScore;
}

export interface CollaboratorPresence {
    id: string;
    name: string;
    color: string;
    currentFileId?: string;
    currentFileName?: string;
    cursor?: {
        lineNumber: number;
        column: number;
    };
    lastActive?: number;
}
