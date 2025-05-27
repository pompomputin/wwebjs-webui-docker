// src/services/socket.js
import { io } from 'socket.io-client';
import { useSessionStore } from '../stores/sessionStore';
import { useChatStore } from '../stores/chatStore'; // <-- IMPORT CHAT STORE

const BASE_URL = 'http://43.134.142.240:3000'; // <--- !!! SET THIS
let socket = null;

export function initializeSocket() {
    if (socket) return socket;
    socket = io(BASE_URL, { transports: ['websocket'] });

    const sessionStore = useSessionStore(); // Get store instance
    const chatStore = useChatStore();       // Get chat store instance

    socket.on('connect', () => {
        console.log('Socket.IO connected:', socket.id);
        sessionStore.updateGlobalStatus('Socket connected.');
        if (sessionStore.currentSelectedSessionId) {
            socket.emit('join_session_room', sessionStore.currentSelectedSessionId);
        }
    });
    // ... (other socket event handlers like disconnect, connect_error, session events remain the same) ...
    socket.on('disconnect', (reason) => { console.log('Socket.IO disconnected:', reason); sessionStore.updateGlobalStatus(`Socket disconnected: ${reason}`); });
    socket.on('connect_error', (error) => { console.error('Socket.IO conn error:', error); sessionStore.updateGlobalStatus(`Socket conn error: ${error.message}`); });
    socket.on('qr_code', (data) => { sessionStore.updateSessionQr(data.sessionId, data.qr); });
    socket.on('authenticated', (data) => { sessionStore.setSessionAuthenticated(data.sessionId); });
    socket.on('ready', (data) => { sessionStore.setSessionReady(data.sessionId); });
    socket.on('auth_failure', (data) => { sessionStore.setSessionAuthFailure(data.sessionId, data.message); });
    socket.on('init_error', (data) => { sessionStore.setSessionInitError(data.sessionId, data.error);});
    socket.on('session_removed', (data) => { sessionStore.handleSessionRemoved(data.sessionId); chatStore.clearChatDataForSession(data.sessionId); }); // Also clear chat data
    socket.on('disconnected', (data) => { if(data && data.sessionId) sessionStore.setSessionDisconnected(data.sessionId, data.reason); }); // For wweb.js client disconnect
    socket.on('status_update', (data) => { /* ... (existing status_update logic) ... */
        if (data.sessionId && data.message) {
            const session = sessionStore.sessions[data.sessionId];
            if (session) session.statusMessage = data.message;
            else if(data.message.toLowerCase().includes("initialization started") || data.message.toLowerCase().includes("qr code received")) sessionStore.fetchSessions();
            if(data.sessionId && data.qr !== undefined && sessionStore.currentSelectedSessionId === data.sessionId) {
                if(data.qr) sessionStore.updateSessionQr(data.sessionId, data.qr);
            }
        }
        if (!data.sessionId && data.message) sessionStore.updateGlobalStatus(data.message);
    });


    // --- UPDATED Message Related Events ---
    socket.on('new_message', (eventData) => { // { sessionId, message: {from, to, body, timestamp, id, author, ...} }
        console.log('Socket RX new_message for session:', eventData.sessionId, 'Chat:', eventData.message.fromMe ? eventData.message.to : eventData.message.from, 'Msg:', eventData.message.body);
        const chatId = eventData.message.fromMe ? eventData.message.to : eventData.message.from;
        // Ensure author is set, especially for group messages not from oneself
        const messagePayload = {
            ...eventData.message,
            author: eventData.message.author || (eventData.message.isGroupMsg && !eventData.message.fromMe ? eventData.message.from : undefined)
        };
        chatStore.addMessageToChat(eventData.sessionId, chatId, messagePayload);
    });

    socket.on('message_sent', (eventData) => { // { sessionId, to, body, id, timestamp }
        console.log('Socket RX message_sent for session:', eventData.sessionId, 'To:', eventData.to, 'Msg:', eventData.body);
        const messagePayload = { // Construct a message object similar to what 'new_message' provides
            id: eventData.id,
            body: eventData.body,
            timestamp: eventData.timestamp,
            from: sessionStore.selectedSessionData?.id?.user || 'me', // Approximating sender 'me'
            to: eventData.to,
            fromMe: true,
            author: undefined, // Not usually present for self-sent messages this way
            type: 'chat', // Assume chat, could be media if we extend this
            // Add other fields if available and needed from eventData
        };
        chatStore.addMessageToChat(eventData.sessionId, eventData.to, messagePayload);
    });

    // You'll also want to handle media_sent, location_sent if you want them in the log
    socket.on('media_sent', (eventData) => { // { sessionId, to, type, filename, caption }
        console.log('Socket RX media_sent:', eventData);
        const messagePayload = {
            id: `media-${Date.now()}`, // Placeholder ID
            body: `[Media: ${eventData.type}] ${eventData.caption || eventData.filename || ''}`,
            timestamp: Math.floor(Date.now() / 1000),
            from: sessionStore.selectedSessionData?.id?.user || 'me',
            to: eventData.to,
            fromMe: true,
            type: eventData.type,
            hasMedia: true,
            // You might want to store the actual media URL or a placeholder if you plan to display it
        };
        chatStore.addMessageToChat(eventData.sessionId, eventData.to, messagePayload);
    });

    socket.on('location_sent', (eventData) => { // { sessionId, to, latitude, longitude, description }
        console.log('Socket RX location_sent:', eventData);
        const messagePayload = {
            id: `loc-${Date.now()}`,
            body: `[Location: ${eventData.latitude}, ${eventData.longitude}] ${eventData.description || ''}`,
            timestamp: Math.floor(Date.now() / 1000),
            from: sessionStore.selectedSessionData?.id?.user || 'me',
            to: eventData.to,
            fromMe: true,
            type: 'location',
        };
        chatStore.addMessageToChat(eventData.sessionId, eventData.to, messagePayload);
    });

    socket.on('bulk_send_complete', (data) => { 
        console.log('Socket RX bulk_send_complete:', data);
        // This event is primarily for updating the UI in BulkSendPanel.vue
        // If you want to log something globally or in message logs, handle here.
        // For now, BulkSendPanel handles its own results log.
    });


    return socket;
}

export function getSocket() { /* ... (same as before) ... */ if (!socket) { console.warn("Socket not initialized correctly."); } return socket; }
export function connectSocket() { /* ... (same as before) ... */ if (socket && !socket.connected) socket.connect(); }
