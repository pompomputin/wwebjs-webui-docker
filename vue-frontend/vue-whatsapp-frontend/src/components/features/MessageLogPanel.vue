<template>
  <section id="messageLogSection" class="flex flex-col h-full">
    <h3 class="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Message Log</h3>
    <div 
        ref="messageLogContainer"
        id="messageLogDisplay" 
        class="overflow-y-auto custom-scrollbar border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40 p-3 rounded-lg space-y-2 flex-grow"
    >
        <div v-if="!chatStore.selectedChatId">
            <p class="text-sm text-slate-500 dark:text-slate-400 text-center p-4">Select a chat to view messages.</p>
        </div>
        <div v-else-if="chatStore.isLoadingMessages">
             <p class="text-sm text-slate-500 dark:text-slate-400 text-center p-4">Loading messages...</p>
        </div>
        <div v-else-if="chatStore.selectedChatMessages.length === 0">
            <p class="text-sm text-slate-500 dark:text-slate-400 text-center p-4">No messages in this chat yet.</p>
        </div>
        <div v-else>
            <div 
                v-for="msg in chatStore.selectedChatMessages" 
                :key="msg.id"
                class="p-2 rounded-lg mb-1 text-xs break-words w-fit max-w-[85%]"
                :class="{
                    'bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-100 ml-auto': msg.fromMe,
                    'bg-blue-100 dark:bg-blue-700 text-blue-800 dark:text-blue-100 mr-auto': !msg.fromMe,
                    'bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-300 text-center italic mx-auto': msg.type === 'system' || (!msg.fromMe && !msg.author) /* System or notification like */
                }"
            >
                <strong v-if="!msg.fromMe && msg.author" class="font-semibold block">
                    {{ msg.author.replace(/@c\.us|@g\.us/,'') }}
                </strong>
                 <strong v-else-if="!msg.fromMe && !msg.isGroupMsg" class="font-semibold block">
                    {{ msg.from.replace(/@c\.us|@g\.us/,'') }}
                </strong>
                <span class="block">{{ msg.body || `[Media: ${msg.type || 'unknown'}]` }}</span>
                <span class="text-xxs text-slate-500 dark:text-slate-400 block mt-0.5" :class="msg.fromMe ? 'text-right' : 'text-left'">
                    {{ formatTimestamp(msg.timestamp) }}
                </span>
            </div>
        </div>
    </div>
  </section>
</template>

<script setup>
import { useChatStore } from '../../stores/chatStore';
import { watch, ref, nextTick } from 'vue';

const chatStore = useChatStore();
const messageLogContainer = ref(null);

function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    return new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function scrollToBottom() {
    nextTick(() => {
        if (messageLogContainer.value) {
            messageLogContainer.value.scrollTop = messageLogContainer.value.scrollHeight;
        }
    });
}

// Scroll to bottom when messages for the selected chat change or when a new chat is selected
watch(() => chatStore.selectedChatMessages, (newMessages) => {
    if (newMessages) { // Check specifically if newMessages is defined
        scrollToBottom();
    }
}, { deep: true }); // deep watch for changes within the array

watch(() => chatStore.selectedChatId, (newChatId) => {
    if (newChatId) {
        scrollToBottom(); // Scroll when a new chat is selected and messages might populate
    }
});
</script>

<style scoped>
/* Extra small text for timestamp */
.text-xxs {
    font-size: 0.65rem; /* 10.4px */
    line-height: 0.85rem;
}
</style>
