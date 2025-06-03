// src/stores/sessionStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { initSessionApi, getSessionsApi, removeSessionApi, setPresenceOnlineApi } from '../services/api';
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
            // Ensure qrCode is always a string or null
            const qrCodeValue = data.qrCode || null;
            const qrCodeIsPresent = !!qrCodeValue && qrCodeValue.length > 0;
            const effectiveHasQr = data.hasQr || qrCodeIsPresent; // hasQr indicates expectation, qrCodeIsPresent indicates actual data

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
                hasQr: effectiveHasQr, // Reflects if QR is expected or present
                qrCode: qrCodeValue,   // Holds the actual QR string
                statusMessage: derivedStatusMessage
            };
        });
    });

    const selectedSessionData = computed(() => currentSelectedSessionId.value ? sessions.value[currentSelectedSessionId.value] : null);
    const selectedSessionQrCode = computed(() => selectedSessionData.value?.qrCode || null);

    // --- Function to handle QR code events from socket.js ---
    function handleQrCodeEvent(data) {
        if (data.sessionId && data.qr) {
            updateSessionQr(data.sessionId, data.qr);
        } else {
            console.error('Socket RX [qr_code]: Received invalid data', data);
            
            // If we have sessionId but no QR, mark as waiting for QR
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

        // CORRECT EVENT NAME: 'qr_code' not 'qrCode'
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
        
        // Also listen for status updates with QR codes
        socket.on('status_update', (data) => {
            if (data.sessionId && data.message) {
                if (sessions.value[data.sessionId]) {
                    sessions.value[data.sessionId].statusMessage = data.message;
                }
                else if(data.message.toLowerCase().includes("initialization started") || 
                        data.message.toLowerCase().includes("qr code received")) {
                    fetchSessions();
                }
                
                // If the status update includes a QR code, update it
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
                    // When fetching, prioritize current QR if available, otherwise backend's
                    const qrCodeValue = existingClientSession.qrCode || s.qrCode || null; // <--- Keep existing QR if present
                    const qrCodeIsPresent = !!qrCodeValue && qrCodeValue.length > 0;
                    const effectiveHasQr = s.hasQr || qrCodeIsPresent || existingClientSession.hasQr || false;

                    newSessionsState[s.sessionId] = {
                        ...existingClientSession, // Keep any client-side specific ephemeral data
                        isReady: s.isReady,
                        hasQr: effectiveHasQr,
                        qrCode: (s.isReady || (!s.hasQr && !qrCodeIsPresent && !existingClientSession.qrCode)) ? null : qrCodeValue, // Clear QR if ready or no QR expected/present
                        statusMessage: s.isReady ? 'Client Ready!' : (effectiveHasQr ? (qrCodeValue ? 'QR. Scan.' : 'Needs QR Scan') : (s.statusMessage || 'Initializing...'))
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

        // Initialize session in store with basic status
        sessions.value[sessionId] = {
            ...(sessions.value[sessionId] || { sessionId: sessionId }),
            isReady: false, hasQr: false, qrCode: null, // Reset QR state when initializing
            statusMessage: isExistingSession ? 'Re-initializing (API)...' : 'Initializing (API)...'
        };

        try {
            const response = await initSessionApi(sessionId);
            if (sessions.value[sessionId]) { // Check if session still exists after API call
                if (response.success) {
                    globalStatusMessage.value = response.message || `Initialization for '${sessionId}' started.`;
                    
                    // If QR is received directly from API response (less common for QR, more for status)
                    if (response.qr) {
                        updateSessionQr(sessionId, response.qr); // Use updateSessionQr to set the QR
                        globalStatusMessage.value = `QR received for '${sessionId}'. Scan.`;
                    } else {
                        // Assume hasQr is true if init was successful and no QR was given yet
                        sessions.value[sessionId] = {
                            ...sessions.value[sessionId],
                            hasQr: true, // Expecting QR
                            statusMessage: 'Waiting QR...',
                            isReady: false
                        };
                        
                        // Request QR code via socket after initialization
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
        // Ensure qrCode is null if qr is empty/falsey, otherwise use the qr string
        const qrValue = qr && qr.length > 0 ? qr : null;
        const updatedSession = {
            ...currentData,
            qrCode: qrValue,
            isReady: false, // QR means not ready yet
            hasQr: qrValue ? true : currentData.hasQr // Keep hasQr true if we had it before
        };
        // Set status message based on QR presence
        if (qrValue) {
            updatedSession.statusMessage = 'QR. Scan.';
        } else if (updatedSession.hasQr) {
            updatedSession.statusMessage = 'Waiting QR...';
        } else {
            updatedSession.statusMessage = 'Initializing...'; // Fallback if no QR and no hasQr
        }

        const newSessionsState = { ...sessions.value };
        newSessionsState[sessionId] = updatedSession;
        sessions.value = newSessionsState; // Force update by replacing the whole object
        console.log("Session data after QR update in store (from socket):", JSON.parse(JSON.stringify(sessions.value[sessionId])));
    }

    // Rest of your methods...
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
        if (currentSelectedSessionId.value === sessionId) { /* reset dependent state */ currentSelectedSessionId.value = null; globalStatusMessage.value = `Session ${sessionId} removed.`; quickSendRecipientId.value = null; sessionFeatureToggles.value = { isTypingIndicatorEnabled: false, autoSendSeenEnabled: false, maintainOnlinePresenceEnabled: false }; }
    }
    function setSessionDisconnected(sessionId, reason) {
        if (sessions.value[sessionId]) { sessions.value[sessionId] = { ...sessions.value[sessionId], isReady: false, statusMessage: `Disconnected: ${reason}` }; }
    }
    function setSessionInitError(sessionId, errorMsg) {
        if (sessions.value[sessionId]) { sessions.value[sessionId] = { ...sessions.value[sessionId], isReady: false, hasQr: false, qrCode: null, statusMessage: `Init Err: ${errorMsg}` }; }
        else { sessions.value[sessionId] = { sessionId: sessionId, isReady: false, hasQr: false, qrCode: null, statusMessage: `Init Err: ${errorMsg}` }; }
    }
    function selectSession(sessionId) {
        if (sessionId === null || sessions.value[sessionId]) { currentSelectedSessionId.value = sessionId; globalStatusMessage.value = sessionId ? `Selected: ${sessionId}` : 'No session selected.'; quickSendRecipientId.value = null; sessionFeatureToggles.value = { isTypingIndicatorEnabled: false, autoSendSeenEnabled: false, maintainOnlinePresenceEnabled: false, }; }
        else { currentSelectedSessionId.value = null; globalStatusMessage.value = 'Session not found for selection.'; quickSendRecipientId.value = null; sessionFeatureToggles.value = { isTypingIndicatorEnabled: false, autoSendSeenEnabled: false, maintainOnlinePresenceEnabled: false }; }
    }
    async function removeSession(sessionId) {
        if (!sessions.value[sessionId]) return; globalStatusMessage.value = `Removing '${sessionId}'...`; isProcessingSession.value = sessionId;
        try { const response = await removeSessionApi(sessionId); if (response.success) { globalStatusMessage.value = response.message || `Session '${sessionId}' removal initiated.`; } else { globalStatusMessage.value = `Error removing '${sessionId}': ${response.error}`; }
        } catch (error) { globalStatusMessage.value = `Network error removing '${sessionId}': ${error.message}`; console.error(`Network error in removeSession for ${sessionId}:`, error);
        } finally { if (isProcessingSession.value === sessionId) { isProcessingSession.value = null; } }
    }
    function setQuickSendRecipient(recipientId) { quickSendRecipientId.value = recipientId; }
    function toggleTypingIndicator(enabled) { sessionFeatureToggles.value.isTypingIndicatorEnabled = typeof enabled === 'boolean' ? enabled : !sessionFeatureToggles.value.isTypingIndicatorEnabled; }
    function toggleAutoSendSeen(enabled) { sessionFeatureToggles.value.autoSendSeenEnabled = typeof enabled === 'boolean' ? enabled : !sessionFeatureToggles.value.autoSendSeenEnabled; }
    async function toggleMaintainOnlinePresence(enabled) {
        const shouldBeEnabled = typeof enabled === 'boolean' ? enabled : !sessionFeatureToggles.value.maintainOnlinePresenceEnabled;
        if (shouldBeEnabled && currentSelectedSessionId.value && selectedSessionData.value?.isReady) {
            sessionFeatureToggles.value.maintainOnlinePresenceEnabled = true; globalStatusMessage.value = `Setting ${currentSelectedSessionId.value} to online...`;
            const result = await setPresenceOnlineApi(currentSelectedSessionId.value);
            if (result.success) { globalStatusMessage.value = `Session ${currentSelectedSessionId.value} presence set to online.`; }
            else { globalStatusMessage.value = `Error setting presence for ${currentSelectedSessionId.value}: ${result.error}`; sessionFeatureToggles.value.maintainOnlinePresenceEnabled = false; }
        } else if (!shouldBeEnabled && currentSelectedSessionId.value) { sessionFeatureToggles.value.maintainOnlinePresenceEnabled = false; globalStatusMessage.value = `Online presence maintenance disabled for ${currentSelectedSessionId.value}.`;
        } else if (shouldBeEnabled && (!currentSelectedSessionId.value || !selectedSessionData.value?.isReady)) { globalStatusMessage.value = `Cannot enable online presence: No session selected or session not ready.`; }
    }
    function updateGlobalStatus(message) { globalStatusMessage.value = message; }

    // Initialize socket listeners when the store is created
    initializeSocketListeners();

    return {
        sessions, currentSelectedSessionId, globalStatusMessage, isLoadingSessions, isProcessingSession, quickSendRecipientId,
        sessionFeatureToggles, sessionList, selectedSessionData, selectedSessionQrCode,
        fetchSessions, addNewSession, selectSession, removeSession, setQuickSendRecipient,
        toggleTypingIndicator, toggleAutoSendSeen, toggleMaintainOnlinePresence,
        updateSessionQr, setSessionAuthenticated, setSessionReady, setSessionAuthFailure,
        handleSessionRemoved, setSessionDisconnected, setSessionInitError, updateGlobalStatus,
        initializeSocketListeners, handleQrCodeEvent
    };
});