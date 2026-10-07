import type { CodebaseFile as ICodebaseFile, CollaboratorPresence as ICollaboratorPresence } from './codebase';

export type CodebaseFile = ICodebaseFile;
export type CollaboratorPresence = ICollaboratorPresence;

// Runtime token to prevent browser runtime ESM SyntaxError when imported without type keyword
export const CodebaseFile = Symbol('CodebaseFile');
export const CollaboratorPresence = Symbol('CollaboratorPresence');
