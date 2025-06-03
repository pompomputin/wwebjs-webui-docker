// src/stores/sessionStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { 
    initSessionApi, 
    getSessionsApi, 
    removeSessionApi, 
    setOnlinePresenceSettingApi,
    setTypingIndicatorSettingApi,
    setAutoSendSeenSettingApi
} from '../services/api';
import { getSocket } from '../services/socket';

export const useSessionStore = defineStore('sessions', () => {
    const sessions = ref({});
    const currentSelectedSessionId = ref(null);
    const globalStatusMessage = ref('Manage your sessions.');
    const isLoadingSessions = ref(false);
    const isProcessingSession = ref(null);
    const quickSendRecipientId = ref(null);

    const sessionFeatureToggles = ref({
        isTypingIndicatorEnabled: false,
        autoSendSeenEnabled: false,
        maintainOnlinePresenceEnabled: false,
    });

    const sessionList = computed(() => {
        console.log("sessionStore: Recomputing sessionList. Current raw sessions data:", JSON.parse(JSON.stringify(sessions.value)));
        return Object.entries(sessions.value).map(([id, data]) => {
            const qrCodeValue = data.qrCode || null;
            const qrCodeIsPresent = !!qrCodeValue && qrCodeValue.length > 0;
            const effectiveHasQr = data.hasQr || qrCodeIsPresent || false;

            let derivedStatusMessage = data.statusMessage;
            if (!derivedStatusMessage) {
                if (data.isReady) { derivedStatusMessage = 'Client Ready!'; }
                else if (qrCodeIsPresent) { derivedStatusMessage = 'QR. Scan.'; }
                else if (effectiveHasQr) { derivedStatusMessage = 'Waiting QR...'; }
                else { derivedStatusMessage = 'Initializing...'; }
            }
            return {
                sessionId: id,
                isReady: data.isReady || false,
                hasQr: effectiveHasQr,
                qrCode: (data.isReady || (!data.hasQr && !qrCodeIsPresent && !existingClientSession.qrCode)) ? null : qrCodeValue, // Corrected 's.isReady' to 'data.isReady' and 'existingClientSession' to 'data'
                statusMessage: derivedStatusMessage,
                settings: data.settings || {}
            };
        });
    });

    const selectedSessionData = computed(() => {
        const data = currentSelectedSessionId.value ? sessions.value[currentSelectedSessionId.value] : null;
        if (data && data.settings) {
            sessionFeatureToggles.value = { ...data.settings };
        }
        return data;
    });
    const selectedSessionQrCode = computed(() => selectedSessionData.value?.qrCode || null);

    function handleQrCodeEvent(data) {
        if (data.sessionId && data.qr) {
            updateSessionQr(data.sessionId, data.qr);
        } else {
            console.error('Socket RX [qr_code]: Received invalid data', data);
            
            if (data.sessionId && sessions.value[data.sessionId]) {
                sessions.value[data.sessionId] = {
                    ...sessions.value[data.sessionId],
                    hasQr: true,
                    statusMessage: 'Waiting for QR code...'
                };
            }
        }
    }

    function initializeSocketListeners() {
        console.log("SessionStore: Initializing Socket.IO listeners...");
        const socket = getSocket();
        
        if (!socket) {
            console.error("Cannot initialize socket listeners: No socket available");
            return;
        }

        socket.on('qr_code', handleQrCodeEvent);

        socket.on('session_ready', (payload) => {
            const { sessionId } = payload;
            console.log(`SessionStore: Socket 'session_ready' event received for ${sessionId}`);
            setSessionReady(sessionId);
        });

        socket.on('session_authenticated', (payload) => {
            const { sessionId } = payload;
            console.log(`SessionStore: Socket 'session_authenticated' event received for ${sessionId}`);
            setSessionAuthenticated(sessionId);
        });

        socket.on('session_disconnected', (payload) => {
            const { sessionId, reason } = payload;
            console.log(`SessionStore: Socket 'session_disconnected' event received for ${sessionId}. Reason: ${reason}`);
            setSessionDisconnected(sessionId, reason);
        });

        socket.on('session_auth_failure', (payload) => {
            const { sessionId, message } = payload;
            console.log(`SessionStore: Socket 'session_auth_failure' event received for ${sessionId}. Message: ${message}`);
            setSessionAuthFailure(sessionId, message);
        });

        socket.on('session_removed', (payload) => {
            const { sessionId } = payload;
            console.log(`SessionStore: Socket 'session_removed' event received for ${sessionId}`);
            handleSessionRemoved(sessionId);
        });

        socket.on('session_init_error', (payload) => {
            const { sessionId, error } = payload;
            console.log(`SessionStore: Socket 'session_init_error' event received for ${sessionId}. Error: ${error}`);
            setSessionInitError(sessionId, error);
        });
        
        socket.on('status_update', (data) => {
            if (data.sessionId && data.message) {
                if (sessions.value[data.sessionId]) {
                    sessions.value[data.sessionId].statusMessage = data.message;
                    // NEW: Update settings if included in status_update
                    if (data.settings) {
                        sessions.value[data.sessionId].settings = { ...data.settings };
                        // If this is the currently selected session, update the reactive toggles
                        if (data.sessionId === currentSelectedSessionId.value) {
                            sessionFeatureToggles.value = { ...data.settings };
                        }
                    }
                }
                else if(data.message.toLowerCase().includes("initialization started") || 
                        data.message.toLowerCase().includes("qr code received")) {
                    fetchSessions();
                }
                
                if(data.sessionId && data.qr !== undefined) {
                    if(data.qr) updateSessionQr(data.sessionId, data.qr);
                }
            }
            if (!data.sessionId && data.message) {
                updateGlobalStatus(data.message);
            }
        });
    }

    async function fetchSessions() {
        isLoadingSessions.value = true; globalStatusMessage.value = 'Fetching sessions...';
        try {
            const response = await getSessionsApi();
            if (response.success && response.sessions) {
                const newSessionsState = {};
                response.sessions.forEach(s => {
                    const existingClientSession = sessions.value[s.sessionId] || {};
                    const qrCodeValue = existingClientSession.qrCode || s.qrCode || null;
                    const qrCodeIsPresent = !!qrCodeValue && qrCodeValue.length > 0;
                    const effectiveHasQr = s.hasQr || qrCodeIsPresent || existingClientSession.hasQr || false;

                    newSessionsState[s.sessionId] = {
                        ...existingClientSession,
                        isReady: s.isReady,
                        hasQr: effectiveHasQr,
                        qrCode: (s.isReady || (!s.hasQr && !qrCodeIsPresent && !existingClientSession.qrCode)) ? null : qrCodeValue,
                        statusMessage: s.isReady ? 'Client Ready!' : (effectiveHasQr ? (qrCodeValue ? 'QR. Scan.' : 'Needs QR Scan') : (s.statusMessage || 'Initializing...')),
                        settings: s.settings || {}
                    };
                });
                sessions.value = newSessionsState;
                globalStatusMessage.value = 'Sessions loaded.';
            } else { globalStatusMessage.value = `Error fetching sessions: ${response.error || 'Unknown error'}`; }
        } catch (error) {
            globalStatusMessage.value = `Network error fetching sessions: ${error.message}`;
            console.error("Network error in fetchSessions:", error);
        } finally { isLoadingSessions.value = false; }
    }

    async function addNewSession(sessionId) {
        if (!sessionId) {
            globalStatusMessage.value = 'Session ID cannot be empty.';
            return Promise.reject(new Error('Session ID cannot be empty.'));
        }
        const isExistingSession = !!sessions.value[sessionId];
        isProcessingSession.value = sessionId;
        globalStatusMessage.value = isExistingSession ? `Re-initializing '${sessionId}'...` : `Initializing '${sessionId}'...`;

        sessions.value[sessionId] = {
            ...(sessions.value[sessionId] || { sessionId: sessionId }),
            isReady: false, hasQr: false, qrCode: null,
            statusMessage: isExistingSession ? 'Re-initializing (API)...' : 'Initializing (API)...',
            settings: sessions.value[sessionId]?.settings || {} // NEW: Retain or initialize settings
        };

        try {
            const response = await initSessionApi(sessionId);
            if (sessions.value[sessionId]) { 
                if (response.success) {
                    globalStatusMessage.value = response.message || `Initialization for '${sessionId}' started.`;
                    
                    if (response.qr) {
                        updateSessionQr(sessionId, response.qr);
                        globalStatusMessage.value = `QR received for '${sessionId}'. Scan.`;
                    } else {
                        sessions.value[sessionId] = {
                            ...sessions.value[sessionId],
                            hasQr: true,
                            statusMessage: 'Waiting QR...',
                            isReady: false
                        };
                        
                        const socket = getSocket();
                        if (socket && socket.connected) {
                            socket.emit('request_init_session', sessionId);
                            console.log(`Auto-requesting QR code for new session: ${sessionId}`);
                        }
                    }
                } else {
                    globalStatusMessage.value = `Error initializing '${sessionId}': ${response.error}`;
                    sessions.value[sessionId] = { 
                        ...sessions.value[sessionId], 
                        statusMessage: `Init Error: ${response.error || ''}`, 
                        hasQr: false, 
                        qrCode: null 
                    };
                    return Promise.reject(new Error(response.error || 'Failed to initialize session'));
                }
            } else { console.warn(`Session ${sessionId} was removed before init API call completed.`); }
        } catch (error) {
            console.error(`Network error during init for '${sessionId}':`, error);
            globalStatusMessage.value = `Network error during init for '${sessionId}': ${error.message}`;
            if (sessions.value[sessionId]) {
                sessions.value[sessionId] = { 
                    ...sessions.value[sessionId], 
                    statusMessage: 'Network Error during Init.', 
                    hasQr: false, 
                    qrCode: null 
                };
            }
            return Promise.reject(error);
        } finally { 
            if (isProcessingSession.value === sessionId) { 
                isProcessingSession.value = null; 
            } 
        }
    }

    function updateSessionQr(sessionId, qr) {
        console.log(`SessionStore: SOCKET updateSessionQr for ${sessionId}. QR value received: ${!!qr}`);
        const currentData = sessions.value[sessionId] || { sessionId: sessionId };
        const qrValue = qr && qr.length > 0 ? qr : null;
        const updatedSession = {
            ...currentData,
            qrCode: qrValue,
            isReady: false,
            hasQr: qrValue ? true : currentData.hasQr
        };
        if (qrValue) {
            updatedSession.statusMessage = 'QR. Scan.';
        } else if (updatedSession.hasQr) {
            updatedSession.statusMessage = 'Waiting QR...';
        } else {
            updatedSession.statusMessage = 'Initializing...';
        }

        const newSessionsState = { ...sessions.value };
        newSessionsState[sessionId] = updatedSession;
        sessions.value = newSessionsState;
        console.log("Session data after QR update in store (from socket):", JSON.parse(JSON.stringify(sessions.value[sessionId])));
    }

    function setSessionAuthenticated(sessionId) {
        if (sessions.value[sessionId]) {
            sessions.value[sessionId] = { ...sessions.value[sessionId], qrCode: null, hasQr: true, isReady: false, statusMessage: 'Authenticated! Waiting for client to be ready...' };
        }
    }
    function setSessionReady(sessionId) {
        if (sessions.value[sessionId]) {
            sessions.value[sessionId] = { ...sessions.value[sessionId], isReady: true, qrCode: null, hasQr: false, statusMessage: 'Client Ready!' };
        }
    }
    function setSessionAuthFailure(sessionId, message) {
        if (sessions.value[sessionId]) {
            sessions.value[sessionId] = { ...sessions.value[sessionId], isReady: false, qrCode: null, hasQr: false, statusMessage: `Auth Fail: ${message}` };
        }
    }
    function handleSessionRemoved(sessionId) {
        const newSessions = { ...sessions.value }; delete newSessions[sessionId]; sessions.value = newSessions;
        if (currentSelectedSessionId.value === sessionId) { currentSelectedSessionId.value = null; globalStatusMessage.value = `Session ${sessionId} removed.`; quickSendRecipientId.value = null; sessionFeatureToggles.value = { isTypingIndicatorEnabled: false, autoSendSeenEnabled: false, maintainOnlinePresenceEnabled: false }; }
    }
    function setSessionDisconnected(sessionId, reason) {
        if (sessions.value[sessionId]) { sessions.value[sessionId] = { ...sessions.value[sessionId], isReady: false, statusMessage: `Disconnected: ${reason}` }; }
    }
    function setSessionInitError(sessionId, errorMsg) {
        if (sessions.value[sessionId]) { sessions.value[sessionId] = { ...sessions.value[sessionId], isReady: false, hasQr: false, qrCode: null, statusMessage: `Init Err: ${errorMsg}` }; }
        else { sessions.value[sessionId] = { sessionId: sessionId, isReady: false, hasQr: false, qrCode: null, statusMessage: `Init Err: ${errorMsg}` }; }
    }
    function selectSession(sessionId) {
        if (sessionId === null || sessions.value[sessionId]) { 
            currentSelectedSessionId.value = sessionId; 
            globalStatusMessage.value = sessionId ? `Selected: ${sessionId}` : 'No session selected.'; 
            quickSendRecipientId.value = null; 
            // NEW: Initialize sessionFeatureToggles from the selected session's settings
            sessionFeatureToggles.value = { 
                isTypingIndicatorEnabled: sessions.value[sessionId]?.settings?.isTypingIndicatorEnabled || false,
                autoSendSeenEnabled: sessions.value[sessionId]?.settings?.autoSendSeenEnabled || false,
                maintainOnlinePresenceEnabled: sessions.value[sessionId]?.settings?.maintainOnlinePresenceEnabled || false,
            };
        }
        else { currentSelectedSessionId.value = null; globalStatusMessage.value = 'Session not found for selection.'; quickSendRecipientId.value = null; sessionFeatureToggles.value = { isTypingIndicatorEnabled: false, autoSendSeenEnabled: false, maintainOnlinePresenceEnabled: false }; }
    }
    async function removeSession(sessionId) {
        if (!sessions.value[sessionId]) return; globalStatusMessage.value = `Removing '${sessionId}'...`; isProcessingSession.value = sessionId;
        try { const response = await removeSessionApi(sessionId); if (response.success) { globalStatusMessage.value = response.message || `Session '${sessionId}' removal initiated.`; } else { globalStatusMessage.value = `Error removing '${sessionId}': ${response.error}`; }
        } catch (error) { globalStatusMessage.value = `Network error removing '${sessionId}': ${error.message}`; console.error(`Network error in removeSession for ${sessionId}:`, error);
        } finally { if (isProcessingSession.value === sessionId) { isProcessingSession.value = null; } }
    }
    function setQuickSendRecipient(recipientId) { quickSendRecipientId.value = recipientId; }
    
    // MODIFIED: toggleTypingIndicator to make API call
    async function toggleTypingIndicator(enabled) {
        if (!currentSelectedSessionId.value) return { success: false, error: 'No session selected.' };
        const result = await setTypingIndicatorSettingApi(currentSelectedSessionId.value, enabled);
        if (result.success) {
            sessionFeatureToggles.value.isTypingIndicatorEnabled = enabled; // Update local state on success
            if (sessions.value[currentSelectedSessionId.value]) { // Update in-memory backend state representation
                sessions.value[currentSelectedSessionId.value].settings.isTypingIndicatorEnabled = enabled;
            }
        }
        return result;
    }

    // MODIFIED: toggleAutoSendSeen to make API call
    async function toggleAutoSendSeen(enabled) {
        if (!currentSelectedSessionId.value) return { success: false, error: 'No session selected.' };
        const result = await setAutoSendSeenSettingApi(currentSelectedSessionId.value, enabled);
        if (result.success) {
            sessionFeatureToggles.value.autoSendSeenEnabled = enabled; // Update local state on success
            if (sessions.value[currentSelectedSessionId.value]) { // Update in-memory backend state representation
                sessions.value[currentSelectedSessionId.value].settings.autoSendSeenEnabled = enabled;
            }
        }
        return result;
    }
    
    // MODIFIED: toggleMaintainOnlinePresence to use setOnlinePresenceSettingApi and return result
    async function toggleMaintainOnlinePresence(enabled) {
        const shouldBeEnabled = typeof enabled === 'boolean' ? enabled : !sessionFeatureToggles.value.maintainOnlinePresenceEnabled;
        let result = { success: false, error: 'Operation not performed.' };

        if (!currentSelectedSessionId.value) return { success: false, error: 'No session selected.' };
        if (!selectedSessionData.value?.isReady) return { success: false, error: 'Session not ready.' };

        try {
            result = await setOnlinePresenceSettingApi(currentSelectedSessionId.value, shouldBeEnabled);
            if (result.success) { 
                sessionFeatureToggles.value.maintainOnlinePresenceEnabled = shouldBeEnabled; // Update local state on success
                if (sessions.value[currentSelectedSessionId.value]) { // Update in-memory backend state representation
                    sessions.value[currentSelectedSessionId.value].settings.maintainOnlinePresenceEnabled = shouldBeEnabled;
                }
                globalStatusMessage.value = `Session ${currentSelectedSessionId.value} online presence set to ${shouldBeEnabled ? 'enabled' : 'disabled'}.`; 
            } else { 
                globalStatusMessage.value = `Error setting presence for ${currentSelectedSessionId.value}: ${result.error}`; 
            }
        } catch (error) {
            globalStatusMessage.value = `Network error setting presence for ${currentSelectedSessionId.value}: ${error.message}`; 
            result = { success: false, error: error.message }; // Ensure result object is returned
        }
        return result;
    }
    function updateGlobalStatus(message) { globalStatusMessage.value = message; }

    initializeSocketListeners();

    return {
        sessions, currentSelectedSessionId, globalStatusMessage, isLoadingSessions, isProcessingSession, quickSendRecipientId,
        sessionFeatureToggles, sessionList, selectedSessionData, selectedSessionQrCode,
        fetchSessions, addNewSession, selectSession, removeSession, setQuickSendRecipient,
        toggleTypingIndicator, toggleAutoSendSeen, toggleMaintainOnlinePresence,
        updateSessionQr, setSessionAuthenticated, setSessionReady, setSessionAuthFailure,
        handleSessionRemoved, setSessionDisconnected, setSessionInitError, updateGlobalStatus,
        initializeSocketListeners // EXPOSED: initializeSocketListeners
    };
});