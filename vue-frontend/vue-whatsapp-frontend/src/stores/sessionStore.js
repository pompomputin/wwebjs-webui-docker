// src/stores/sessionStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { initSessionApi, getSessionsApi, removeSessionApi, setPresenceOnlineApi } from '../services/api';

export const useSessionStore = defineStore('sessions', () => {
    const sessions = ref({}); 
    const currentSelectedSessionId = ref(null);
    const globalStatusMessage = ref('Manage your sessions.');
    const isLoadingSessions = ref(false);
    const quickSendRecipientId = ref(null);

    // NEW: Toggle states for the currently selected session
    const sessionFeatureToggles = ref({
        isTypingIndicatorEnabled: false,
        autoSendSeenEnabled: false,
        maintainOnlinePresenceEnabled: false,
    });

    const sessionList = computed(() => Object.entries(sessions.value).map(([id, data]) => ({ sessionId: id, isReady: data.isReady || false, hasQr: data.hasQr || !!data.qrCode, qrCode: data.qrCode || null, statusMessage: data.statusMessage || (data.isReady ? 'Ready' : (data.hasQr || data.qrCode ? 'Needs QR Scan' : 'Initializing...')) })));
    const selectedSessionData = computed(() => currentSelectedSessionId.value ? sessions.value[currentSelectedSessionId.value] : null);
    const selectedSessionQrCode = computed(() => selectedSessionData.value?.qrCode || null);

    async function fetchSessions() { 
        isLoadingSessions.value = true; globalStatusMessage.value = 'Fetching sessions...';
        const response = await getSessionsApi();
        if (response.success && response.sessions) {
            const newSessionsState = {};
            response.sessions.forEach(s => {
                newSessionsState[s.sessionId] = {
                    ...(sessions.value[s.sessionId] || {}), 
                    isReady: s.isReady,
                    hasQrFromBackend: s.hasQr, 
                    statusMessage: sessions.value[s.sessionId]?.statusMessage || (s.isReady ? 'Ready' : (s.hasQr ? 'Needs QR Scan' : 'Initializing...'))
                };
            });
            sessions.value = newSessionsState; globalStatusMessage.value = 'Sessions loaded.';
        } else { globalStatusMessage.value = `Error fetching: ${response.error || 'Unknown'}`; }
        isLoadingSessions.value = false;
    }
    async function addNewSession(sessionId) { 
        if (!sessionId || sessions.value[sessionId]) { globalStatusMessage.value = `ID empty or '${sessionId}' exists.`; return; }
        globalStatusMessage.value = `Initializing '${sessionId}'...`;
        sessions.value[sessionId] = { isReady: false, hasQr: true, qrCode: null, statusMessage: 'Init...' }; 
        const response = await initSessionApi(sessionId);
        if (response.success) { globalStatusMessage.value = response.message || `Init for '${sessionId}' started.`; if (response.qr) updateSessionQr(sessionId, response.qr); } 
        else { globalStatusMessage.value = `Error init '${sessionId}': ${response.error}`; delete sessions.value[sessionId]; }
    }
    
    function selectSession(sessionId) { 
        if (sessions.value[sessionId]) { 
            currentSelectedSessionId.value = sessionId; 
            globalStatusMessage.value = `Selected: ${sessionId}`; 
            quickSendRecipientId.value = null;
            // Reset toggles when session changes
            sessionFeatureToggles.value = {
                isTypingIndicatorEnabled: false,
                autoSendSeenEnabled: false,
                maintainOnlinePresenceEnabled: false,
            };
        } else { 
            currentSelectedSessionId.value = null; 
            globalStatusMessage.value = 'Session not found.'; 
            quickSendRecipientId.value = null; 
            sessionFeatureToggles.value = { isTypingIndicatorEnabled: false, autoSendSeenEnabled: false, maintainOnlinePresenceEnabled: false };
        }
    }
    async function removeSession(sessionId) { 
        if (!sessions.value[sessionId]) return; 
        globalStatusMessage.value = `Removing '${sessionId}'...`; 
        const response = await removeSessionApi(sessionId); 
        if (response.success) { globalStatusMessage.value = response.message || `Session '${sessionId}' removal initiated.`; } 
        else { globalStatusMessage.value = `Error removing '${sessionId}': ${response.error}`;}}
    
    function setQuickSendRecipient(recipientId) { quickSendRecipientId.value = recipientId; }

    function toggleTypingIndicator(enabled) {
        sessionFeatureToggles.value.isTypingIndicatorEnabled = typeof enabled === 'boolean' ? enabled : !sessionFeatureToggles.value.isTypingIndicatorEnabled;
    }
    function toggleAutoSendSeen(enabled) {
        sessionFeatureToggles.value.autoSendSeenEnabled = typeof enabled === 'boolean' ? enabled : !sessionFeatureToggles.value.autoSendSeenEnabled;
    }
    async function toggleMaintainOnlinePresence(enabled) {
        const shouldBeEnabled = typeof enabled === 'boolean' ? enabled : !sessionFeatureToggles.value.maintainOnlinePresenceEnabled;
        sessionFeatureToggles.value.maintainOnlinePresenceEnabled = shouldBeEnabled;
        if (shouldBeEnabled && currentSelectedSessionId.value && selectedSessionData.value?.isReady) {
            globalStatusMessage.value = `Setting ${currentSelectedSessionId.value} to online...`;
            const result = await setPresenceOnlineApi(currentSelectedSessionId.value);
            if (result.success) {
                globalStatusMessage.value = `Session ${currentSelectedSessionId.value} presence set to online.`;
            } else {
                globalStatusMessage.value = `Error setting presence for ${currentSelectedSessionId.value}: ${result.error}`;
                sessionFeatureToggles.value.maintainOnlinePresenceEnabled = false; 
            }
        } else if (!shouldBeEnabled && currentSelectedSessionId.value) { // Only log if a session was selected
            globalStatusMessage.value = `Online presence maintenance disabled for ${currentSelectedSessionId.value}.`;
        }
    }

    function updateSessionQr(sessionId, qr) { const s=sessions.value[sessionId]||{}; sessions.value[sessionId]={...s,qrCode:qr,isReady:false,hasQr:true,statusMessage:'QR. Scan.'};}
    function setSessionAuthenticated(sessionId) { const s=sessions.value[sessionId]; if(s) {s.qrCode=null;s.hasQr=false;s.statusMessage='Authenticated! Wait ready...';}}
    function setSessionReady(sessionId) { const s=sessions.value[sessionId]; if(s) {s.isReady=true;s.qrCode=null;s.hasQr=false;s.statusMessage='Client Ready!';}}
    function setSessionAuthFailure(sessionId, message) { const s=sessions.value[sessionId]; if(s) {s.isReady=false;s.qrCode=null;s.hasQr=false;s.statusMessage=`Auth Fail: ${message}`}}
    function handleSessionRemoved(sessionId) { delete sessions.value[sessionId]; if(currentSelectedSessionId.value===sessionId){currentSelectedSessionId.value=null;globalStatusMessage.value=`Sess ${sessionId} removed.`; quickSendRecipientId.value = null; sessionFeatureToggles.value = {isTypingIndicatorEnabled: false, autoSendSeenEnabled: false, maintainOnlinePresenceEnabled: false};}}
    function setSessionDisconnected(sessionId, reason) { const s=sessions.value[sessionId]; if(s){s.isReady=false;s.statusMessage=`Disconnected: ${reason}`;}}
    function setSessionInitError(sessionId, errorMsg) { const s=sessions.value[sessionId]; if(s)s.statusMessage=`Init Err: ${errorMsg}`; else console.error(`Init err for unknown sess ${sessionId}: ${errorMsg}`);}
    function updateGlobalStatus(message){ globalStatusMessage.value = message; }

    return {
        sessions, currentSelectedSessionId, globalStatusMessage, isLoadingSessions,
        quickSendRecipientId, 
        sessionFeatureToggles, 
        sessionList, selectedSessionData, selectedSessionQrCode,
        fetchSessions, addNewSession, selectSession, removeSession,
        setQuickSendRecipient, 
        toggleTypingIndicator, toggleAutoSendSeen, toggleMaintainOnlinePresence, 
        updateSessionQr, setSessionAuthenticated, setSessionReady, setSessionAuthFailure,
        handleSessionRemoved, setSessionDisconnected, setSessionInitError, updateGlobalStatus
    };
});
