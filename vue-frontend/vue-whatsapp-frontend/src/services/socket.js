// vue-frontend/vue-whatsapp-frontend/src/services/socket.js
import { io } from 'socket.io-client';
import { useSessionStore } from '../stores/sessionStore';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { ref } from 'vue'; // Import ref for reactivity

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || window.location.origin;

let socket = null;
const socketConnected = ref(false); // Reactive ref for connection status

export function initializeSocket() {
    if (socket && socket.connected) {
        socketConnected.value = true; // Ensure status is updated if already connected
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
        socketConnected.value = false; // Ensure status is false if no token
        return null;
    }

    if (socket) {
        socket.disconnect();
    }
    
    console.log(`Attempting Socket.IO connection to: ${SOCKET_URL}`);
    socket = io(SOCKET_URL, {
        transports: ['websocket'],
        auth: {
            token: token
        },
        autoConnect: true,
    });

    const sessionStore = useSessionStore();
    const chatStore = useChatStore();

    socket.on('connect', () => {
        console.log('Socket.IO connected with auth:', socket.id, 'to', socket.io.uri, 'at', new Date().toLocaleTimeString());
        socketConnected.value = true; // Update reactive status
        sessionStore.updateGlobalStatus('Socket connected.');
        if (sessionStore.currentSelectedSessionId) {
            socket.emit('join_session_room', sessionStore.currentSelectedSessionId);
        }
    });

    socket.on('disconnect', (reason) => {
        console.log('Socket.IO disconnected:', reason);
        socketConnected.value = false; // Update reactive status
        sessionStore.updateGlobalStatus(`Socket disconnected: ${reason}`);
    });

    socket.on('connect_error', (error) => {
        console.error('Socket.IO conn error:', error.message, 'URI:', socket.io.uri);
        socketConnected.value = false; // Update reactive status
        sessionStore.updateGlobalStatus(`Socket conn error: ${error.message}`);
        if (error.message.includes('Authentication error') || (error.message && error.message.includes('websocket error'))) {
             console.error('Authentication or WebSocket error detected. Token might be invalid or network issue.');
        }
    });

    socket.on('qr_code', (data) => {
        console.log('Socket RX [qr_code] event for session:', data.sessionId, 'QR data:', data.qr ? data.qr.substring(0, 30) + '...' : 'NULL');
        try {
            const sessionStore = useSessionStore();
            sessionStore.handleQrCodeEvent(data);
            if (data.qr && data.sessionId && window.openQrModalForSession) {
                window.openQrModalForSession(data.sessionId);
            }
        } catch (error) {
            console.error('Error handling QR code:', error);
        }
    });
    
    socket.on('session_ready', (payload) => {
        const { sessionId } = payload;
        console.log(`SessionStore: Socket 'session_ready' event received for ${sessionId}`);
        sessionStore.setSessionReady(sessionId);
    });

    socket.on('session_authenticated', (payload) => {
        const { sessionId } = payload;
        console.log(`SessionStore: Socket 'session_authenticated' event received for ${sessionId}`);
        sessionStore.setSessionAuthenticated(sessionId);
    });

    socket.on('session_disconnected', (payload) => {
        const { sessionId, reason } = payload;
        console.log(`SessionStore: Socket 'session_disconnected' event received for ${sessionId}. Reason: ${reason}`);
        sessionStore.setSessionDisconnected(sessionId, reason);
    });

    socket.on('session_auth_failure', (payload) => {
        const { sessionId, message } = payload;
        console.log(`SessionStore: Socket 'session_auth_failure' event received for ${sessionId}. Message: ${message}`);
        sessionStore.setSessionAuthFailure(sessionId, message);
    });

    socket.on('session_removed', (payload) => {
        const { sessionId } = payload;
        console.log(`SessionStore: Socket 'session_removed' event received for ${sessionId}`);
        sessionStore.handleSessionRemoved(sessionId);
        chatStore.clearChatDataForSession(sessionId);
    });

    socket.on('session_init_error', (payload) => {
        const { sessionId, error } = payload;
        console.log(`SessionStore: Socket 'session_init_error' event received for ${sessionId}. Error: ${error}`);
        sessionStore.setSessionInitError(sessionId, error);
    });
    
    socket.on('status_update', (data) => {
        if (data.sessionId && data.message) {
            if (sessionStore.sessions[data.sessionId]) {
                sessionStore.sessions[data.sessionId].statusMessage = data.message;
            }
            else if(data.message.toLowerCase().includes("initialization started") || 
                    data.message.toLowerCase().includes("qr code received")) {
                sessionStore.fetchSessions();
            }
            
            if(data.sessionId && data.qr !== undefined) {
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
    
    socket.on('bulk_send_complete', (data) => { 
        console.log('Socket RX bulk_send_complete:', data); 
    });

    return socket;
}

export function getSocket() {
    if (!socket) {
        const authToken = localStorage.getItem('authToken');
        if (authToken) {
            return initializeSocket();
        }
    }
    return socket;
}

export function connectSocket() {
    if (socket && !socket.connected) {
        const authToken = localStorage.getItem('authToken');
        if (authToken) {
            socket.io.opts.auth = { token: authToken };
            socket.connect();
        } else {
            console.warn("Cannot connect socket: No auth token available.");
        }
    } else if (!socket) {
        initializeSocket();
    }
}

export function disconnectSocket() { // This function is EXPORTED
    if (socket && socket.connected) {
        socket.disconnect();
        console.log('Socket.IO disconnected by disconnectSocket()');
    }
}

export const isSocketConnected = socketConnected; // Export the reactive ref