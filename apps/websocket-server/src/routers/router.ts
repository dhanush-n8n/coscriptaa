/**
 * WEBSOCKET EVENT ROUTER
 * 
 * This module acts as the switchboard for all incoming WebSocket messages.
 * Instead of handling the logic locally (which would break in a multi-server setup),
 * it takes incoming events (like chat, whiteboard, WebRTC signaling) and publishes 
 * them to the Redis Pub/Sub channel for the specific room.
 * 
 * This ensures that regardless of which server instance a user is connected to,
 * their actions are broadcasted to everyone else in the room.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

export type MessageTypes =
    | "requestToGetUsers"
    | "requestForAllData"
    | "code"
    | "input"
    | "language"
    | "submitBtnStatus"
    | "users"
    | "allData"
    | "cursorPosition"
    | "webrtc_offer"
    | "webrtc_answer"
    | "webrtc_ice_candidate"
    | "chat_message"
    | "whiteboard_stroke"
    | "whiteboard_clear"
    | "whiteboard_cursor"
    | "ask_ai"
    | "trigger_semantic_analysis"
    | "semantic_conflicts_updated"
    | "resolve_semantic_conflict"
    | "proactive_edit_activity"
    | "proactive_conflict_prediction"

interface MessageHandler {
    ( data: any, context: { userId: string | null, roomId: string, rooms: any, publisherClient: any }): void;
}

const requestRouter: Record<string, MessageHandler> = {
    requestToGetUsers: async ( data, { userId, roomId, rooms, publisherClient }) => {
        const allUsersRaw = await publisherClient.hGetAll(`room:${roomId}:users`);
        const allUsers = Object.keys(allUsersRaw).map(id => ({ id, name: allUsersRaw[id] }));

        publisherClient.publish(roomId, JSON.stringify({
            type: "broadcast",
            excludeUserId: null,
            data: { type: "users", users: allUsers }
        }));
    },
    
    requestForAllData: ( data, { userId, roomId, rooms, publisherClient }) => {
        const otherUser = rooms[roomId]?.find((user: any) => user.userId !== userId);
        if (otherUser) {
            publisherClient.publish(roomId, JSON.stringify({
                type: "direct",
                targetUserId: otherUser.userId,
                data: { type: "requestForAllData", userId: userId }
            }));
        }
    },

    code: (data, { userId, roomId, rooms, publisherClient }) => {
        publisherClient.publish(roomId, JSON.stringify({
            type: "broadcast", excludeUserId: userId, data: { type: "code", code: data.code }
        }));
    },

    input: ( data, { userId, roomId, rooms, publisherClient }) => {
        publisherClient.publish(roomId, JSON.stringify({
            type: "broadcast", excludeUserId: userId, data: { type: "input", input: data.input }
        }));
    },

    language: (data, { userId, roomId, rooms, publisherClient }) => {
        publisherClient.publish(roomId, JSON.stringify({
            type: "broadcast", excludeUserId: userId, data: { type: "language", language: data.language }
        }));
    },

    submitBtnStatus: (data, { userId, roomId, rooms, publisherClient }) => {
        publisherClient.publish(roomId, JSON.stringify({
            type: "broadcast", excludeUserId: userId, data: {
                type: "submitBtnStatus",
                value: data.value,
                isLoading: data.isLoading,
            }
        }));
    },

    users: ( data, { userId, roomId, rooms, publisherClient }) => {
        publisherClient.publish(roomId, JSON.stringify({
            type: "broadcast", excludeUserId: userId, data: { type: "users", users: data.users }
        }));
    },

    allData: ( data, { userId, roomId, rooms, publisherClient }) => {
        publisherClient.publish(roomId, JSON.stringify({
            type: "direct", targetUserId: data.userId, data: {
                type: "allData",
                code: data.code,
                input: data.input,
                language: data.language,
                currentButtonState: data.currentButtonState,
                isLoading: data.isLoading,
            }
        }));
    },

    cursorPosition: ( data, { userId, roomId, rooms, publisherClient }) => {
        publisherClient.publish(roomId, JSON.stringify({
            type: "broadcast", excludeUserId: userId, data: {
                type: "cursorPosition",
                cursorPosition: data.cursorPosition,
                userId: userId,
            }
        }));
    },

    webrtc_offer: (data, { userId, roomId, rooms, publisherClient }) => {
        publisherClient.publish(roomId, JSON.stringify({
            type: "direct", targetUserId: data.targetUserId, data: {
                type: "webrtc_offer",
                offer: data.offer,
                senderId: userId
            }
        }));
    },

    webrtc_answer: (data, { userId, roomId, rooms, publisherClient }) => {
        publisherClient.publish(roomId, JSON.stringify({
            type: "direct", targetUserId: data.targetUserId, data: {
                type: "webrtc_answer",
                answer: data.answer,
                senderId: userId
            }
        }));
    },

    webrtc_ice_candidate: (data, { userId, roomId, rooms, publisherClient }) => {
        // [TESTING] Log the ICE candidate to see the IP exchange in the terminal
        console.log(`[WebRTC] ICE Candidate (IP Exchange) from ${userId} to ${data.targetUserId}:`, data.candidate?.candidate);

        publisherClient.publish(roomId, JSON.stringify({
            type: "direct", targetUserId: data.targetUserId, data: {
                type: "webrtc_ice_candidate",
                candidate: data.candidate,
                senderId: userId
            }
        }));
    },

    chat_message: (data, { userId, roomId, rooms, publisherClient }) => {
        publisherClient.publish(roomId, JSON.stringify({
            type: "broadcast", excludeUserId: userId, data: {
                type: "chat_message",
                text: data.text,
                imageUrl: data.imageUrl,
                senderId: userId,
                senderName: data.senderName,
                timestamp: data.timestamp
            }
        }));
    },

    whiteboard_stroke: (data, { userId, roomId, rooms, publisherClient }) => {
        publisherClient.publish(roomId, JSON.stringify({
            type: "broadcast", excludeUserId: userId, data: {
                type: "whiteboard_stroke",
                stroke: data.stroke
            }
        }));
    },

    whiteboard_clear: (data, { userId, roomId, rooms, publisherClient }) => {
        publisherClient.publish(roomId, JSON.stringify({
            type: "broadcast", excludeUserId: userId, data: {
                type: "whiteboard_clear"
            }
        }));
    },

    whiteboard_cursor: (data, { userId, roomId, rooms, publisherClient }) => {
        publisherClient.publish(roomId, JSON.stringify({
            type: "broadcast", excludeUserId: userId, data: {
                type: "whiteboard_cursor",
                x: data.x,
                y: data.y,
                username: data.username
            }
        }));
    },

    ask_ai: async (data, { userId, roomId, rooms, publisherClient }) => {
        if (!genAI) {
            publisherClient.publish(roomId, JSON.stringify({
                type: "broadcast", excludeUserId: "ai-assistant", data: {
                    type: "chat_ai_error",
                    messageId: data.messageId,
                    error: "System Error: GEMINI_API_KEY is not configured on the WebSocket server."
                }
            }));
            return;
        }

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const prompt = `You are a legendary, expert Senior Software Engineer and AI Pair Programmer. 
Respond to the following request precisely, concisely, and with accurate markdown code snippets.

User Request: ${data.prompt}

Context (Highlighted Code snippet):
\`\`\`${data.language || 'javascript'}
${data.code}
\`\`\`
`;
            const result = await model.generateContentStream(prompt);

            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                publisherClient.publish(roomId, JSON.stringify({
                    type: "broadcast", excludeUserId: "ai-assistant", data: {
                        type: "chat_ai_chunk",
                        messageId: data.messageId,
                        text: chunkText,
                        senderId: "ai-assistant",
                        senderName: "Gemini AI",
                        timestamp: Date.now()
                    }
                }));
            }
        } catch (error: any) {
            console.error("AI Error:", error);
            publisherClient.publish(roomId, JSON.stringify({
                type: "broadcast", excludeUserId: "ai-assistant", data: {
                    type: "chat_ai_error",
                    messageId: data.messageId,
                    error: "Failed to generate AI response: " + error.message
                }
            }));
        }
    },

    trigger_semantic_analysis: (data, { userId, roomId, publisherClient }) => {
        publisherClient.publish(roomId, JSON.stringify({
            type: "broadcast",
            excludeUserId: null,
            data: {
                type: "trigger_semantic_analysis",
                requestedBy: userId,
                timestamp: Date.now()
            }
        }));
    },

    semantic_conflicts_updated: (data, { roomId, publisherClient }) => {
        publisherClient.publish(roomId, JSON.stringify({
            type: "broadcast",
            excludeUserId: null,
            data: {
                type: "semantic_conflicts_updated",
                conflicts: data.conflicts,
                count: data.count,
                timestamp: Date.now()
            }
        }));
    },

    resolve_semantic_conflict: (data, { userId, roomId, publisherClient }) => {
        publisherClient.publish(roomId, JSON.stringify({
            type: "broadcast",
            excludeUserId: null,
            data: {
                type: "resolve_semantic_conflict",
                conflictId: data.conflictId,
                resolvedBy: userId,
                timestamp: Date.now()
            }
        }));
    },

    proactive_edit_activity: (data, { userId, roomId, publisherClient }) => {
        publisherClient.publish(roomId, JSON.stringify({
            type: "broadcast",
            excludeUserId: userId,
            data: {
                type: "proactive_edit_activity",
                senderId: userId,
                developerName: data.developerName,
                file: data.file,
                code: data.code,
                timestamp: Date.now()
            }
        }));
    },

    proactive_conflict_prediction: (data, { roomId, publisherClient }) => {
        publisherClient.publish(roomId, JSON.stringify({
            type: "broadcast",
            excludeUserId: null,
            data: {
                type: "proactive_conflict_prediction",
                ...data,
                timestamp: Date.now()
            }
        }));
    },

    dependency_analysis_updated: (data, { roomId, publisherClient }) => {
        publisherClient.publish(roomId, JSON.stringify({
            type: "broadcast",
            excludeUserId: null,
            data: {
                type: "dependency_analysis_updated",
                ...data,
                timestamp: Date.now()
            }
        }));
    },

    indirect_solution_applied: (data, { roomId, publisherClient }) => {
        publisherClient.publish(roomId, JSON.stringify({
            type: "broadcast",
            excludeUserId: null,
            data: {
                type: "indirect_solution_applied",
                ...data,
                timestamp: Date.now()
            }
        }));
    },

    ai_validation_run_completed: (data, { roomId, publisherClient }) => {
        publisherClient.publish(roomId, JSON.stringify({
            type: "broadcast",
            excludeUserId: null,
            data: {
                type: "ai_validation_run_completed",
                ...data,
                timestamp: Date.now()
            }
        }));
    },
};

export default requestRouter