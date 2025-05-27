<template>
  <section id="chatsSection" class="flex flex-col h-full">
    <div class="flex justify-between items-center mb-2">
        <h3 class="text-lg font-semibold text-slate-700 dark:text-slate-200">Chats</h3>
        <button 
            @click="refreshChats" 
            :disabled="!sessionStore.currentSelectedSessionId || !sessionStore.selectedSessionData?.isReady || chatStore.isLoadingChats"
            class="text-xs bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1.5 px-3 rounded-md transition shadow-sm focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 dark:focus:ring-offset-slate-800 disabled:opacity-50"
        >
            {{ chatStore.isLoadingChats ? 'Refreshing...' : 'Refresh' }}
        </button>
    </div>
    <div 
        id="chatsListDisplay" 
        class="overflow-y-auto custom-scrollbar border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40 p-1 rounded-lg flex-grow"
    >
        <div v-if="!sessionStore.currentSelectedSessionId || !sessionStore.selectedSessionData?.isReady">
            <p class="text-sm text-slate-500 dark:text-slate-400 p-3 text-center">Select a ready session to view chats.</p>
        </div>
        <div v-else-if="chatStore.isLoadingChats && chatStore.currentSessionChats.length === 0">
            <p class="text-sm text-slate-500 dark:text-slate-400 p-3 text-center">Loading chats...</p>
        </div>
        <div v-else-if="chatStore.currentSessionChats.length === 0">
            <p class="text-sm text-slate-500 dark:text-slate-400 p-3 text-center">No chats found for this session. Try refreshing.</p>
        </div>
        <div v-else class="space-y-1">
            <div 
                v-for="chat in chatStore.currentSessionChats" 
                :key="chat.id"
                @click="selectChat(chat.id)"
                class="p-2.5 hover:bg-slate-200 dark:hover:bg-slate-600/50 cursor-pointer border-b border-gray-200 dark:border-slate-700/50 rounded-md text-xs transition-colors duration-100"
                :class="{ 'bg-sky-100 dark:bg-sky-700/70 border-l-4 border-sky-500 dark:border-sky-400': chat.id === chatStore.selectedChatId }"
            >
                <div class="flex justify-between items-center">
                    <h5 class="font-semibold text-slate-700 dark:text-slate-200 truncate" :title="chat.name || chat.id.split('@')[0]">
                        {{ chat.name || chat.id.split('@')[0] }}
                        <span v-if="chat.isGroup" class="text-xs text-slate-400 dark:text-slate-500 ml-1">(Group)</span>
                    </h5>
                    <span v-if="chat.unreadCount > 0" class="bg-green-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full ml-2">
                        {{ chat.unreadCount }}
                    </span>
                </div>
                <p class="text-slate-500 dark:text-slate-400 truncate text-xs mt-0.5" :title="lastMessagePreview(chat.lastMessage)">
                    {{ lastMessagePreview(chat.lastMessage) }}
                </p>
            </div>
        </div>
    </div>
  </section>
</template>

<script setup>
import { useSessionStore } from '../../stores/sessionStore';
import { useChatStore } from '../../stores/chatStore';
import { watch, onMounted } from 'vue';

const sessionStore = useSessionStore();
const chatStore = useChatStore();

function selectChat(chatId) {
  chatStore.setSelectedChatId(chatId);
  sessionStore.setQuickSendRecipient(chatId); // MODIFIED: Set recipient for auto-fill
}

function refreshChats() {
  if (sessionStore.currentSelectedSessionId && sessionStore.selectedSessionData?.isReady) {
    chatStore.fetchChatsForCurrentSession();
  }
}

function lastMessagePreview(lastMessage) {
    if (!lastMessage) return 'No recent messages';
    let prefix = lastMessage.fromMe ? 'You: ' : (lastMessage.author ? `${lastMessage.author.replace(/@c\.us|@g\.us/,'')}: ` : '');
    return prefix + (lastMessage.body || `[Media: ${lastMessage.type || 'unknown'}]`);
}

watch(() => sessionStore.selectedSessionData?.isReady, (isReady) => {
    if (isReady && sessionStore.currentSelectedSessionId) {
        chatStore.fetchChatsForCurrentSession();
    } else if (!isReady && sessionStore.currentSelectedSessionId) {
        chatStore.clearChatDataForSession(sessionStore.currentSelectedSessionId);
    }
});

watch(() => sessionStore.currentSelectedSessionId, (newSessionId, oldSessionId) => {
    if (newSessionId) {
        if (sessionStore.selectedSessionData?.isReady) {
            chatStore.fetchChatsForCurrentSession();
        } else {
            chatStore.clearChatDataForSession(newSessionId);
        }
    } else {
        if(oldSessionId) chatStore.clearChatDataForSession(oldSessionId);
        chatStore.setSelectedChatId(null);
    }
});

onMounted(() => {
    if (sessionStore.currentSelectedSessionId && sessionStore.selectedSessionData?.isReady) {
        chatStore.fetchChatsForCurrentSession();
    }
});
</script>

<style scoped>
/* Styles specific to ChatsPanel if needed */
</style>
