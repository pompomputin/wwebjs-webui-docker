// src/stores/chatStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useSessionStore } from './sessionStore'; // To know the current session
import { getChatsApi } from '../services/api'; // To fetch initial chats

export const useChatStore = defineStore('chat', () => {
    const sessionStore = useSessionStore();

    // State: Chats for the current session
    // Structure: { sessionId: [ {id, name, unreadCount, lastMessage, isGroup}, ... ], ... }
    const chatsBySession = ref({});

    // State: Messages for the selected chat of the current session
    // Structure: { sessionId: { chatId: [ {id, body, from, to, fromMe, timestamp, type, author}, ... ], ... }, ... }
    const messagesBySessionAndChat = ref({});

    const selectedChatId = ref(null); // For the currently viewed chat
    const isLoadingChats = ref(false);
    const isLoadingMessages = ref(false); // For fetching historical messages if implemented

    // --- Getters ---
    const currentSessionChats = computed(() => {
        if (sessionStore.currentSelectedSessionId) {
            return chatsBySession.value[sessionStore.currentSelectedSessionId] || [];
        }
        return [];
    });

    const selectedChatMessages = computed(() => {
        if (sessionStore.currentSelectedSessionId && selectedChatId.value) {
            const sessionMessages = messagesBySessionAndChat.value[sessionStore.currentSelectedSessionId];
            return sessionMessages ? (sessionMessages[selectedChatId.value] || []) : [];
        }
        return [];
    });

    // --- Actions ---
    async function fetchChatsForCurrentSession() {
        if (!sessionStore.currentSelectedSessionId) {
            console.warn('No session selected, cannot fetch chats.');
            return;
        }
        if (!sessionStore.selectedSessionData?.isReady) {
            console.warn(`Session ${sessionStore.currentSelectedSessionId} not ready, cannot fetch chats.`);
            if (chatsBySession.value[sessionStore.currentSelectedSessionId]) { // Clear old chats if session not ready
                chatsBySession.value[sessionStore.currentSelectedSessionId] = [];
            }
            return;
        }

        isLoadingChats.value = true;
        const sessionId = sessionStore.currentSelectedSessionId;
        const response = await getChatsApi(sessionId);

        if (response.success && response.chats) {
            // Sort chats by timestamp (most recent first)
            const sortedChats = response.chats.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            chatsBySession.value[sessionId] = sortedChats;

            // Initialize message arrays for these chats if not already present
            if (!messagesBySessionAndChat.value[sessionId]) {
                messagesBySessionAndChat.value[sessionId] = {};
            }
            sortedChats.forEach(chat => {
                if (!messagesBySessionAndChat.value[sessionId][chat.id]) {
                    messagesBySessionAndChat.value[sessionId][chat.id] = [];
                }
                // If chat has a lastMessage, add it to its message list (if not already there)
                // This helps populate the log initially for the selected chat.
                if (chat.lastMessage) {
                    const chatMessages = messagesBySessionAndChat.value[sessionId][chat.id];
                    const existingMsg = chatMessages.find(m => m.id === chat.lastMessage.id?._serialized || m.id === chat.lastMessage.id); // wweb.js msg id can be complex
                    if (!existingMsg) {
                        // Normalize lastMessage to match our message structure from socket
                        const normalizedLastMsg = {
                            ...chat.lastMessage,
                            id: chat.lastMessage.id?._serialized || chat.lastMessage.id, // Ensure ID is consistent
                            author: chat.lastMessage.author || (chat.isGroup ? chat.lastMessage.from : undefined)
                        };
                        chatMessages.push(normalizedLastMsg);
                        // Sort messages by timestamp (oldest first for display)
                        chatMessages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                    }
                }
            });

        } else {
            console.error('Error fetching chats:', response.error);
            chatsBySession.value[sessionId] = []; // Clear on error
        }
        isLoadingChats.value = false;
    }

    function addMessageToChat(sessionId, chatId, message) {
        if (!messagesBySessionAndChat.value[sessionId]) {
            messagesBySessionAndChat.value[sessionId] = {};
        }
        if (!messagesBySessionAndChat.value[sessionId][chatId]) {
            messagesBySessionAndChat.value[sessionId][chatId] = [];
        }

        // Avoid duplicates if message already exists (e.g. from fetchChats lastMessage)
        const existingMsg = messagesBySessionAndChat.value[sessionId][chatId].find(m => m.id === message.id);
        if (!existingMsg) {
            messagesBySessionAndChat.value[sessionId][chatId].push(message);
             // Sort messages by timestamp (oldest first for display)
            messagesBySessionAndChat.value[sessionId][chatId].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

        }


        // Update last message in the chats list for UI reactivity
        if (chatsBySession.value[sessionId]) {
            const chatIndex = chatsBySession.value[sessionId].findIndex(c => c.id === chatId);
            if (chatIndex > -1) {
                chatsBySession.value[sessionId][chatIndex].lastMessage = { ...message }; // Update with new message
                chatsBySession.value[sessionId][chatIndex].timestamp = message.timestamp; // Update chat timestamp
                // Re-sort chats list to bring this chat to the top
                chatsBySession.value[sessionId].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            }
        }
    }

    function setSelectedChatId(chatId) {
        selectedChatId.value = chatId;
        // If we implement fetching historical messages, this would be the place to trigger it
        // e.g., fetchHistoricalMessagesForChat(sessionStore.currentSelectedSessionId, chatId);
        // For now, it relies on messages populated via socket or lastMessage from fetchChats
    }

    function clearChatDataForSession(sessionId) {
        if (chatsBySession.value[sessionId]) {
            delete chatsBySession.value[sessionId];
        }
        if (messagesBySessionAndChat.value[sessionId]) {
            delete messagesBySessionAndChat.value[sessionId];
        }
        if (sessionStore.currentSelectedSessionId === sessionId) {
            selectedChatId.value = null;
        }
    }


    return {
        chatsBySession,
        messagesBySessionAndChat,
        selectedChatId,
        isLoadingChats,
        isLoadingMessages,
        currentSessionChats,
        selectedChatMessages,
        fetchChatsForCurrentSession,
        addMessageToChat,
        setSelectedChatId,
        clearChatDataForSession
    };
});
