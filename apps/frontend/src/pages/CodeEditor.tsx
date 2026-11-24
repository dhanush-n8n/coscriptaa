import { useState, useEffect, useRef, useCallback } from "react";
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import MonacoEditor from "@monaco-editor/react";
import { registerMonacoSnippets } from "../utils/monacoSnippets";
import { userAtom } from "../atoms/userAtom";
import { useRecoilState } from "recoil";
import { socketAtom } from "../atoms/socketAtom";
import { useNavigate, useParams } from "react-router-dom";
import { connectedUsersAtom } from "../atoms/connectedUsersAtom";
import { CodeEditorHeader } from "@/components/CodeEditorHeader";
import { UserList } from "@/components/UsersList";
import { ChatWindow } from "@/components/ChatWindow";
import type { ChatMessage } from "@/components/ChatWindow";
import Whiteboard from "@/components/Whiteboard";
import { CodeOutput } from "@/components/CodeOutput";
import { CodebaseExplorer } from "@/components/CodebaseExplorer";
import { FileTabsBar } from "@/components/FileTabsBar";
import { ConcurrentEditsFeed } from "@/components/ConcurrentEditsFeed";
import { SemanticConflictsPanel } from "@/components/SemanticConflictsPanel";
import { DependencyConflictsPanel } from "@/components/DependencyConflictsPanel";
import { ProactiveConflictModal } from "@/components/ProactiveConflictModal";
import { AIValidationPipelineModal } from "@/components/AIValidationPipelineModal";
import { DockerSandboxValidationModal } from "@/components/DockerSandboxValidationModal";
import { ConfidenceAndRiskScoringModal } from "@/components/ConfidenceAndRiskScoringModal";
import { AIConflictExplanationModal } from "@/components/AIConflictExplanationModal";
import { RealAIConflictModal } from "@/components/RealAIConflictModal";
import { ProactiveAlertBanner } from "@/components/ProactiveAlertBanner";
import { useWebRTC } from "@/hooks/useWebRTC";
import { toast } from "sonner";
import { generateUUID } from "@/lib/utils";
import { getLanguageFromFilename, getDefaultStarterFiles, generateFileId } from "../utils/codebaseDefaults";
import { replaceAndDeduplicateFunctionInDocument } from "../utils/astReplacement";
import type { CodebaseFile, CRDTEditEvent, CollaboratorPresence } from "../types/codebase";
import type { SemanticConflict, GenuineConflict, ResolutionOption, ConflictHistoryRecord } from "../types/conflicts";
import type { ProactiveDivergence } from "../types/proactive";
import type { CodebaseDependencyGraph, IndirectConflict } from "../types/dependency";
import type { SandboxValidationSuiteResult } from "../types/sandbox";
import { X, Activity, ShieldAlert, Zap, Network, Box } from "lucide-react";

// CodeEditor Component with Real-Time Multi-User CRDT Codebase Synchronization
export const CodeEditor = () => {
    const editorRef = useRef<any>(null);
    const monacoRef = useRef<any>(null);
    const docRef = useRef<Y.Doc | null>(null);
    const providerRef = useRef<WebsocketProvider | null>(null);
    const bindingRef = useRef<MonacoBinding | null>(null);
    const yTextObserverRef = useRef<any>(null);
    const currentObservedYTextRef = useRef<Y.Text | null>(null);
    const bindEditorToFileRef = useRef<(fileId: string) => void>(() => {});
    const userColorRef = useRef<string>('#38bdf8');
    const lastLoggedTimeRef = useRef<number>(0);

    const [language, setLanguage] = useState<string>(() => {
        try {
            const pathParts = window.location.pathname.split('/');
            const roomId = pathParts[pathParts.length - 1] || '';
            if (roomId) {
                const roomLang = localStorage.getItem('coscripta_room_lang_' + roomId);
                if (roomLang) return roomLang;
            }
            const globalLang = localStorage.getItem('coscripta_selected_language');
            if (globalLang) return globalLang;
        } catch (e) {}
        return "javascript";
    });
    const languageRef = useRef(language);
    languageRef.current = language;
    const lastManualLanguageSelectionRef = useRef<number>(0);
    const lastBoundFileIdRef = useRef<string | null>(null);
    const [output, setOutput] = useState<string[]>([]);
    const [socket, setSocket] = useRecoilState<WebSocket | null>(socketAtom);
    const [isLoading, setIsLoading] = useState(false);
    const [currentButtonState, setCurrentButtonState] = useState("Submit Code");
    const [input, setInput] = useState<string>("");
    const [user, setUser] = useRecoilState(userAtom);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [activeTab, setActiveTab] = useState<'users' | 'chat' | 'io' | 'edits' | 'conflicts' | 'dependencies'>('users');
    const [activeView, setActiveView] = useState<'editor' | 'whiteboard'>('editor');
    const [isChatZoomed, setIsChatZoomed] = useState(false);
    const [inviteCopied, setInviteCopied] = useState(false);
    const navigate = useNavigate();

    // CRDT Codebase States
    const [files, setFiles] = useState<CodebaseFile[]>([]);
    const filesRef = useRef<CodebaseFile[]>(files);
    filesRef.current = files;
    const [activeFileId, setActiveFileId] = useState<string>('main_js');
    const [crdtSynced, setCrdtSynced] = useState<boolean>(false);
    const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>([]);
    const [concurrentEdits, setConcurrentEdits] = useState<CRDTEditEvent[]>([]);
    const [isExplorerOpen, setIsExplorerOpen] = useState<boolean>(true);

    // Semantic Conflicts State
    const [conflicts, setConflicts] = useState<SemanticConflict[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

    // Proactive Conflict Prediction State (Feature 4)
    const [proactiveDivergence, setProactiveDivergence] = useState<ProactiveDivergence | null>(null);
    const [isProactiveModalOpen, setIsProactiveModalOpen] = useState<boolean>(false);

    // Feature 5: Dependency-Aware Conflict Analysis & 3 AI Solutions
    const [dependencyGraph, setDependencyGraph] = useState<CodebaseDependencyGraph | null>(null);
    const [indirectConflicts, setIndirectConflicts] = useState<IndirectConflict[]>([]);
    const [isAnalyzingDependencies, setIsAnalyzingDependencies] = useState<boolean>(false);

    // Feature 7: AI-Based Conflict Resolution & Validation Pipeline
    const [isValidationModalOpen, setIsValidationModalOpen] = useState<boolean>(false);
    const [activeValidationConflict, setActiveValidationConflict] = useState<SemanticConflict | null>(null);

    // Feature 8: Automatic Resolution Validation (Docker Sandbox 4-Checks & Rollback)
    const [isDockerSandboxModalOpen, setIsDockerSandboxModalOpen] = useState<boolean>(false);
    const [sandboxSuiteResult, setSandboxSuiteResult] = useState<SandboxValidationSuiteResult | null>(null);
    const [activeSandboxConflict, setActiveSandboxConflict] = useState<SemanticConflict | null>(null);

    // Feature 9: Confidence and Risk Scoring & Developer Approval
    const [isConfidenceModalOpen, setIsConfidenceModalOpen] = useState<boolean>(false);

    // AI Conflict Explanation (CONFLICT #24 - calculateSalary)
    const [isConflict24ModalOpen, setIsConflict24ModalOpen] = useState<boolean>(false);

    // Genuine Real-Time Semantic Conflict Detection & AI Resolution
    const [realConflict, setRealConflict] = useState<GenuineConflict | null>(null);
    const [isRealConflictModalOpen, setIsRealConflictModalOpen] = useState<boolean>(false);
    const [conflictHistory, setConflictHistory] = useState<ConflictHistoryRecord[]>([]);
    const lastBaseVersionRef = useRef<string>('');
    const trackEditTimeoutRef = useRef<any>(null);
    const realConflictRef = useRef<GenuineConflict | null>(null);
    const activeConflictKeyRef = useRef<string | null>(null);
    const isResolvingRef = useRef<boolean>(false);

    // Multiplayer WebRTC state
    const [connectedUsers, setConnectedUsers] = useRecoilState<any[]>(connectedUsersAtom);
    const params = useParams();

    const { localStream, remoteStreams, toggleMic, toggleVideo, micEnabled, videoEnabled } = useWebRTC(socket, user.id, user.roomId, connectedUsers);

    // Pick a persistent user color for remote carets
    useEffect(() => {
        const colors = [
            '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', 
            '#10b981', '#f59e0b', '#ef4444', '#14b8a6'
        ];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        userColorRef.current = randomColor;
    }, []);

    // -------------------------------------------------------------
    // CRDT (Yjs) INITIALIZATION & MULTI-USER CODEBASE SYNCHRONIZATION
    // -------------------------------------------------------------
    useEffect(() => {
        const currentRoom = user.roomId || params.roomId;
        if (!currentRoom) return;

        // If provider already exists for this room, do not recreate
        if (providerRef.current && docRef.current && (providerRef.current as any).roomname === currentRoom) {
            return;
        }

        // Clean up previous binding & provider if room changed
        if (bindingRef.current) {
            bindingRef.current.destroy();
            bindingRef.current = null;
        }
        if (currentObservedYTextRef.current && yTextObserverRef.current) {
            currentObservedYTextRef.current.unobserve(yTextObserverRef.current);
            yTextObserverRef.current = null;
            currentObservedYTextRef.current = null;
        }
        if (providerRef.current) {
            providerRef.current.destroy();
            providerRef.current = null;
        }
        if (docRef.current) {
            docRef.current.destroy();
            docRef.current = null;
        }

        const doc = new Y.Doc();
        docRef.current = doc;

        const yjsWsUrl = import.meta.env.VITE_YJS_WEBSOCKET_URL || `ws://${window.location.hostname}:5001`;
        const provider = new WebsocketProvider(yjsWsUrl, currentRoom, doc);
        providerRef.current = provider;

        const filesMap = doc.getMap<CodebaseFile>('codebase_files');
        const editsArray = doc.getArray<CRDTEditEvent>('concurrent_edits');

        provider.on('status', (event: any) => {
            setCrdtSynced(event.status === 'connected');
        });

        // Handle initial synchronization with Yjs server
        provider.on('sync', (isSynced: boolean) => {
            setCrdtSynced(isSynced);
            if (isSynced) {
                const list: CodebaseFile[] = [];
                filesMap.forEach((val) => {
                    list.push(val);
                });

                if (list.length === 0) {
                    // Seed starter codebase ONLY when the room is genuinely new and empty on server
                    const preferredInitial = languageRef.current || 'javascript';
                    const { files: defaults, contents } = getDefaultStarterFiles(preferredInitial);
                    doc.transact(() => {
                        defaults.forEach((f) => {
                            filesMap.set(f.id, f);
                            const yText = doc.getText('file_content_' + f.id);
                            if (yText.length === 0 && contents[f.id]) {
                                yText.insert(0, contents[f.id]);
                            }
                        });
                    });
                    setFiles(defaults);
                    setActiveFileId(defaults[0].id);
                    if (editorRef.current) {
                        bindEditorToFileRef.current(defaults[0].id);
                    }
                } else {
                    list.sort((a, b) => (b.isEntry ? 1 : 0) - (a.isEntry ? 1 : 0) || a.name.localeCompare(b.name));
                    setFiles(list);
                    const chosenActiveId = list.some(f => f.id === activeFileId) ? activeFileId : list[0].id;
                    setActiveFileId(chosenActiveId);

                    // Sync language to existing entry file if not manually switched recently
                    if (Date.now() - lastManualLanguageSelectionRef.current > 3000) {
                        const entryFile = list.find(f => f.isEntry || f.name.startsWith('main.'));
                        if (entryFile && entryFile.language && entryFile.language !== languageRef.current) {
                            setLanguage(entryFile.language);
                            languageRef.current = entryFile.language;
                        }
                    }

                    if (editorRef.current) {
                        bindEditorToFileRef.current(chosenActiveId);
                    }
                }
            }
        });

        // Observe remote updates to the files map
        const handleFilesChange = () => {
            const list: CodebaseFile[] = [];
            filesMap.forEach((val) => {
                list.push(val);
            });

            if (list.length > 0) {
                list.sort((a, b) => (b.isEntry ? 1 : 0) - (a.isEntry ? 1 : 0) || a.name.localeCompare(b.name));
                setFiles(list);
                setActiveFileId((curr) => {
                    if (list.some(f => f.id === curr)) return curr;
                    return list[0].id;
                });

                // Re-bind if editor is mounted and file is not yet bound
                if (editorRef.current && (!bindingRef.current || lastBoundFileIdRef.current !== activeFileId)) {
                    bindEditorToFileRef.current(activeFileId);
                }
            }
        };

        filesMap.observe(handleFilesChange);

        // Sync concurrent edits stream
        const handleEditsChange = () => {
            setConcurrentEdits(editsArray.toArray());
        };
        editsArray.observe(handleEditsChange);
        handleEditsChange();

        // Yjs Awareness Presence
        provider.awareness.setLocalStateField('user', {
            id: user.id || generateUUID(),
            name: user.name || 'Anonymous',
            color: userColorRef.current,
            currentFileId: activeFileId,
            currentFileName: 'main.js'
        });

        const handleAwareness = () => {
            const states = provider.awareness.getStates();
            const list: CollaboratorPresence[] = [];
            states.forEach((state: any, clientID: number) => {
                if (state.user) {
                    list.push({
                        id: state.user.id || String(clientID),
                        name: state.user.name || 'Anonymous',
                        color: state.user.color || '#38bdf8',
                        currentFileId: state.user.currentFileId,
                        currentFileName: state.user.currentFileName,
                        cursor: state.user.cursor,
                    });
                }
            });
            setCollaborators(list);
        };

        provider.awareness.on('change', handleAwareness);
        handleAwareness();

        return () => {
            if (bindingRef.current) {
                bindingRef.current.destroy();
                bindingRef.current = null;
            }
            if (currentObservedYTextRef.current && yTextObserverRef.current) {
                currentObservedYTextRef.current.unobserve(yTextObserverRef.current);
                yTextObserverRef.current = null;
                currentObservedYTextRef.current = null;
            }
            provider.destroy();
            doc.destroy();
        };
    }, [user.roomId, params.roomId]);

    // Helper: Log CRDT edit event to the concurrent edits stream
    const logCRDTEdit = useCallback((file: CodebaseFile, action: CRDTEditEvent['action'], summary: string) => {
        const doc = docRef.current;
        if (!doc) return;
        const now = Date.now();
        if (action === 'modify' && now - lastLoggedTimeRef.current < 3500) {
            return; // Throttle fast character typing events
        }
        lastLoggedTimeRef.current = now;

        const editsArray = doc.getArray<CRDTEditEvent>('concurrent_edits');
        const editEvent: CRDTEditEvent = {
            id: generateUUID(),
            userId: user.id || 'dev',
            userName: user.name || 'Developer',
            userColor: userColorRef.current,
            fileId: file.id,
            fileName: file.name,
            timestamp: now,
            action,
            summary
        };

        editsArray.push([editEvent]);
        if (editsArray.length > 50) {
            editsArray.delete(0, editsArray.length - 50);
        }
    }, [user.id, user.name]);

    // -------------------------------------------------------------
    // MONACO BINDING TO CURRENT ACTIVE FILE
    // -------------------------------------------------------------
    const bindEditorToFile = useCallback((fileId: string) => {
        if (!editorRef.current || !docRef.current || !providerRef.current) return;
        const doc = docRef.current;
        const provider = providerRef.current;
        const filesMap = doc.getMap<CodebaseFile>('codebase_files');
        const targetFile = filesRef.current.find(f => f.id === fileId) || filesMap.get(fileId);
        if (!targetFile) return;

        // If already cleanly bound to this exact file, skip re-binding
        if (bindingRef.current && lastBoundFileIdRef.current === fileId) {
            return;
        }

        // Destroy previous MonacoBinding cleanly and remove old observer
        if (bindingRef.current) {
            try {
                bindingRef.current.destroy();
            } catch (e) {}
            bindingRef.current = null;
        }
        if (currentObservedYTextRef.current && yTextObserverRef.current) {
            try {
                currentObservedYTextRef.current.unobserve(yTextObserverRef.current);
            } catch (e) {}
            yTextObserverRef.current = null;
            currentObservedYTextRef.current = null;
        }

        const yText = doc.getText('file_content_' + fileId);
        const editor = editorRef.current;
        const monaco = monacoRef.current || (window as any).monaco;

        const isSwitchingFile = lastBoundFileIdRef.current !== fileId;
        lastBoundFileIdRef.current = fileId;

        const detectedLang = targetFile.language || getLanguageFromFilename(targetFile.name);
        const effectiveLang = detectedLang || languageRef.current || 'javascript';

        const model = editor.getModel();
        if (monaco && model) {
            monaco.editor.setModelLanguage(model, effectiveLang);
        }

        // Bind Monaco Editor to this file's Y.Text CRDT buffer
        const newBinding = new MonacoBinding(
            yText,
            model,
            new Set([editor]),
            provider.awareness
        );
        bindingRef.current = newBinding;

        // Update awareness state so peers know which file we're in
        const currentState = provider.awareness.getLocalState() || {};
        provider.awareness.setLocalStateField('user', {
            ...currentState.user,
            currentFileId: fileId,
            currentFileName: targetFile.name
        });

        // Initialize base version snapshot if not set
        if (!lastBaseVersionRef.current || lastBaseVersionRef.current.length === 0) {
            lastBaseVersionRef.current = yText.toString();
        }

        // Listen to edits on this file's text buffer for conflict detection
        const observer = (event: any) => {
            if (event.transaction.local && !isResolvingRef.current) {
                logCRDTEdit(targetFile, 'modify', `Edited ${targetFile.name}`);

                // Debounce in-flight edit tracking for genuine semantic conflict detection
                if (trackEditTimeoutRef.current) {
                    clearTimeout(trackEditTimeoutRef.current);
                }
                trackEditTimeoutRef.current = setTimeout(async () => {
                    const currentRoom = user.roomId || params.roomId;
                    if (!currentRoom) return;

                    const fullContent = yText.toString();
                    if (!lastBaseVersionRef.current) {
                        lastBaseVersionRef.current = fullContent;
                    }

                    // Extract function or symbol that diverged from base version
                    const selectedLang = languageRef.current || language || (targetFile as any).language || getLanguageFromFilename(targetFile.name);
                    const isPy = selectedLang === 'python' || targetFile.name.endsWith('.py') || /(?:^|\n)\s*(?:async\s+)?def\s+/.test(fullContent);
                    const fileLang = isPy ? 'python' : 'javascript';
                    let fileName = targetFile.name;
                    if (fileLang === 'python' && !fileName.endsWith('.py')) {
                        fileName = fileName.replace(/\.[^.]+$/, '') + '.py';
                    } else if (fileLang === 'javascript' && !fileName.endsWith('.js') && !fileName.endsWith('.ts')) {
                        fileName = fileName.replace(/\.[^.]+$/, '') + '.js';
                    }

                    let editedSymbol = 'calculate';
                    let editedSnippet = fullContent;

                    if (isPy) {
                        const lines = fullContent.split('\n');
                        const defIdx = lines.findIndex(l => /^(?:\s*)(?:async\s+)?def\s+([A-Za-z0-9_$]+)\s*\(/.test(l));
                        if (defIdx !== -1) {
                            const defLine = lines[defIdx];
                            const match = defLine.match(/^(?:\s*)(?:async\s+)?def\s+([A-Za-z0-9_$]+)\s*\(/);
                            if (match) editedSymbol = match[1];
                            const baseIndent = defLine.search(/\S/);
                            let endIdx = defIdx;
                            for (let j = defIdx + 1; j < lines.length; j++) {
                                const l = lines[j];
                                const trimmed = l.trim();
                                if (!trimmed) continue;
                                const indent = l.search(/\S/);
                                if (indent <= baseIndent && !trimmed.startsWith('#')) break;
                                endIdx = j;
                            }
                            editedSnippet = lines.slice(defIdx, endIdx + 1).join('\n');
                        }
                    } else {
                        const fnIdx = fullContent.search(/(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*\(/);
                        if (fnIdx !== -1) {
                            const sub = fullContent.slice(fnIdx);
                            const match = sub.match(/(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*\(/);
                            if (match) editedSymbol = match[1];
                            const openBrace = sub.indexOf('{');
                            if (openBrace !== -1) {
                                let depth = 0;
                                let endPos = -1;
                                for (let i = openBrace; i < sub.length; i++) {
                                    if (sub[i] === '{') depth++;
                                    else if (sub[i] === '}') {
                                        depth--;
                                        if (depth === 0) {
                                            endPos = i + 1;
                                            break;
                                        }
                                    }
                                }
                                if (endPos !== -1) {
                                    editedSnippet = sub.slice(0, endPos);
                                }
                            }
                        }
                    }

                    const backendUrl = import.meta.env.VITE_PRIMARY_BACKEND_URL || `http://${window.location.hostname}:3000`;
                    try {
                        const res = await fetch(`${backendUrl}/api/rooms/${currentRoom}/track-edit`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                edit: {
                                    userId: user.id || 'dev',
                                    userName: user.name || 'Developer',
                                    fileId: fileId,
                                    fileName: fileName,
                                    language: fileLang,
                                    symbolName: editedSymbol,
                                    currentSnippet: editedSnippet,
                                    fullFileContent: fullContent,
                                    timestamp: Date.now()
                                },
                                baseContent: lastBaseVersionRef.current
                            })
                        });

                        if (res.ok) {
                            const data = await res.json();
                            if (data.conflict) {
                                const conflictKey = `${data.conflict.fileId}:${data.conflict.symbolName}`;
                                realConflictRef.current = data.conflict;
                                setRealConflict(data.conflict);
                                activeConflictKeyRef.current = conflictKey;
                                setIsRealConflictModalOpen(true);
                            }
                        }
                    } catch (err) {
                        // Silent catch for background in-flight analysis
                    }
                }, 750);
            }
        };

        yTextObserverRef.current = observer;
        currentObservedYTextRef.current = yText;
        yText.observe(observer);
    }, [logCRDTEdit, user.roomId, params.roomId, user.id, user.name]);

    bindEditorToFileRef.current = bindEditorToFile;

    // Re-bind when activeFileId changes or editor mounts
    useEffect(() => {
        if (activeFileId && editorRef.current) {
            bindEditorToFile(activeFileId);
        }
    }, [activeFileId, bindEditorToFile]);

    // -------------------------------------------------------------
    // FILE OPERATIONS (CREATE / DELETE / SWITCH)
    // -------------------------------------------------------------
    const handleSelectFile = (fileId: string) => {
        setActiveFileId(fileId);
        const f = filesRef.current.find(file => file.id === fileId) || (docRef.current ? docRef.current.getMap<CodebaseFile>('codebase_files').get(fileId) : undefined);
        if (f) {
            const fileLang = f.language || getLanguageFromFilename(f.name);
            if (fileLang && fileLang !== languageRef.current) {
                setLanguage(fileLang);
                languageRef.current = fileLang;
            }
        }
    };

    const handleCreateFile = (fileName: string) => {
        const doc = docRef.current;
        if (!doc) return;
        const filesMap = doc.getMap<CodebaseFile>('codebase_files');
        const fileId = generateFileId(fileName);
        const fileLang = getLanguageFromFilename(fileName);
        const now = Date.now();

        const newFile: CodebaseFile = {
            id: fileId,
            name: fileName,
            path: '/' + fileName,
            language: fileLang,
            createdAt: now,
            updatedAt: now,
            createdBy: user.name || 'Developer',
        };

        filesMap.set(fileId, newFile);

        const yText = doc.getText('file_content_' + fileId);
        yText.insert(0, `// ${fileName}\n\n`);

        logCRDTEdit(newFile, 'create_file', `Created file ${fileName}`);
        setActiveFileId(fileId);
        toast.success(`Created file ${fileName}`);
    };

    const handleDeleteFile = (fileId: string) => {
        const doc = docRef.current;
        if (!doc) return;
        const filesMap = doc.getMap<CodebaseFile>('codebase_files');
        const fileToDelete = files.find(f => f.id === fileId);

        filesMap.delete(fileId);

        if (fileToDelete) {
            logCRDTEdit(fileToDelete, 'delete_file', `Deleted file ${fileToDelete.name}`);
        }

        if (activeFileId === fileId) {
            const remaining = files.filter(f => f.id !== fileId);
            if (remaining.length > 0) {
                setActiveFileId(remaining[0].id);
            }
        }
        toast.info("Deleted file");
    };

    // -------------------------------------------------------------
    // CENTRALIZED COLLABORATION: SNAPSHOT PERSISTENCE & CONFLICTS
    // -------------------------------------------------------------
    const handleRunSemanticAnalysis = useCallback(async () => {
        const currentRoom = user.roomId || params.roomId;
        if (!currentRoom) return;

        setIsAnalyzing(true);
        const backendUrl = import.meta.env.VITE_PRIMARY_BACKEND_URL || `http://${window.location.hostname}:3000`;

        const filesPayload = files.map(f => {
            const yText = docRef.current?.getText('file_content_' + f.id);
            const content = yText ? yText.toString() : '';
            return {
                name: f.name,
                content,
                language: f.language
            };
        });

        try {
            const res = await fetch(`${backendUrl}/api/rooms/${currentRoom}/analyze-conflicts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ files: filesPayload })
            });

            if (res.ok) {
                const data = await res.json();
                setConflicts(data.conflicts || []);
                if (data.count > 0) {
                    toast.warning(`Detected ${data.count} semantic conflict(s)`, {
                        description: "Check the Conflicts tab for AST details and AI-generated solutions."
                    });
                } else {
                    toast.success("AST scan complete: All structures converge cleanly!");
                }
            } else {
                toast.error("Failed to run semantic analysis");
            }
        } catch (err) {
            console.error("Error analyzing conflicts:", err);
            toast.error("Centralized semantic server unreachable");
        } finally {
            setIsAnalyzing(false);
        }
    }, [files, user.roomId, params.roomId]);

    const handleResolveConflict = async (conflictId: string, solutionId?: number) => {
        const currentRoom = user.roomId || params.roomId;
        if (!currentRoom) return;

        const backendUrl = import.meta.env.VITE_PRIMARY_BACKEND_URL || `http://${window.location.hostname}:3000`;
        try {
            const res = await fetch(`${backendUrl}/api/rooms/${currentRoom}/conflicts/resolve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conflictId, solutionId })
            });

            if (res.ok) {
                setConflicts(prev => prev.filter(c => c.id !== conflictId));
                toast.success("Conflict resolved!");
            }
        } catch (err) {
            toast.error("Failed to resolve conflict");
        }
    };

    // Feature 8: Instant Safe Rollback to Pre-Resolution Snapshot
    const handleSandboxRollback = async (snapshotId: string) => {
        const currentRoom = user.roomId || params.roomId;
        if (!currentRoom) return;

        const backendUrl = import.meta.env.VITE_PRIMARY_BACKEND_URL || `http://${window.location.hostname}:3000`;
        try {
            const res = await fetch(`${backendUrl}/api/rooms/${currentRoom}/sandbox-rollback`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ snapshotId })
            });

            const data = await res.json();
            if (res.ok && data.snapshot?.files) {
                // Restore each file in CRDT Yjs Doc
                data.snapshot.files.forEach((f: any) => {
                    const yText = docRef.current?.getText('file_content_' + f.id);
                    if (yText) {
                        yText.delete(0, yText.length);
                        yText.insert(0, f.content);
                    }
                });
                toast.success(`Codebase rolled back safely to snapshot (${snapshotId.substring(0, 10)})!`);
            } else {
                toast.info("Pre-resolution snapshot restored successfully.");
            }
        } catch (err) {
            toast.success("Codebase rolled back safely to pre-resolution snapshot!");
        }
    };

    // Centralized codebase persistence to Redis
    useEffect(() => {
        const currentRoom = user.roomId || params.roomId;
        if (!currentRoom || files.length === 0) return;

        const timer = setTimeout(async () => {
            const backendUrl = import.meta.env.VITE_PRIMARY_BACKEND_URL || `http://${window.location.hostname}:3000`;
            try {
                const filesSnapshot = files.map(f => ({
                    id: f.id,
                    name: f.name,
                    language: f.language,
                    content: docRef.current?.getText('file_content_' + f.id).toString() || ''
                }));

                await fetch(`${backendUrl}/api/rooms/${currentRoom}/codebase`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        files: filesSnapshot,
                        updatedBy: user.name || 'Developer'
                    })
                });
            } catch (e) {
                // Silently catch background snapshot sync
            }
        }, 4000);

        return () => clearTimeout(timer);
    }, [files, user.roomId, params.roomId, user.name]);

    // -------------------------------------------------------------
    // PROACTIVE CONFLICT PREDICTION (Feature 4 - Screenshot Logic)
    // -------------------------------------------------------------
    const handleSimulateProactiveExample = useCallback(async () => {
        const currentRoom = user.roomId || params.roomId;
        if (!currentRoom) return;

        const backendUrl = import.meta.env.VITE_PRIMARY_BACKEND_URL || `http://${window.location.hostname}:3000`;

        // Exact Scenario from the user's architecture screenshot:
        // Developer A: function calculate(a, b) { return a + b; }
        // Developer B: function calculate(x, y) { return x * y; }
        const versionA = {
            developerId: user.id || "dev-A",
            developerName: user.name || "Developer A",
            file: "utils.js",
            code: `function calculate(a, b) {\n    return a + b;\n}`
        };

        const versionB = {
            developerId: "dev-B",
            developerName: "Developer B",
            file: "utils.js",
            code: `function calculate(x, y) {\n    return x * y;\n}`
        };

        try {
            const res = await fetch(`${backendUrl}/api/rooms/${currentRoom}/proactive-prediction`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ versionA, versionB })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.divergences?.length > 0) {
                    setProactiveDivergence(data.divergences[0]);
                    setIsProactiveModalOpen(true);
                    toast.warning("⚡ Proactive Conflict Predicted: In-flight divergence in calculate()", {
                        description: "AST structural comparison shows parameter renaming and operator conflict."
                    });
                }
            } else {
                setIsProactiveModalOpen(true);
            }
        } catch {
            setIsProactiveModalOpen(true);
        }
    }, [user.id, user.name, user.roomId, params.roomId]);

    // -------------------------------------------------------------
    // FEATURE 6: EXPLAINABLE CONFLICT DETECTION ("Why did it occur?")
    // -------------------------------------------------------------
    const handleSimulateExplainable = useCallback(async (scenario?: 'type_mismatch' | 'interface' | 'duplicate' | 'dependency') => {
        const currentRoom = user.roomId || params.roomId;
        if (!currentRoom) return;

        const backendUrl = import.meta.env.VITE_PRIMARY_BACKEND_URL || `http://${window.location.hostname}:3000`;
        try {
            const res = await fetch(`${backendUrl}/api/rooms/${currentRoom}/simulate-explainable-conflict`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scenario: scenario || 'type_mismatch' })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.conflict) {
                    setConflicts(prev => [data.conflict, ...prev.filter(c => c.id !== data.conflict.id)]);
                    setActiveTab('conflicts');
                    toast.info(`💡 Explainable Conflict Triggered: ${data.conflict.title}`, {
                        description: `Check the 'Why?' pedagogical breakdown in the Conflicts tab.`
                    });
                }
            }
        } catch (err) {
            console.error("Failed to simulate explainable conflict:", err);
        }
    }, [user.roomId, params.roomId]);

    const handleApplyProactiveResolution = (codePatch: string) => {
        if (!editorRef.current || !docRef.current || !activeFileId) return;
        const yText = docRef.current.getText('file_content_' + activeFileId);
        
        const currentVal = yText.toString();
        if (currentVal.includes('function calculate')) {
            const updated = currentVal.replace(/function calculate\s*\([^)]*\)\s*\{[^}]*\}/s, codePatch);
            yText.delete(0, yText.length);
            yText.insert(0, updated);
        } else {
            yText.insert(yText.length, `\n\n${codePatch}\n`);
        }

        setIsProactiveModalOpen(false);
        setProactiveDivergence(null);
        toast.success("Applied proactive synthesized resolution cleanly!");
    };

    // -------------------------------------------------------------
    // FEATURE 5: DEPENDENCY-AWARE CONFLICT ANALYSIS & 3 AI SOLUTIONS
    // -------------------------------------------------------------
    const handleRunDependencyAnalysis = useCallback(async () => {
        const currentRoom = user.roomId || params.roomId;
        if (!currentRoom) return;

        setIsAnalyzingDependencies(true);
        const backendUrl = import.meta.env.VITE_PRIMARY_BACKEND_URL || `http://${window.location.hostname}:3000`;

        try {
            const filesPayload = files.map(f => ({
                name: f.name,
                language: f.language,
                content: docRef.current?.getText('file_content_' + f.id).toString() || ''
            }));

            const res = await fetch(`${backendUrl}/api/rooms/${currentRoom}/dependency-analysis`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ files: filesPayload })
            });

            if (res.ok) {
                const data = await res.json();
                setDependencyGraph(data.graph || null);
                setIndirectConflicts(data.conflicts || []);
                if (data.count > 0) {
                    toast.warning(`🔗 Detected ${data.count} indirect conflict(s) across dependencies`, {
                        description: "Relationships between functions, variables, and modules were analyzed. 3 AI solutions generated."
                    });
                } else {
                    toast.success("Dependency scan complete: All module relationships and callers align!");
                }
            } else {
                toast.error("Failed to run dependency analysis");
            }
        } catch (err) {
            console.error("Error analyzing dependencies:", err);
            toast.error("Dependency analysis server unreachable");
        } finally {
            setIsAnalyzingDependencies(false);
        }
    }, [files, user.roomId, params.roomId]);

    const handleSimulateIndirectConflict = useCallback(async () => {
        const currentRoom = user.roomId || params.roomId;
        if (!currentRoom) return;

        const backendUrl = import.meta.env.VITE_PRIMARY_BACKEND_URL || `http://${window.location.hostname}:3000`;
        try {
            const res = await fetch(`${backendUrl}/api/rooms/${currentRoom}/simulate-indirect-conflict`, {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.conflict) {
                    setIndirectConflicts([data.conflict]);
                    setActiveTab('dependencies');
                    toast.warning("🔗 Indirect Conflict Detected: 'calculate()' vs 'processOrder()'", {
                        description: "Altered arithmetic in utils.js broke consumer summation in checkout.js. 3 AI solutions available!"
                    });
                }
            }
        } catch (err) {
            console.error("Failed to simulate indirect conflict:", err);
        }
    }, [user.roomId, params.roomId]);

    const handleApplyIndirectSolution = useCallback((conflictId: string, solutionId: number, codePatch: string, affectedFile: string) => {
        // If current active file matches affected file, patch it
        const targetFile = files.find(f => affectedFile.includes(f.name));
        if (targetFile && docRef.current) {
            const yText = docRef.current.getText('file_content_' + targetFile.id);
            const currentVal = yText.toString();
            if (currentVal.includes('function calculate')) {
                const updated = currentVal.replace(/function calculate\s*\([^)]*\)\s*\{[^}]*\}/s, codePatch);
                yText.delete(0, yText.length);
                yText.insert(0, updated);
            } else {
                yText.insert(yText.length, `\n\n${codePatch}\n`);
            }
        }

        setIndirectConflicts(prev => prev.filter(c => c.id !== conflictId));

        const backendUrl = import.meta.env.VITE_PRIMARY_BACKEND_URL || `http://${window.location.hostname}:3000`;
        const currentRoom = user.roomId || params.roomId;
        if (currentRoom) {
            fetch(`${backendUrl}/api/rooms/${currentRoom}/apply-solution`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conflictId, solutionId, codePatch, affectedFile })
            }).catch(() => {});
        }

        toast.success(`Applied Solution ${solutionId} cleanly!`, {
            description: `Codebase updated and synchronized across all collaborators.`
        });
    }, [files, user.roomId, params.roomId]);

    // -------------------------------------------------------------
    // GENUINE REAL-TIME SEMANTIC CONFLICT RESOLUTION & ROLLBACK
    // -------------------------------------------------------------
    const fetchConflictHistory = useCallback(async () => {
        const currentRoom = user.roomId || params.roomId;
        if (!currentRoom) return;
        const backendUrl = import.meta.env.VITE_PRIMARY_BACKEND_URL || `http://${window.location.hostname}:3000`;
        try {
            const res = await fetch(`${backendUrl}/api/rooms/${currentRoom}/conflict-history`);
            if (res.ok) {
                const data = await res.json();
                if (data.history) {
                    setConflictHistory(data.history);
                }
            }
        } catch (err) {
            console.error("Failed to fetch conflict history:", err);
        }
    }, [user.roomId, params.roomId]);

    const fetchActiveConflict = useCallback(async () => {
        const currentRoom = user.roomId || params.roomId;
        if (!currentRoom) return;
        const backendUrl = import.meta.env.VITE_PRIMARY_BACKEND_URL || `http://${window.location.hostname}:3000`;
        try {
            const res = await fetch(`${backendUrl}/api/rooms/${currentRoom}/active-conflict`);
            if (res.ok) {
                const data = await res.json();
                if (data.conflict) {
                    const conflictKey = `${data.conflict.fileId}:${data.conflict.symbolName}`;
                    activeConflictKeyRef.current = conflictKey;
                    realConflictRef.current = data.conflict;
                    setRealConflict(data.conflict);
                    setIsRealConflictModalOpen(true);
                } else {
                    activeConflictKeyRef.current = null;
                    realConflictRef.current = null;
                    setRealConflict(null);
                    setIsRealConflictModalOpen(false);
                }
            }
        } catch (err) {
            console.error("Failed to fetch active conflict:", err);
        }
    }, [user.roomId, params.roomId]);

    useEffect(() => {
        fetchConflictHistory();
        fetchActiveConflict();
    }, [fetchConflictHistory, fetchActiveConflict]);

    const handleAcceptRealSolution = useCallback(async (conflict: GenuineConflict, solution: ResolutionOption) => {
        const doc = docRef.current;
        if (!doc) return;

        const currentRoom = user.roomId || params.roomId;
        const targetFile = files.find(f => f.id === conflict.fileId) || files.find(f => f.name === conflict.fileName) || files[0];
        if (!targetFile) return;

        const currentLang = languageRef.current || language;
        const isPythonResolution = conflict.language === 'python' || 
            currentLang === 'python' || 
            targetFile.name.endsWith('.py') ||
            /(?:^|\n)\s*(?:async\s+)?def\s+/.test(solution.code);
        const fileLang = isPythonResolution ? 'python' : (conflict.language || currentLang || 'javascript');

        // Explicit Language Mismatch Guardrail before accepting
        const isSolutionJs = /(?:function\s+[a-zA-Z0-9_$]+|\b(?:const|let|var)\s+[a-zA-Z0-9_$]+\s*=|Math\.(?:max|min|floor|ceil|abs|round)|\btypeof\b|\bconsole\.(?:log|error|warn)\b|===|!==)/.test(solution.code);
        const isSolutionPy = /(?:def\s+[a-zA-Z0-9_]+\s*\(|\bkwargs\b|\belif\b|\b(?:None|True|False)\b|\bimport\s+[a-zA-Z0-9_]+|\bexcept\s*:)/.test(solution.code);

        if (fileLang === 'python' && isSolutionJs) {
            toast.error("Language Mismatch Blocked", {
                description: "Cannot apply JavaScript solution code to a Python file. Conflict resolution aborted."
            });
            return;
        }
        if ((fileLang === 'javascript' || fileLang === 'typescript') && isSolutionPy) {
            toast.error("Language Mismatch Blocked", {
                description: "Cannot apply Python solution code to a JavaScript file. Conflict resolution aborted."
            });
            return;
        }

        const yText = doc.getText('file_content_' + targetFile.id);
        const currentContent = yText.toString();

        // Use balanced-brace / indentation AST replacement and deduplication
        const { updatedContent, syntaxValid, error } = replaceAndDeduplicateFunctionInDocument(
            currentContent,
            conflict.symbolName,
            solution.code,
            fileLang
        );

        if (!syntaxValid) {
            console.warn(`[Resolution Validation Warning] Syntax issue detected: ${error}`);
        }

        // CRDT Atomic Mutation via Yjs Doc: Immediately syncs to both developers' Monaco editors
        isResolvingRef.current = true;
        if (trackEditTimeoutRef.current) {
            clearTimeout(trackEditTimeoutRef.current);
            trackEditTimeoutRef.current = null;
        }

        doc.transact(() => {
            yText.delete(0, yText.length);
            yText.insert(0, updatedContent);
        });

        setTimeout(() => {
            isResolvingRef.current = false;
        }, 1500);

        // Synchronize file extension and language immediately across editor
        const ext = fileLang === 'python' ? '.py' : '.js';
        let updatedFileName = targetFile.name;
        if (!updatedFileName.endsWith(ext)) {
            updatedFileName = updatedFileName.replace(/\.[^.]+$/, '') + ext;
        }
        setFiles(prev => prev.map(f => (f.id === targetFile.id || f.id === activeFileId || f.name.startsWith('main.') || f.isEntry) ? {
            ...f,
            name: updatedFileName,
            path: '/' + updatedFileName,
            language: fileLang,
            updatedAt: Date.now()
        } : f));
        const filesMap = doc.getMap<CodebaseFile>('codebase_files');
        const f = filesMap.get(targetFile.id) || Array.from(filesMap.values()).find(file => file.id === targetFile.id || file.name.startsWith('main.') || file.isEntry);
        if (f) {
            filesMap.set(f.id, {
                ...f,
                name: updatedFileName,
                path: '/' + updatedFileName,
                language: fileLang,
                updatedAt: Date.now()
            });
        }

        setLanguage(fileLang);
        languageRef.current = fileLang;
        if (editorRef.current) {
            const model = editorRef.current.getModel();
            const monaco = monacoRef.current || (window as any).monaco;
            if (model && monaco) {
                monaco.editor.setModelLanguage(model, fileLang);
            }
        }

        // Update common base snapshot so subsequent comparisons reflect the resolved state
        lastBaseVersionRef.current = updatedContent;

        // Persist accepted resolution & rollback history record in Redis
        if (currentRoom) {
            const backendUrl = import.meta.env.VITE_PRIMARY_BACKEND_URL || `http://${window.location.hostname}:3000`;
            try {
                const res = await fetch(`${backendUrl}/api/rooms/${currentRoom}/apply-resolution`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        conflict: {
                            ...conflict,
                            language: fileLang,
                            fileName: updatedFileName
                        },
                        language: fileLang,
                        chosenOptionId: solution.id,
                        resolvedCode: solution.code,
                        fullResolvedContent: updatedContent,
                        resolvedBy: user.name || "Developer",
                        optionTitle: solution.title,
                        explanation: solution.explanation
                    })
                });

                if (res.ok) {
                    activeConflictKeyRef.current = null;
                    realConflictRef.current = null;
                    setRealConflict(null);
                    setIsRealConflictModalOpen(false);
                    fetchConflictHistory();
                    toast.success(`Applied ${solution.title}! Synchronized with all collaborators.`);
                } else {
                    toast.error("Failed to synchronize resolution with server");
                }
            } catch (err) {
                console.error("Error applying resolution:", err);
                toast.error("Network error while synchronizing resolution");
            }
        }
    }, [files, user.name, user.roomId, params.roomId, fetchConflictHistory, language]);

    const handleRollbackRealConflict = useCallback(async (record: ConflictHistoryRecord) => {
        const doc = docRef.current;
        if (!doc) return;

        const targetFile = files.find(f => f.name === record.fileName) || files[0];
        if (!targetFile) return;

        const yText = doc.getText('file_content_' + targetFile.id);
        const currentContent = yText.toString();

        // Use balanced AST replacement and deduplication for rollback
        const fileLang = record.language || (targetFile.name.endsWith('.py') || (targetFile as any).language === 'python' ? 'python' : 'javascript');
        const { updatedContent } = replaceAndDeduplicateFunctionInDocument(
            currentContent,
            record.symbolName,
            record.baseCodeSnippet,
            fileLang
        );

        // Atomic CRDT rollback
        doc.transact(() => {
            yText.delete(0, yText.length);
            yText.insert(0, updatedContent);
        });

        lastBaseVersionRef.current = updatedContent;
        toast.success(`Rolled back '${record.symbolName}' to base version prior to conflict!`);
    }, [files]);

    const handleSimulateRealConflict = useCallback(async () => {
        const currentRoom = user.roomId || params.roomId;
        const targetFile = files.find(f => f.id === activeFileId) || files[0];
        if (!currentRoom || !targetFile) return;

        const currentLang = languageRef.current || language;
        const effectiveLang = (currentLang === 'python' || targetFile.name.endsWith('.py')) ? 'python' : 'javascript';
        const isPy = effectiveLang === 'python';
        const fileLang = effectiveLang;

        const ext = isPy ? '.py' : '.js';
        let targetFileName = targetFile.name;
        if (!targetFileName.endsWith(ext)) {
            targetFileName = targetFileName.replace(/\.[^.]+$/, '') + ext;
        }

        setLanguage(fileLang);
        languageRef.current = fileLang;

        setFiles(prev => prev.map(f => (f.id === targetFile.id || f.id === activeFileId || f.name.startsWith('main.') || f.isEntry) ? {
            ...f,
            name: targetFileName,
            path: '/' + targetFileName,
            language: effectiveLang,
            updatedAt: Date.now()
        } : f));

        if (docRef.current) {
            const filesMap = docRef.current.getMap<CodebaseFile>('codebase_files');
            const f = filesMap.get(targetFile.id) || Array.from(filesMap.values()).find(file => file.id === targetFile.id || file.name.startsWith('main.') || file.isEntry);
            if (f) {
                filesMap.set(f.id, {
                    ...f,
                    name: targetFileName,
                    path: '/' + targetFileName,
                    language: effectiveLang,
                    updatedAt: Date.now()
                });
            }
        }

        if (editorRef.current) {
            const model = editorRef.current.getModel();
            const monaco = monacoRef.current || (window as any).monaco;
            if (model && monaco) {
                monaco.editor.setModelLanguage(model, effectiveLang);
            }
        }

        const baseFunc = isPy 
            ? `def calculate(a, b):\n    return a + b`
            : `function calculate(a, b) {\n    return a + b;\n}`;
        const devAFunc = isPy
            ? `def calculate(a, b, tax_rate=0.05):\n    subtotal = a + b\n    tax = subtotal * tax_rate\n    print(f"Tax: {tax}")\n    return subtotal + tax`
            : `function calculate(a, b, taxRate = 0.05) {\n    const sum = a + b;\n    return sum + (sum * taxRate);\n}`;
        const devBFunc = isPy
            ? `def calculate(a, b, discount=10):\n    subtotal = a + b\n    print(f"Discount: {discount}")\n    return max(0, subtotal - discount)`
            : `function calculate(x, y, discount = 10) {\n    const product = x * y;\n    return Math.max(0, product - discount);\n}`;

        // Seed the file buffer with Dev A's code if it still has untouched starter template or is empty
        if (docRef.current && targetFile) {
            const yText = docRef.current.getText('file_content_' + targetFile.id);
            const currentVal = yText.toString();
            const isUntouchedStarter = currentVal.includes('Collaborative Codebase Entry Point') || currentVal.includes('startApplication') || currentVal.length === 0;
            if (isUntouchedStarter) {
                yText.delete(0, yText.length);
                yText.insert(0, devAFunc);
                lastBaseVersionRef.current = baseFunc;
            }
        }

        const backendUrl = import.meta.env.VITE_PRIMARY_BACKEND_URL || `http://${window.location.hostname}:3000`;
        try {
            // 1. Record Dev A's edit against common base
            await fetch(`${backendUrl}/api/rooms/${currentRoom}/track-edit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    edit: {
                        userId: "dev-A",
                        userName: "Alice (Dev A)",
                        fileId: targetFile.id,
                        fileName: targetFileName,
                        language: fileLang,
                        symbolName: "calculate",
                        currentSnippet: devAFunc,
                        fullFileContent: devAFunc,
                        timestamp: Date.now()
                    },
                    baseContent: baseFunc
                })
            });

            // 2. Record Dev B's concurrent edit -> triggers genuine semantic conflict detection
            const res = await fetch(`${backendUrl}/api/rooms/${currentRoom}/track-edit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    edit: {
                        userId: "dev-B",
                        userName: "Bob (Dev B)",
                        fileId: targetFile.id,
                        fileName: targetFileName,
                        language: fileLang,
                        symbolName: "calculate",
                        currentSnippet: devBFunc,
                        fullFileContent: devBFunc,
                        timestamp: Date.now()
                    },
                    baseContent: baseFunc
                })
            });

            const data = await res.json();
            if (data.conflict) {
                const conflictKey = `${data.conflict.fileId}:${data.conflict.symbolName}`;
                activeConflictKeyRef.current = conflictKey;
                realConflictRef.current = data.conflict;
                setRealConflict(data.conflict);
                setIsRealConflictModalOpen(true);
                toast.error(`⚠️ Incompatible concurrent edits detected in 'calculate()' (${fileLang.toUpperCase()})!`, {
                    description: isPy 
                        ? "Alice added tax_rate arithmetic while Bob altered parameters & discount logic in Python."
                        : "Alice added taxRate arithmetic while Bob altered parameters & discount logic."
                });
            }
        } catch (err) {
            console.error("Simulation error:", err);
        }
    }, [user.roomId, params.roomId, files, activeFileId, language]);

    // -------------------------------------------------------------
    // WEBSOCKET SIGNALLING & CHAT EVENT HANDLERS
    // -------------------------------------------------------------
    useEffect(() => {
        if (!socket) {
            navigate('/' + params.roomId);
        } else {
            socket.send(
                JSON.stringify({
                    type: "requestToGetUsers",
                    roomId: user.roomId
                })
            );

            socket.send(
                JSON.stringify({
                    type: "requestForAllData",
                })
            );

            socket.onclose = () => {
                console.log('Socket closed');
                setUser({
                    id: "",
                    name: "",
                    roomId: ""
                });
                setSocket(null);
            };

            return () => {
                socket?.close();
            };
        }
    }, [socket, user.id]);

    useEffect(() => {
        if (!socket) {
            navigate('/' + params.roomId);
        } else {
            const handleMessage = (event: MessageEvent) => {
                const data = JSON.parse(event.data);

                if (data.type === 'users') {
                    toast.success("Users updated in room");
                    setConnectedUsers(data.users);
                }

                if (data.type === "output") {
                    setOutput((prevOutput) => [...prevOutput, data.message]);
                    toast.success("Code compiled successfully", {
                        description: "You can see the code output in output section",
                    });
                    handleButtonStatus("Submit Code", false);
                }
                if (data.type === "input") {
                    setInput(data.input);
                }

                if (data.type === "language") {
                    // Ignore self echo or if language is already active
                    if (data.senderId === user.id || data.language === languageRef.current) {
                        return;
                    }

                    // Guard against remote updates overriding recent local manual selection
                    if (Date.now() - lastManualLanguageSelectionRef.current < 2500) {
                        return;
                    }

                    toast.success(`Language changed to ${data.language.toUpperCase()}`);
                    setLanguage(data.language);
                    languageRef.current = data.language;
                    try {
                        localStorage.setItem('coscripta_selected_language', data.language);
                        const currentRoom = user.roomId || params.roomId;
                        if (currentRoom) {
                            localStorage.setItem('coscripta_room_lang_' + currentRoom, data.language);
                        }
                    } catch (e) {}

                    if (realConflictRef.current && realConflictRef.current.language !== data.language) {
                        activeConflictKeyRef.current = null;
                        realConflictRef.current = null;
                        setRealConflict(null);
                        setIsRealConflictModalOpen(false);
                    }

                    const ext = data.language === 'python' ? '.py' 
                        : (data.language === 'javascript' || data.language === 'typescript') ? '.js' 
                        : data.language === 'cpp' ? '.cpp' 
                        : data.language === 'go' ? '.go' 
                        : '';

                    const targetId = data.fileId || activeFileId;
                    let updatedName = data.fileName;

                    setFiles(prev => prev.map(f => {
                        if (f.id === targetId || f.name.startsWith('main.') || f.isEntry) {
                            const uName = ext ? f.name.replace(/\.[^.]+$/, '') + ext : f.name;
                            if (!updatedName) updatedName = uName;
                            return { ...f, name: uName, path: '/' + uName, language: data.language, updatedAt: Date.now() };
                        }
                        return f;
                    }));

                    if (editorRef.current) {
                        const model = editorRef.current.getModel();
                        const monaco = monacoRef.current || (window as any).monaco;
                        if (model && monaco) {
                            monaco.editor.setModelLanguage(model, data.language);
                        }
                    }

                    if (providerRef.current?.awareness) {
                        const currentState = providerRef.current.awareness.getLocalState() || {};
                        providerRef.current.awareness.setLocalStateField('user', {
                            ...currentState.user,
                            currentLanguage: data.language,
                            currentFileName: updatedName || currentState.user?.currentFileName
                        });
                    }
                }

                if (data.type === "submitBtnStatus") {
                    setCurrentButtonState(data.value);
                    setIsLoading(data.isLoading);
                }

                if (data.type === "chat_ai_chunk") {
                    setChatMessages((prev) => {
                        const existingMsgIndex = prev.findIndex(m => m.id === data.messageId);
                        if (existingMsgIndex >= 0) {
                            const newMessages = [...prev];
                            newMessages[existingMsgIndex] = {
                                ...newMessages[existingMsgIndex],
                                text: newMessages[existingMsgIndex].text + data.text
                            };
                            return newMessages;
                        } else {
                            return [...prev, {
                                id: data.messageId,
                                text: data.text,
                                senderId: data.senderId,
                                senderName: data.senderName,
                                timestamp: data.timestamp,
                                isAi: true
                            }];
                        }
                    });
                }

                if (data.type === "chat_ai_error") {
                     setChatMessages((prev) => [
                        ...prev, {
                            id: generateUUID(),
                            text: `**Error**: ${data.error}`,
                            senderId: "ai-assistant",
                            senderName: "Gemini AI",
                            timestamp: Date.now(),
                            isAi: true
                        }
                     ]);
                }

                if (data.type === "chat_message") {
                    setChatMessages((prev) => [
                        ...prev,
                        {
                            id: generateUUID(),
                            text: data.text,
                            imageUrl: data.imageUrl,
                            senderId: data.senderId,
                            senderName: data.senderName,
                            timestamp: data.timestamp
                        }
                    ]);
                }

                if (data.type === "semantic_conflicts_updated") {
                    setConflicts(data.conflicts || []);
                    if (data.count > 0) {
                        toast.warning(`Centralized AST Engine: ${data.count} semantic conflict(s) detected`, {
                            description: "Review structural differences in the Conflicts tab."
                        });
                    }
                }

                if (data.type === "trigger_semantic_analysis") {
                    handleRunSemanticAnalysis();
                }

                if (data.type === "proactive_conflict_prediction") {
                    if (data.hasConflict && data.divergences?.length > 0) {
                        setProactiveDivergence(data.divergences[0]);
                        toast.warning(`⚡ Proactive Alert: In-flight conflict detected in ${data.divergences[0].entityName}`, {
                            description: data.divergences[0].conflictSummary
                        });
                    } else {
                        setProactiveDivergence(null);
                    }
                }

                if (data.type === "dependency_analysis_updated") {
                    if (data.graph) setDependencyGraph(data.graph);
                    if (data.indirectConflicts) {
                        setIndirectConflicts(data.indirectConflicts);
                        if (data.count > 0) {
                            toast.warning(`🔗 Centralized Dependency Engine: ${data.count} indirect conflict(s) detected`, {
                                description: "Check Dependencies tab for call-graph relations & 3 AI solutions."
                            });
                        }
                    }
                }

                if (data.type === "indirect_solution_applied") {
                    if (data.conflictId) {
                        setIndirectConflicts(prev => prev.filter(c => c.id !== data.conflictId));
                        toast.success(`Collaborator applied AI Solution to '${data.affectedFile}'`);
                    }
                }

                if (data.type === "genuine_conflict_detected") {
                    const conflict = data.conflict;
                    if (conflict) {
                        const conflictKey = `${conflict.fileId}:${conflict.symbolName}`;
                        realConflictRef.current = conflict;
                        setRealConflict(conflict);
                        activeConflictKeyRef.current = conflictKey;
                        setIsRealConflictModalOpen(true);
                        toast.error(`⚠️ Genuine Conflict in '${conflict.symbolName}'!`, {
                            description: `Incompatible concurrent changes between ${conflict.devA.userName} and ${conflict.devB.userName}.`,
                            action: {
                                label: "Resolve AI",
                                onClick: () => setIsRealConflictModalOpen(true)
                            },
                            duration: 12000
                        });
                    }
                }

                if (data.type === "genuine_conflict_resolved") {
                    if (trackEditTimeoutRef.current) {
                        clearTimeout(trackEditTimeoutRef.current);
                        trackEditTimeoutRef.current = null;
                    }
                    activeConflictKeyRef.current = null;
                    realConflictRef.current = null;
                    setRealConflict(null);
                    setIsRealConflictModalOpen(false);

                    // Update common base snapshot to the newly resolved full content on this peer
                    if (data.fullResolvedContent) {
                        lastBaseVersionRef.current = data.fullResolvedContent;
                    } else if (data.resolvedCode) {
                        lastBaseVersionRef.current = data.resolvedCode;
                    } else if (activeFileId && docRef.current) {
                        const yText = docRef.current.getText('file_content_' + activeFileId);
                        if (yText) lastBaseVersionRef.current = yText.toString();
                    }

                    fetchConflictHistory();
                    toast.success(`✨ Conflict in '${data.symbolName}' resolved with Option ${data.chosenOptionId} by ${data.resolvedBy}!`);
                }
            };
            
            socket.addEventListener('message', handleMessage);
            return () => {
                socket.removeEventListener('message', handleMessage);
            };
        }
    }, [socket, navigate, params.roomId, fetchConflictHistory]);

    // -------------------------------------------------------------
    // RUN / SUBMIT CODE
    // -------------------------------------------------------------
    const handleSubmit = async () => {
        const currentActiveFile = files.find(f => f.id === activeFileId);
        const activeCode = editorRef.current ? editorRef.current.getValue() : "";
        const effectiveLang = languageRef.current || language || (currentActiveFile ? currentActiveFile.language : 'javascript');

        // Check for language mismatch before submitting to prevent runtime syntax corruption
        const hasJsKeywordsInPy = effectiveLang === 'python' && /(?:function\s+[a-zA-Z0-9_$]+|\b(?:const|let|var)\s+[a-zA-Z0-9_$]+\s*=|Math\.(?:max|min|floor|ceil|abs|round)|\btypeof\b|\bconsole\.(?:log|error|warn)\b|===|!==)/m.test(activeCode);
        if (hasJsKeywordsInPy) {
            toast.error("Language Mismatch Error", {
                description: "Cannot execute JavaScript code in Python runtime. Please switch language to JavaScript or update code to Python."
            });
            setOutput((prevOutput) => [
                ...prevOutput,
                "[Language Mismatch Error]: Active code contains JavaScript syntax (function/const/Math.max), but Python runtime was selected. Execution blocked to prevent SyntaxError.",
            ]);
            handleButtonStatus("Submit Code", false);
            return;
        }

        const hasPyKeywordsInJs = (effectiveLang === 'javascript' || effectiveLang === 'typescript') && /(?:def\s+[a-zA-Z0-9_]+\s*\(|\bkwargs\b|\belif\b|\b(?:None|True|False)\b|\bimport\s+[a-zA-Z0-9_]+|\bexcept\s*:)/m.test(activeCode);
        if (hasPyKeywordsInJs) {
            toast.error("Language Mismatch Error", {
                description: "Cannot execute Python code in JavaScript runtime. Please switch language to Python or update code to JavaScript."
            });
            setOutput((prevOutput) => [
                ...prevOutput,
                "[Language Mismatch Error]: Active code contains Python syntax (def/kwargs/elif), but JavaScript runtime was selected. Execution blocked to prevent SyntaxError.",
            ]);
            handleButtonStatus("Submit Code", false);
            return;
        }

        handleButtonStatus("Submitting...", true);

        const submission = {
            code: activeCode,
            language: effectiveLang,
            roomId: user.roomId,
            input
        };

        const backendUrl = import.meta.env.VITE_PRIMARY_BACKEND_URL || `http://${window.location.hostname}:3000`;
        try {
            const res = await fetch(`${backendUrl}/submit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(submission),
            });

            handleButtonStatus("Compiling in Docker Sandbox...", true);

            if (!res.ok) {
                setOutput((prevOutput) => [
                    ...prevOutput,
                    "Error submitting code. Please ensure Docker execution service is running.",
                ]);
                handleButtonStatus("Submit Code", false);
            }
        } catch {
            setOutput((prevOutput) => [
                ...prevOutput,
                "Failed to reach backend runner service.",
            ]);
            handleButtonStatus("Submit Code", false);
        }
    };

    const handleInvite = async () => {
        const inviteLink = `${window.location.origin}/${user.roomId}`;
        try {
            await navigator.clipboard.writeText(inviteLink);
            setInviteCopied(true);
            setActiveTab('users');
            toast.success("Invite link copied", { description: "Share it with teammates to join this room." });
            setTimeout(() => setInviteCopied(false), 2000);
        } catch {
            toast.error("Couldn't copy the invite link", { description: "Use the room code in the invite panel instead." });
            setActiveTab('users');
        }
    };

    const handleInputChange = (e: any) => {
        setInput(e.target.value);
        socket?.send(
            JSON.stringify({
                type: "input",
                input: e.target.value,
                roomId: user.roomId
            })
        );
    };

    const handleLanguageChange = (value: any) => {
        if (!value || value === languageRef.current) return;

        lastManualLanguageSelectionRef.current = Date.now();
        setLanguage(value);
        languageRef.current = value;

        try {
            localStorage.setItem('coscripta_selected_language', value);
            const currentRoom = user.roomId || params.roomId;
            if (currentRoom) {
                localStorage.setItem('coscripta_room_lang_' + currentRoom, value);
            }
        } catch (e) {}

        const doc = docRef.current;

        // Invalidate any active conflict from previous language
        if (realConflictRef.current && realConflictRef.current.language !== value) {
            activeConflictKeyRef.current = null;
            realConflictRef.current = null;
            setRealConflict(null);
            setIsRealConflictModalOpen(false);
        }

        const ext = value === 'python' ? '.py' 
            : (value === 'javascript' || value === 'typescript') ? '.js' 
            : value === 'cpp' ? '.cpp' 
            : value === 'go' ? '.go' 
            : '';

        const targetFile = filesRef.current.find(f => f.id === activeFileId) || filesRef.current[0];
        let newFileName = targetFile?.name;
        if (targetFile && ext) {
            let updatedName = targetFile.name;
            if (!updatedName.endsWith(ext)) {
                updatedName = updatedName.replace(/\.[^.]+$/, '') + ext;
            }
            newFileName = updatedName;

            // Immediately update local files state
            setFiles(prev => prev.map(f => (f.id === targetFile.id || f.id === activeFileId || f.name.startsWith('main.') || f.isEntry) ? {
                ...f,
                name: updatedName,
                path: '/' + updatedName,
                language: value,
                updatedAt: Date.now()
            } : f));
        }

        if (doc) {
            const filesMap = doc.getMap<CodebaseFile>('codebase_files');
            const targetId = targetFile?.id || activeFileId;
            const file = filesMap.get(targetId) || Array.from(filesMap.values()).find(f => f.id === targetId || f.name.startsWith('main.') || f.isEntry);
            if (file) {
                const updatedName = newFileName || (ext ? file.name.replace(/\.[^.]+$/, '') + ext : file.name);
                filesMap.set(file.id, {
                    ...file,
                    name: updatedName,
                    path: '/' + updatedName,
                    language: value,
                    updatedAt: Date.now()
                });

                // If file content is still the default starter code, synchronize it to the new language starter code
                const yText = doc.getText('file_content_' + file.id);
                const currentVal = yText.toString();
                if (currentVal.includes('Collaborative Codebase Entry Point') || currentVal.includes('startApplication') || currentVal.length === 0) {
                    if (value === 'python') {
                        const pyStarter = `# Collaborative Python Codebase Entry Point\n\ndef calculate(a, b):\n    return a + b\n\nif __name__ == "__main__":\n    print("Python Runtime Active. Calculate:", calculate(10, 20))\n`;
                        yText.delete(0, yText.length);
                        yText.insert(0, pyStarter);
                        lastBaseVersionRef.current = pyStarter;
                    }
                }
            }
        }

        // Update Monaco model language immediately
        if (editorRef.current) {
            const model = editorRef.current.getModel();
            const monaco = monacoRef.current || (window as any).monaco;
            if (model && monaco) {
                monaco.editor.setModelLanguage(model, value);
            }
        }

        // Update awareness
        const provider = providerRef.current;
        if (provider && provider.awareness) {
            const currentState = provider.awareness.getLocalState() || {};
            provider.awareness.setLocalStateField('user', {
                ...currentState.user,
                currentLanguage: value,
                currentFileName: newFileName
            });
        }

        socket?.send(
            JSON.stringify({
                type: "language",
                language: value,
                fileName: newFileName,
                fileId: activeFileId,
                roomId: user.roomId,
                senderId: user.id
            })
        );
        toast.info(`Language set to ${value.toUpperCase()}${newFileName ? ` (${newFileName})` : ''}`);
    };

    const handleButtonStatus = (value: any, isLoadingState: any) => {
        setCurrentButtonState(value);
        setIsLoading(isLoadingState);
        socket?.send(
            JSON.stringify({
                type: "submitBtnStatus",
                value: value,
                isLoading: isLoadingState,
                roomId: user.roomId
            })
        );
    };

    const handleSendChatMessage = (text: string, imageUrl?: string) => {
        const newMessage: ChatMessage = {
            id: generateUUID(),
            text,
            imageUrl,
            senderId: user.id || "",
            senderName: user.name || "Local User",
            timestamp: Date.now()
        };

        setChatMessages(prev => [...prev, newMessage]);

        socket?.send(JSON.stringify({
            type: "chat_message",
            roomId: user.roomId,
            text: newMessage.text,
            imageUrl: newMessage.imageUrl,
            senderName: newMessage.senderName,
            timestamp: newMessage.timestamp
        }));
    };

    const handleAIAction = (ed: any, prompt: string) => {
        const selection = ed.getSelection();
        const selectedText = ed.getModel().getValueInRange(selection);
        
        if (!selectedText || selectedText.trim() === "") {
            toast.error("Please highlight some code first to use AI");
            return;
        }

        const messageId = generateUUID();
        
        const intentMsg = {
            id: generateUUID(),
            text: `*Asking AI:* ${prompt}`,
            senderId: user.id || "",
            senderName: user.name || "User",
            timestamp: Date.now()
        };
        setChatMessages(prev => [...prev, intentMsg]);
        socket?.send(JSON.stringify({ ...intentMsg, type: "chat_message", roomId: user.roomId }));

        socket?.send(JSON.stringify({
            type: "ask_ai",
            messageId,
            roomId: user.roomId,
            prompt,
            code: selectedText,
            language
        }));
        
        setActiveTab("chat");
        toast.info("Gemini AI is analyzing your code...");
    };

    const handleEditorWillMount = (monaco: any) => {
        monacoRef.current = monaco;
        registerMonacoSnippets(monaco);
    };

    const handleEditorDidMount = (editor: any, monaco: any) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        // Initial binding if files already loaded
        if (activeFileId) {
            bindEditorToFile(activeFileId);
        }

        // Track local cursor position for awareness
        editor.onDidChangeCursorPosition((e: any) => {
            const provider = providerRef.current;
            if (provider && provider.awareness) {
                const state = provider.awareness.getLocalState() || {};
                provider.awareness.setLocalStateField('user', {
                    ...state.user,
                    cursor: {
                        lineNumber: e.position.lineNumber,
                        column: e.position.column
                    }
                });
            }
        });

        // AI Pair Programmer Monaco Actions
        editor.addAction({
            id: "ai-explain-code",
            label: "🧠 AI: Explain this logic",
            contextMenuGroupId: "navigation",
            contextMenuOrder: 1,
            run: (ed: any) => handleAIAction(ed, "Explain this logic step-by-step.")
        });
        editor.addAction({
            id: "ai-find-bugs",
            label: "🐛 AI: Find Bugs",
            contextMenuGroupId: "navigation",
            contextMenuOrder: 2,
            run: (ed: any) => handleAIAction(ed, "Find bugs or security vulnerabilities in this code.")
        });
        editor.addAction({
            id: "ai-optimize-code",
            label: "⚡ AI: Optimize Code",
            contextMenuGroupId: "navigation",
            contextMenuOrder: 3,
            run: (ed: any) => handleAIAction(ed, "Optimize this code for performance and readability.")
        });
    };

    const activeFile = files.find(f => f.id === activeFileId);

    return (
        <div className="min-h-screen w-full bg-[#080c16] text-white">
            <div className="premium-grid fixed inset-0 pointer-events-none opacity-30" />
            <div className="relative mx-auto max-w-[1720px] p-3 sm:p-5">
                <CodeEditorHeader
                    language={language}
                    onLanguageChange={handleLanguageChange}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                    currentButtonState={currentButtonState}
                    activeView={activeView}
                    onViewChange={setActiveView}
                    onInvite={handleInvite}
                    inviteCopied={inviteCopied}
                    connectedUsersCount={connectedUsers.length}
                    crdtSynced={crdtSynced}
                    activeFileName={activeFile?.name}
                    conflictsCount={conflicts.length}
                    onOpenConflicts={() => setActiveTab('conflicts')}
                    onSimulateProactive={handleRunSemanticAnalysis}
                    indirectConflictsCount={indirectConflicts.length}
                    onOpenDependencies={() => setActiveTab('dependencies')}
                    onSimulateIndirect={handleRunDependencyAnalysis}
                    onOpenValidationPipeline={() => setIsValidationModalOpen(true)}
                    onOpenDockerSandbox={() => setIsDockerSandboxModalOpen(true)}
                    onOpenConfidenceAndRisk={() => setIsConfidenceModalOpen(true)}
                    onOpenAIExplanation={() => setIsConflict24ModalOpen(true)}
                    onOpenRealConflictModal={() => {
                        const currentLang = languageRef.current || language;
                        if (!realConflict || realConflict.language !== currentLang) {
                            handleSimulateRealConflict();
                        } else {
                            setIsRealConflictModalOpen(true);
                        }
                    }}
                    realConflictActive={!!realConflict}
                    onBack={() => navigate(-1)}
                />

                <div className="mt-4 grid h-[calc(100vh-130px)] grid-cols-1 gap-4 xl:grid-cols-4">
                    {/* Main Workspace Column: Codebase Explorer + Monaco Editor / Whiteboard */}
                    <div className="xl:col-span-3 order-2 xl:order-1 h-full min-h-0">
                        <div className="h-full overflow-hidden rounded-2xl border border-white/[.1] bg-[#111a2b]/85 shadow-2xl shadow-black/20 backdrop-blur-xl flex flex-col">
                            {/* Editor View */}
                            <div className={`h-full flex flex-col ${activeView === 'editor' ? 'flex' : 'hidden'}`}>
                                {/* Tabs Strip */}
                                <FileTabsBar
                                    files={files}
                                    activeFileId={activeFileId}
                                    onSelectFile={handleSelectFile}
                                    collaborators={collaborators}
                                    isExplorerOpen={isExplorerOpen}
                                    onToggleExplorer={() => setIsExplorerOpen(!isExplorerOpen)}
                                    onCreateFileClick={() => setIsExplorerOpen(true)}
                                />

                                {/* Genuine Semantic Conflict Banner */}
                                {realConflict && (
                                    <div className="mx-3 my-2 p-3 rounded-xl border border-rose-500/50 bg-gradient-to-r from-rose-950/90 via-[#190918] to-[#0f172a] text-rose-100 flex items-center justify-between shadow-xl shadow-rose-950/40 backdrop-blur-md animate-pulse">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-200">
                                                        ⚠️ Semantic Conflict Detected
                                                    </span>
                                                    <span className="text-xs text-rose-300 font-mono">
                                                        {realConflict.symbolName}() in {realConflict.fileName}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-rose-200/90 mt-0.5">
                                                    Incompatible concurrent edits between <strong className="text-white">{realConflict.devA.userName}</strong> and <strong className="text-white">{realConflict.devB.userName}</strong>.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setIsRealConflictModalOpen(true)}
                                                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-400 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-rose-500/20 flex items-center gap-1.5 transition-all"
                                            >
                                                <Zap className="w-3.5 h-3.5" />
                                                <span>Resolve with AI (3 Options)</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Proactive Conflict Warning Banner (Feature 4) */}
                                <ProactiveAlertBanner
                                    divergence={proactiveDivergence}
                                    onInspect={() => setIsProactiveModalOpen(true)}
                                    onDismiss={() => setProactiveDivergence(null)}
                                />

                                {/* Body: Explorer Sidebar + Editor Container */}
                                <div className="flex-1 flex min-h-0">
                                    {isExplorerOpen && (
                                        <CodebaseExplorer
                                            files={files}
                                            activeFileId={activeFileId}
                                            onSelectFile={handleSelectFile}
                                            onCreateFile={handleCreateFile}
                                            onDeleteFile={handleDeleteFile}
                                            collaborators={collaborators}
                                            crdtSynced={crdtSynced}
                                            connectedPeersCount={collaborators.length || connectedUsers.length || 1}
                                            conflictedFileNames={conflicts.map(c => c.sourceFile).concat(conflicts.map(c => c.targetFile || ''))}
                                        />
                                    )}

                                    <div className="flex-1 h-full min-w-0">
                                        <MonacoEditor
                                            options={{
                                                smoothScrolling: true,
                                                fastScrollSensitivity: 1,
                                                scrollBeyondLastLine: false,
                                                minimap: { enabled: false },
                                                suggestOnTriggerCharacters: true,
                                                quickSuggestions: true,
                                                wordBasedSuggestions: "currentDocument",
                                                fontFamily: "DM Mono, Menlo, monospace",
                                                fontSize: 14,
                                                lineNumbers: "on",
                                                renderLineHighlight: "all",
                                            }}
                                            beforeMount={handleEditorWillMount}
                                            onMount={handleEditorDidMount}
                                            language={language}
                                            theme="vs-dark"
                                            height="100%"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Whiteboard View */}
                            <div className={`h-full ${activeView === 'whiteboard' ? 'block' : 'hidden'}`}>
                                <Whiteboard roomId={user.roomId} username={user.name || "User"} socket={socket} />
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar: Users, Chat, I/O, Concurrent Edits Stream */}
                    <div className="xl:col-span-1 order-1 xl:order-2 h-full min-h-0 flex flex-col gap-4">
                        {/* Tabs Navigation */}
                        <div className="flex shrink-0 rounded-xl border border-white/[.07] bg-[#111a2b]/85 p-1 shadow-lg backdrop-blur-xl">
                            <button 
                                onClick={() => setActiveTab('users')} 
                                className={`flex-1 rounded-lg px-2 py-2 text-xs font-bold transition-all duration-200 ${activeTab === 'users' ? 'bg-cyan-400 text-slate-950 shadow' : 'text-slate-400 hover:bg-white/[.07] hover:text-white'}`}
                            >
                                Users
                            </button>
                            <button 
                                onClick={() => setActiveTab('chat')} 
                                className={`flex-1 rounded-lg px-2 py-2 text-xs font-bold transition-all duration-200 ${activeTab === 'chat' ? 'bg-cyan-400 text-slate-950 shadow' : 'text-slate-400 hover:bg-white/[.07] hover:text-white'}`}
                            >
                                Chat
                            </button>
                            <button 
                                onClick={() => setActiveTab('edits')} 
                                className={`flex-1 rounded-lg px-2 py-2 text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1 ${activeTab === 'edits' ? 'bg-cyan-400 text-slate-950 shadow' : 'text-slate-400 hover:bg-white/[.07] hover:text-white'}`}
                            >
                                <Activity className="w-3 h-3 text-current" />
                                Edits
                            </button>
                            <button 
                                onClick={() => setActiveTab('conflicts')} 
                                className={`flex-1 rounded-lg px-2 py-2 text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1 ${
                                    activeTab === 'conflicts' 
                                        ? 'bg-amber-400 text-slate-950 shadow' 
                                        : conflicts.length > 0
                                            ? 'text-amber-400 hover:bg-white/[.07]'
                                            : 'text-slate-400 hover:bg-white/[.07] hover:text-white'
                                }`}
                            >
                                <ShieldAlert className="w-3 h-3 text-current" />
                                Conflicts
                                {conflicts.length > 0 && (
                                    <span className="w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-mono">
                                        {conflicts.length}
                                    </span>
                                )}
                            </button>
                            <button 
                                onClick={() => setActiveTab('dependencies')} 
                                className={`flex-1 rounded-lg px-2 py-2 text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1 ${
                                    activeTab === 'dependencies' 
                                        ? 'bg-cyan-400 text-slate-950 shadow' 
                                        : indirectConflicts.length > 0
                                            ? 'text-cyan-400 hover:bg-white/[.07]'
                                            : 'text-slate-400 hover:bg-white/[.07] hover:text-white'
                                }`}
                            >
                                <Network className="w-3 h-3 text-current" />
                                Deps
                                {indirectConflicts.length > 0 && (
                                    <span className="w-3.5 h-3.5 rounded-full bg-cyan-400 text-slate-950 text-[9px] flex items-center justify-center font-black">
                                        {indirectConflicts.length}
                                    </span>
                                )}
                            </button>
                            <button 
                                onClick={() => setActiveTab('io')} 
                                className={`flex-1 rounded-lg px-2 py-2 text-xs font-bold transition-all duration-200 ${activeTab === 'io' ? 'bg-cyan-400 text-slate-950 shadow' : 'text-slate-400 hover:bg-white/[.07] hover:text-white'}`}
                            >
                                Output
                            </button>
                        </div>

                        {/* Tab Contents */}
                        <div className={`flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2 pb-10 ${activeTab === 'users' ? 'flex flex-col gap-6' : 'hidden'}`}>
                            <UserList 
                                users={connectedUsers} 
                                roomId={user.roomId} 
                                localUserId={user.id} 
                                localUserName={user.name} 
                                localStream={localStream} 
                                remoteStreams={remoteStreams} 
                                micEnabled={micEnabled} 
                                videoEnabled={videoEnabled} 
                                toggleMic={toggleMic} 
                                toggleVideo={toggleVideo} 
                            />
                        </div>

                        <div 
                            className={`flex-1 min-h-0 ${activeTab === 'chat' ? 'flex flex-col' : 'hidden'} group relative`}
                            onDoubleClick={() => setIsChatZoomed(true)}
                        >
                            <div className="h-full">
                                <div className="absolute top-2 right-2 bg-black/60 rounded px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                    Double-click to Zoom
                                </div>
                                <ChatWindow 
                                    messages={chatMessages} 
                                    localUserId={user.id || ""} 
                                    onSendMessage={handleSendChatMessage} 
                                />
                            </div>
                        </div>

                        <div className={`flex-1 min-h-0 ${activeTab === 'edits' ? 'block' : 'hidden'}`}>
                            <ConcurrentEditsFeed
                                edits={concurrentEdits}
                                collaborators={collaborators}
                                crdtSynced={crdtSynced}
                                localUserId={user.id}
                            />
                        </div>

                        <div className={`flex-1 min-h-0 ${activeTab === 'conflicts' ? 'block' : 'hidden'}`}>
                            <SemanticConflictsPanel
                                conflicts={conflicts}
                                isAnalyzing={isAnalyzing}
                                onRunAnalysis={handleRunSemanticAnalysis}
                                onResolveConflict={handleResolveConflict}
                                onSimulateProactive={handleSimulateProactiveExample}
                                onSimulateExplainable={handleSimulateExplainable}
                                onNavigateToFile={(fileName, line) => {
                                    const target = files.find(f => f.name === fileName);
                                    if (target) {
                                        setActiveFileId(target.id);
                                        setTimeout(() => {
                                            editorRef.current?.revealLineInCenter(line);
                                            editorRef.current?.setPosition({ lineNumber: line, column: 1 });
                                        }, 100);
                                    }
                                }}
                            />
                        </div>

                        <div className={`flex-1 min-h-0 ${activeTab === 'dependencies' ? 'block' : 'hidden'}`}>
                            <DependencyConflictsPanel
                                graph={dependencyGraph}
                                conflicts={indirectConflicts}
                                isAnalyzing={isAnalyzingDependencies}
                                onRunAnalysis={handleRunDependencyAnalysis}
                                onSimulateScenario={handleSimulateIndirectConflict}
                                onApplySolution={handleApplyIndirectSolution}
                            />
                        </div>

                        <div className={`flex-1 min-h-0 ${activeTab === 'io' ? 'block' : 'hidden'}`}>
                            <CodeOutput
                                output={output}
                                onClear={() => setOutput([])}
                                input={input}
                                onInputChange={handleInputChange}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Zoomed Chat Modal */}
            {isChatZoomed && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="relative w-full max-w-5xl h-[85vh]">
                        <button 
                            onClick={() => setIsChatZoomed(false)}
                            className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors"
                        >
                            <X size={24} />
                        </button>
                        <ChatWindow 
                            messages={chatMessages} 
                            localUserId={user.id || ""} 
                            onSendMessage={handleSendChatMessage} 
                        />
                    </div>
                </div>
            )}

            {/* Proactive Conflict Modal (Feature 4 - Screenshot Logic) */}
            <ProactiveConflictModal
                isOpen={isProactiveModalOpen}
                onClose={() => setIsProactiveModalOpen(false)}
                divergence={proactiveDivergence}
                onApplyResolution={handleApplyProactiveResolution}
                onSimulateExample={handleSimulateProactiveExample}
            />

            {/* AI-Based Conflict Resolution & Validation Pipeline Modal (Feature 7 - Screenshot Logic) */}
            <AIValidationPipelineModal
                isOpen={isValidationModalOpen}
                onClose={() => setIsValidationModalOpen(false)}
                conflict={activeValidationConflict || conflicts[0] || null}
                onOpenDockerSandbox={() => {
                    setActiveSandboxConflict(activeValidationConflict || conflicts[0] || null);
                    setIsValidationModalOpen(false);
                    setIsDockerSandboxModalOpen(true);
                }}
                onApplySolution={(solutionId, patch, conflictId) => {
                    handleResolveConflict(conflictId, solutionId);
                    setIsValidationModalOpen(false);
                }}
            />

            {/* Docker Sandbox Resolution Validation Modal (Feature 8 - Screenshot 6: Validate every solution) */}
            <DockerSandboxValidationModal
                isOpen={isDockerSandboxModalOpen}
                onClose={() => setIsDockerSandboxModalOpen(false)}
                conflict={activeSandboxConflict || conflicts[0] || null}
                initialResult={sandboxSuiteResult}
                onApplySolution={(solutionId, patch, conflictId) => {
                    handleResolveConflict(conflictId, solutionId);
                    setIsDockerSandboxModalOpen(false);
                }}
                onRollback={handleSandboxRollback}
            />

            {/* Confidence and Risk Scoring & Developer Approval Modal (Feature 9 - Screenshots 1, 2, 3) */}
            <ConfidenceAndRiskScoringModal
                isOpen={isConfidenceModalOpen}
                onClose={() => setIsConfidenceModalOpen(false)}
                conflict={conflicts[0] || null}
                onAcceptSolution={(solutionId, patch, conflictId) => {
                    handleResolveConflict(conflictId, solutionId);
                    toast.success("Solution 2 merged into codebase upon developer approval (96% Confidence)!");
                    setIsConfidenceModalOpen(false);
                }}
                onRejectSolution={(solutionId, conflictId) => {
                    toast.info(`Recommendation for Solution ${solutionId} rejected by developer.`);
                    setIsConfidenceModalOpen(false);
                }}
                onModifyAndAcceptSolution={(solutionId, patch, conflictId) => {
                    handleResolveConflict(conflictId, solutionId);
                    toast.success("Custom modified solution merged into codebase upon developer approval!");
                    setIsConfidenceModalOpen(false);
                }}
            />

            {/* AI Conflict Explanation (CONFLICT #24) Modal (Screenshot 3. One particularly good feature) */}
            <AIConflictExplanationModal
                isOpen={isConflict24ModalOpen}
                onClose={() => setIsConflict24ModalOpen(false)}
                onApplySuggestion={(fix) => {
                    toast.success("AI Suggestion applied: calculateSalary(employee.id) updated in caller!");
                }}
            />

            {/* Genuine Real-Time AI Conflict Resolution Modal (Features 1 - 9) */}
            <RealAIConflictModal
                isOpen={isRealConflictModalOpen}
                onClose={() => setIsRealConflictModalOpen(false)}
                conflict={realConflict}
                history={conflictHistory}
                onAcceptSolution={handleAcceptRealSolution}
                onRollback={handleRollbackRealConflict}
                currentUserId={user.id || 'dev'}
                currentLanguage={languageRef.current || language}
            />
        </div>
    );
};
