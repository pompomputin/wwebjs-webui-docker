// vue-frontend/vue-whatsapp-frontend/src/services/socket.js
import { io } from 'socket.io-client';
import { useSessionStore } from '../stores/sessionStore';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '@/stores/authStore';

// This line is CRUCIAL.
// VITE_API_BASE_URL should be empty in the Docker production build,
// so SOCKET_URL will become window.location.origin (e.g., "http://128.199.122.218:3000")
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || window.location.origin;

let socket = null;

export function initializeSocket() {
    if (socket && socket.connected) {
        return socket;
    }

    const authStore = useAuthStore();
    const token = authStore.token || localStorage.getItem('authToken');

    if (!token) {
        console.log('Socket.IO: No auth token found, connection deferred.');
        if (socket) {
             socket.disconnect();
             socket = null;
        }
        return null;
    }

    // Disconnect existing socket if trying to reinitialize with potentially new URL or auth
    if (socket) {
        socket.disconnect();
    }
    
    console.log(`Attempting Socket.IO connection to: ${SOCKET_URL}`); // For debugging
    socket = io(SOCKET_URL, { // Ensure SOCKET_URL is used here
        transports: ['websocket'],
        // If your Socket.IO server is namespaced with a path, e.g., /custompath/socket.io
        // you might need to add: path: "/custompath/socket.io/",
        auth: {
            token: token
        },
        autoConnect: true, // socket.io client will attempt to connect automatically
    });

    const sessionStore = useSessionStore();
    const chatStore = useChatStore();

    socket.on('connect', () => {
        console.log('Socket.IO connected with auth:', socket.id, 'to', socket.io.uri);
        sessionStore.updateGlobalStatus('Socket connected.');
        if (sessionStore.currentSelectedSessionId) {
            socket.emit('join_session_room', sessionStore.currentSelectedSessionId);
        }
    });

    socket.on('disconnect', (reason) => {
        console.log('Socket.IO disconnected:', reason);
        sessionStore.updateGlobalStatus(`Socket disconnected: ${reason}`);
        // Optional: if (reason === 'io server disconnect') { authStore.logout(); }
    });

    socket.on('connect_error', (error) => {
        console.error('Socket.IO conn error:', error.message, 'URI:', socket.io.uri);
        sessionStore.updateGlobalStatus(`Socket conn error: ${error.message}`);
        if (error.message.includes('Authentication error') || (error.message && error.message.includes('websocket error'))) {
             // Consider a brief delay then attempt to re-initialize or prompt user
             // For now, just log. Persistent errors might require logout or manual refresh.
             console.error('Authentication or WebSocket error detected. Token might be invalid or network issue.');
        }
    });

    // ALL YOUR OTHER socket.on() EVENT HANDLERS MUST BE HERE
    // (qr_code, authenticated, ready, auth_failure, new_message, etc.)
    // For example:
    socket.on('qr_code', (data) => { sessionStore.updateSessionQr(data.sessionId, data.qr); });
    socket.on('authenticated', (data) => { sessionStore.setSessionAuthenticated(data.sessionId); });
    socket.on('ready', (data) => { sessionStore.setSessionReady(data.sessionId); });
    socket.on('auth_failure', (data) => { sessionStore.setSessionAuthFailure(data.sessionId, data.message); });
    socket.on('init_error', (data) => { sessionStore.setSessionInitError(data.sessionId, data.error);});
    socket.on('session_removed', (data) => { sessionStore.handleSessionRemoved(data.sessionId); chatStore.clearChatDataForSession(data.sessionId); });
    // Ensure 'disconnected' (client-side) and 'session_disconnected' (server-emitted) are handled if they are different
    socket.on('disconnected_session', (data) => { // Assuming server emits 'disconnected_session'
        if(data && data.sessionId) sessionStore.setSessionDisconnected(data.sessionId, data.reason); 
    });
    socket.on('status_update', (data) => {
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
    socket.on('new_message', (eventData) => {
        const chatId = eventData.message.fromMe ? eventData.message.to : eventData.message.from;
        const messagePayload = { ...eventData.message, author: eventData.message.author || (eventData.message.isGroupMsg && !eventData.message.fromMe ? eventData.message.from : undefined) };
        chatStore.addMessageToChat(eventData.sessionId, chatId, messagePayload);
    });
    socket.on('message_sent', (eventData) => {
        const messagePayload = { id: eventData.id, body: eventData.body, timestamp: eventData.timestamp, from: sessionStore.selectedSessionData?.id?.user || 'me', to: eventData.to, fromMe: true, author: undefined, type: 'chat' };
        chatStore.addMessageToChat(eventData.sessionId, eventData.to, messagePayload);
    });
    socket.on('media_sent', (eventData) => {
        const messagePayload = { id: `media-${Date.now()}`, body: `[Media: ${eventData.type}] ${eventData.caption || eventData.filename || ''}`, timestamp: Math.floor(Date.now() / 1000), from: sessionStore.selectedSessionData?.id?.user || 'me', to: eventData.to, fromMe: true, type: eventData.type, hasMedia: true };
        chatStore.addMessageToChat(eventData.sessionId, eventData.to, messagePayload);
    });
    socket.on('location_sent', (eventData) => {
        const messagePayload = { id: `loc-${Date.now()}`, body: `[Location: ${eventData.latitude}, ${eventData.longitude}] ${eventData.description || ''}`, timestamp: Math.floor(Date.now() / 1000), from: sessionStore.selectedSessionData?.id?.user || 'me', to: eventData.to, fromMe: true, type: 'location' };
        chatStore.addMessageToChat(eventData.sessionId, eventData.to, messagePayload);
    });
    socket.on('bulk_send_complete', (data) => { console.log('Socket RX bulk_send_complete:', data); });


    return socket;
}

export function getSocket() {
    if (!socket) {
        const authToken = localStorage.getItem('authToken');
        if (authToken) {
            return initializeSocket();
        }
        // else: No token, so initializeSocket() would return null anyway.
    }
    return socket;
}

export function connectSocket() {
    if (socket && !socket.connected) {
        const authToken = localStorage.getItem('authToken');
        if (authToken) {
            socket.io.opts.auth = { token: authToken };
            // socket.io.uri = SOCKET_URL; // Update URI in case it could change
            // socket.io.opts.path = "/socket.io"; // Ensure path is consistent if used
            socket.connect();
        } else {
            console.warn("Cannot connect socket: No auth token available.");
        }
    } else if (!socket) {
        initializeSocket(); // This will attempt connection if token exists
    }
}

export function disconnectSocket() {
    if (socket && socket.connected) {
        socket.disconnect();
        console.log('Socket.IO disconnected by disconnectSocket()');
    }
    // Do not nullify the socket here, so connectSocket() can reuse it.
    // If you want a completely fresh one next time, you could set socket = null;
    // but then getSocket()/connectSocket() logic needs to ensure re-initialization.
}
