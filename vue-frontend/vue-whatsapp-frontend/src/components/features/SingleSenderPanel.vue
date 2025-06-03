<template>
  <div class="space-y-6">
    <div
      class="bg-white dark:bg-slate-800 shadow-md rounded-lg p-6 transition-colors duration-200"
    >
      <h2
        class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center justify-between"
      >
        <span>Single Sender</span>
        <button
          @click="logout"
          class="btn btn-light !w-auto px-4 py-2 text-sm"
        >
          Logout
        </button>
      </h2>

      <div class="flex items-center justify-between mb-4">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300 mr-4"
          >Mode:</span
        >
        <div class="flex space-x-4">
          <label class="inline-flex items-center cursor-pointer">
            <input
              type="radio"
              class="form-radio"
              value="text"
              v-model="selectedMode"
            />
            <span class="ml-2 text-gray-700 dark:text-gray-300"
              >Send Text</span
            >
          </label>
          <label class="inline-flex items-center cursor-pointer">
            <input
              type="radio"
              class="form-radio"
              value="media"
              v-model="selectedMode"
            />
            <span class="ml-2 text-gray-700 dark:text-gray-300"
              >Send Image/Video</span
            >
          </label>
          <label class="inline-flex items-center cursor-pointer">
            <input
              type="radio"
              class="form-radio"
              value="location"
              v-model="selectedMode"
            />
            <span class="ml-2 text-gray-700 dark:text-gray-300"
              >Send Location</span
            >
          </label>
          <label class="inline-flex items-center cursor-pointer">
            <input
              type="radio"
              class="form-radio"
              value="contact_info"
              v-model="selectedMode"
            />
            <span class="ml-2 text-gray-700 dark:text-gray-300"
              >Get Contact Info</span
            >
          </label>
          <label class="inline-flex items-center cursor-pointer">
            <input
              type="radio"
              class="form-radio"
              value="set_status"
              v-model="selectedMode"
            />
            <span class="ml-2 text-gray-700 dark:text-gray-300"
              >Set Status</span
            >
          </label>
        </div>
      </div>

      <div
        v-if="message"
        :class="{
          'text-green-600 dark:text-green-400': !error,
          'text-red-600 dark:text-red-400': error,
        }"
        class="mb-4 text-center font-medium"
      >
        {{ message }}
      </div>

      <div v-if="selectedMode === 'text'" class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300">
          Send Text Message
        </h3>
        <div>
          <label
            for="text-recipient"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Recipient Number/ID:</label
          >
          <input
            type="text"
            id="text-recipient"
            v-model="recipient"
            placeholder="e.g., 123... or group@g.us"
            class="form-input"
          />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            For groups, use the full group ID (e.g., 1234567890-123456@g.us).
            For individuals, use the number without '+' (e.g., 62812...).
          </p>
        </div>
        <div>
          <label
            for="text-country-code"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Country Code (Optional, for auto-formatting):</label
          >
          <input
            type="text"
            id="text-country-code"
            v-model="countryCode"
            placeholder="e.g., 62"
            class="form-input w-24"
          />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Leave blank if the recipient number is already in full international format (e.g., 62812...).
          </p>
        </div>
        <div>
          <label
            for="message-text"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Message:</label
          >
          <textarea
            id="message-text"
            v-model="messageText"
            rows="4"
            placeholder="Type your message..."
            class="form-textarea"
          ></textarea>
        </div>
        <button
          @click="sendTextMessage"
          :disabled="!currentSelectedSessionId || isSending"
          class="btn btn-green"
        >
          {{ isSending ? 'Sending...' : 'Send Message' }}
        </button>
      </div>

      <div v-if="selectedMode === 'media'" class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300">
          Send Image/Video
        </h3>
        <div>
          <label
            for="media-recipient"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Recipient Number/ID:</label
          >
          <input
            type="text"
            id="media-recipient"
            v-model="mediaRecipient"
            placeholder="e.g., 123..."
            class="form-input"
          />
        </div>
        <div>
          <label
            for="media-country-code"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Country Code (Optional, for auto-formatting):</label
          >
          <input
            type="text"
            id="media-country-code"
            v-model="countryCode"
            placeholder="e.g., 62"
            class="form-input w-24"
          />
        </div>
        <div class="flex items-center space-x-4">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
            >Source:</span
          >
          <label class="inline-flex items-center cursor-pointer">
            <input
              type="radio"
              class="form-radio"
              value="upload"
              v-model="mediaSource"
            />
            <span class="ml-2 text-gray-700 dark:text-gray-300">Upload</span>
          </label>
          <label class="inline-flex items-center cursor-pointer">
            <input
              type="radio"
              class="form-radio"
              value="url"
              v-model="mediaSource"
            />
            <span class="ml-2 text-gray-700 dark:text-gray-300">URL</span>
          </label>
        </div>

        <div v-if="mediaSource === 'upload'">
          <label
            for="media-file"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Media File:</label
          >
          <input
            type="file"
            id="media-file"
            @change="handleFileChange"
            accept="image/*,video/*"
            class="file-input-styled"
          />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Max file size might be limited by WhatsApp.
          </p>
        </div>

        <div v-if="mediaSource === 'url'">
          <label
            for="image-url"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Image/Video URL:</label
          >
          <input
            type="text"
            id="image-url"
            v-model="imageUrl"
            placeholder="e.g., https://example.com/image.jpg"
            class="form-input"
          />
        </div>

        <div>
          <label
            for="media-caption"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Caption (Optional):</label
          >
          <input
            type="text"
            id="media-caption"
            v-model="caption"
            placeholder="Add a caption..."
            class="form-input"
          />
        </div>
        <button
          @click="sendMediaMessage"
          :disabled="!currentSelectedSessionId || isSending"
          class="btn btn-teal"
        >
          {{ isSending ? 'Sending...' : 'Send Media' }}
        </button>
      </div>

      <div v-if="selectedMode === 'location'" class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300">
          Send Location
        </h3>
        <div>
          <label
            for="location-recipient"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Recipient Number/ID:</label
          >
          <input
            type="text"
            id="location-recipient"
            v-model="locationRecipient"
            placeholder="e.g., 123..."
            class="form-input"
          />
        </div>
        <div>
          <label
            for="location-country-code"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Country Code (Optional, for auto-formatting):</label
          >
          <input
            type="text"
            id="location-country-code"
            v-model="countryCode"
            placeholder="e.g., 62"
            class="form-input w-24"
          />
        </div>
        <div>
          <label
            for="latitude"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Latitude:</label
          >
          <input
            type="number"
            id="latitude"
            v-model.number="latitude"
            step="any"
            placeholder="e.g., -6.2087634"
            class="form-input"
          />
        </div>
        <div>
          <label
            for="longitude"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Longitude:</label
          >
          <input
            type="number"
            id="longitude"
            v-model.number="longitude"
            step="any"
            placeholder="e.g., 106.845599"
            class="form-input"
          />
        </div>
        <div>
          <label
            for="location-description"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Description (Optional):</label
          >
          <input
            type="text"
            id="location-description"
            v-model="locationDescription"
            placeholder="e.g., My current location"
            class="form-input"
          />
        </div>
        <button
          @click="sendLocationMessage"
          :disabled="!currentSelectedSessionId || isSending"
          class="btn btn-orange"
        >
          {{ isSending ? 'Sending...' : 'Send Location' }}
        </button>
      </div>

      <div v-if="selectedMode === 'contact_info'" class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300">
          Get Contact Information
        </h3>
        <div>
          <label
            for="contact-info-id"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Contact Number/ID:</label
          >
          <input
            type="text"
            id="contact-info-id"
            v-model="contactInfoId"
            placeholder="e.g., 123..."
            class="form-input"
          />
        </div>
        <div>
          <label
            for="contact-info-country-code"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Country Code (Optional, for auto-formatting):</label
          >
          <input
            type="text"
            id="contact-info-country-code"
            v-model="countryCode"
            placeholder="e.g., 62"
            class="form-input w-24"
          />
        </div>
        <button
          @click="getContactDetails"
          :disabled="!currentSelectedSessionId || isFetchingContact"
          class="btn btn-purple"
        >
          {{ isFetchingContact ? 'Fetching...' : 'Get Contact Info' }}
        </button>
        <div
          v-if="contactDetails"
          class="bg-slate-100 dark:bg-slate-700 p-3 rounded-lg text-sm text-slate-700 dark:text-slate-300 mt-4 break-words"
        >
          <p><strong>Name:</strong> {{ contactDetails.name || 'N/A' }}</p>
          <p>
            <strong>Number:</strong> {{ contactDetails.number || 'N/A' }}
          </p>
          <p><strong>Is Business:</strong> {{ contactDetails.isBusiness }}</p>
          <p>
            <strong>Private Name Tag:</strong>
            {{ contactDetails.pushname || 'N/A' }}
          </p>
          <p>
            <strong>About:</strong> {{ contactDetails.profileStatus || 'N/A' }}
          </p>
        </div>
      </div>

      <div v-if="selectedMode === 'set_status'" class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300">
          Set My WhatsApp Status
        </h3>
        <div>
          <label
            for="status-message"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >New Status Message:</label
          >
          <textarea
            id="status-message"
            v-model="newStatusMessage"
            rows="2"
            placeholder="Enter your new 'About' status..."
            class="form-textarea"
          ></textarea>
        </div>
        <button
          @click="setMyStatus"
          :disabled="!currentSelectedSessionId || isSettingStatus"
          class="btn btn-indigo"
        >
          {{ isSettingStatus ? 'Setting...' : 'Set Status' }}
        </button>
      </div>
    </div>

    <div
      class="bg-white dark:bg-slate-800 shadow-md rounded-lg p-6 transition-colors duration-200"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3
            class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3"
          >
            Chats
            <button
              @click="refreshChats"
              :disabled="isLoadingChats || !currentSelectedSessionId"
              class="btn btn-light !w-auto px-3 py-1 text-xs ml-2"
            >
              <span v-if="isLoadingChats">Refreshing...</span>
              <span v-else>Refresh</span>
            </button>
          </h3>
          <div
            class="max-h-80 overflow-y-auto custom-scrollbar border border-gray-200 dark:border-slate-700 rounded-md"
          >
            <ul v-if="currentSessionChats.length > 0">
              <li
                v-for="chat in currentSessionChats"
                :key="chat.id"
                @click="selectChat(chat.id)"
                :class="{
                  'bg-indigo-100 dark:bg-indigo-700':
                    selectedChatId === chat.id,
                  'hover:bg-slate-50 dark:hover:bg-slate-700':
                    selectedChatId !== chat.id,
                }"
                class="p-3 border-b border-gray-200 dark:border-slate-700 cursor-pointer flex justify-between items-center transition-colors duration-150"
              >
                <div class="flex-grow">
                  <p
                    class="font-medium text-gray-800 dark:text-gray-200 text-sm"
                  >
                    {{ chat.name || chat.id }}
                  </p>
                  <p
                    v-if="chat.lastMessage"
                    class="text-xs text-gray-500 dark:text-gray-400 truncate"
                  >
                    {{ chat.lastMessage.body }}
                  </p>
                </div>
                <span
                  v-if="chat.unreadCount > 0"
                  class="bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-full"
                  >{{ chat.unreadCount }}</span
                >
              </li>
            </ul>
            <p v-else class="text-center py-4 text-gray-500 dark:text-gray-400">
              {{ currentSelectedSessionId ? 'No chats found.' : 'Select a ready session to view chats.' }}
            </p>
          </div>
        </div>

        <div>
          <h3
            class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3"
          >
            Message Log ({{ selectedChatName }})
            <button
              v-if="selectedChatId"
              @click="sendSeenStatus"
              :disabled="!currentSelectedSessionId || !selectedChatId"
              class="btn btn-light !w-auto px-3 py-1 text-xs ml-2"
              title="Mark all messages in this chat as seen"
            >
              Mark All Seen
            </button>
          </h3>
          <div
            class="max-h-80 overflow-y-auto custom-scrollbar border border-gray-200 dark:border-slate-700 rounded-md p-3 space-y-2 text-sm"
          >
            <div
              v-for="message in selectedChatMessages"
              :key="message.id"
              :class="{
                'text-right': message.fromMe,
                'text-left': !message.fromMe,
              }"
            >
              <span
                :class="{
                  'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200':
                    message.fromMe,
                  'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200':
                    !message.fromMe,
                }"
                class="inline-block p-2 rounded-lg max-w-[80%] break-words"
              >
                <span v-if="message.isGroupMsg && !message.fromMe" class="font-bold text-xs text-indigo-600 dark:text-indigo-400 mr-1">
                  {{ message.author || message.from.split('@')[0] }}:
                </span>
                <span v-if="message.type === 'chat'">{{ message.body }}</span>
                <span v-else-if="message.type === 'image'" class="text-sm italic">
                  [Image] {{ message.caption || message.body }}
                </span>
                <span v-else-if="message.type === 'video'" class="text-sm italic">
                  [Video] {{ message.caption || message.body }}
                </span>
                <span v-else-if="message.type === 'location'" class="text-sm italic">
                  [Location] {{ message.description || message.body }}
                </span>
                <span v-else class="text-sm italic">
                  [{{ message.type || 'Unknown' }}] {{ message.body }}
                </span>
                <span
                  class="block text-[0.65rem] text-gray-400 dark:text-gray-500 mt-1"
                >
                  {{ formatTimestamp(message.timestamp) }}
                </span>
              </span>
            </div>
            <p
              v-if="selectedChatMessages.length === 0"
              class="text-center py-4 text-gray-500 dark:text-gray-400"
            >
              {{ selectedChatId ? 'No messages in this chat.' : 'Select a chat to view messages.' }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useChatStore } from '@/stores/chatStore';
import {
  sendMessageApi,
  sendImageApi,
  sendLocationApi,
  getContactInfoApi,
  setStatusApi,
  sendSeenApi
} from '@/services/api';

const authStore = useAuthStore();
const sessionStore = useSessionStore();
const chatStore = useChatStore();

// Form state
const selectedMode = ref('text'); // 'text', 'media', 'location', 'contact_info', 'set_status'
const recipient = ref(''); // For text messages
const messageText = ref(''); // For text messages
const countryCode = ref(''); // Optional, for international number formatting

const mediaRecipient = ref(''); // For image/video messages
const mediaSource = ref('upload'); // 'upload' or 'url'
const mediaFile = ref(null); // For file upload
const imageUrl = ref(''); // For image/video URL
const caption = ref(''); // For image/video caption

const locationRecipient = ref(''); // For location messages
const latitude = ref(null); // For location messages
const longitude = ref(null); // For location messages
const locationDescription = ref(''); // For location messages

const contactInfoId = ref(''); // For get contact info
const contactDetails = ref(null);

const newStatusMessage = ref(''); // For set status

const message = ref('');
const error = ref(false);
const isSending = ref(false);
const isFetchingContact = ref(false);
const isSettingStatus = ref(false);

// Computed properties from stores
const currentSelectedSessionId = computed(() => sessionStore.currentSelectedSessionId);
const isLoadingChats = computed(() => chatStore.isLoadingChats);
const currentSessionChats = computed(() => chatStore.currentSessionChats);
const selectedChatId = computed(() => chatStore.selectedChatId);
const selectedChatMessages = computed(() => chatStore.selectedChatMessages);

const selectedChatName = computed(() => {
  const chat = chatStore.currentSessionChats.find(
    (c) => c.id === chatStore.selectedChatId
  );
  return chat ? chat.name || chat.id : 'No chat selected';
});

// Watch for changes in currentSelectedSessionId to refresh chats
watch(currentSelectedSessionId, (newSessionId) => {
  if (newSessionId) {
    chatStore.fetchChatsForCurrentSession();
  } else {
    chatStore.chatsBySession = {};
    chatStore.messagesBySessionAndChat = {};
    chatStore.selectedChatId = null;
  }
});

// Watch for changes in selectedChatId to clear old contact details/status message
watch(selectedChatId, () => {
    contactDetails.value = null;
    newStatusMessage.value = '';
});

// Watch for changes in selectedMode to clear old messages/errors
watch(selectedMode, () => {
    message.value = '';
    error.value = false;
    contactDetails.value = null; // Clear contact details when switching mode
    newStatusMessage.value = ''; // Clear status message when switching mode
});

// Watch for changes in quickSendRecipientId from sessionStore
watch(() => sessionStore.quickSendRecipientId, (newRecipientId) => {
    if (newRecipientId) {
        recipient.value = newRecipientId;
        mediaRecipient.value = newRecipientId;
        locationRecipient.value = newRecipientId;
        contactInfoId.value = newRecipientId;
        // Optionally switch to text mode if a recipient is selected for quick send
        selectedMode.value = 'text';
    }
});


// Lifecycle hook
onMounted(() => {
  if (currentSelectedSessionId.value) {
    chatStore.fetchChatsForCurrentSession();
  }
});

// --- Methods ---

const logout = () => {
  authStore.logout();
};

const sendTextMessage = async () => {
  if (!currentSelectedSessionId.value) {
    setMessage('Please select an active session first.', true);
    return;
  }
  if (!recipient.value || !messageText.value) {
    setMessage('Recipient and message cannot be empty.', true);
    return;
  }

  isSending.value = true;
  setMessage('Sending message...', false);
  try {
    const response = await sendMessageApi(
      currentSelectedSessionId.value,
      recipient.value,
      messageText.value,
      countryCode.value // Pass countryCode
    );
    if (response.success) {
      setMessage('Message sent successfully!', false);
      messageText.value = ''; // Clear message after sending
      // Recipient can remain for quick follow-ups
    } else {
      setMessage(`Failed to send message: ${response.error}`, true);
    }
  } catch (err) {
    setMessage(`Error sending message: ${err.message}`, true);
  } finally {
    isSending.value = false;
  }
};

const sendMediaMessage = async () => {
  if (!currentSelectedSessionId.value) {
    setMessage('Please select an active session first.', true);
    return;
  }
  if (!mediaRecipient.value) {
    setMessage('Recipient cannot be empty.', true);
    return;
  }

  const formData = new FormData();
  formData.append('number', mediaRecipient.value);
  formData.append('countryCode', countryCode.value); // Pass countryCode
  if (caption.value) {
    formData.append('caption', caption.value);
  }

  if (mediaSource.value === 'upload') {
    if (!mediaFile.value) {
      setMessage('Please select a file to upload.', true);
      return;
    }
    formData.append('file', mediaFile.value);
  } else if (mediaSource.value === 'url') {
    if (!imageUrl.value) {
      setMessage('Please provide a URL for the media.', true);
      return;
    }
    formData.append('url', imageUrl.value);
  }

  isSending.value = true;
  setMessage('Sending media...', false);
  try {
    const response = await sendImageApi(currentSelectedSessionId.value, formData);
    if (response.success) {
      setMessage('Media sent successfully!', false);
      // Clear fields after sending
      mediaFile.value = null;
      imageUrl.value = '';
      caption.value = '';
      document.getElementById('media-file').value = ''; // Clear file input visual
    } else {
      setMessage(`Failed to send media: ${response.error}`, true);
    }
  } catch (err) {
    setMessage(`Error sending media: ${err.message}`, true);
  } finally {
    isSending.value = false;
  }
};

const sendLocationMessage = async () => {
  if (!currentSelectedSessionId.value) {
    setMessage('Please select an active session first.', true);
    return;
  }
  if (!locationRecipient.value || latitude.value === null || longitude.value === null) {
    setMessage('Recipient, latitude, and longitude cannot be empty.', true);
    return;
  }

  isSending.value = true;
  setMessage('Sending location...', false);
  try {
    const response = await sendLocationApi(
      currentSelectedSessionId.value,
      locationRecipient.value,
      latitude.value,
      longitude.value,
      locationDescription.value,
      countryCode.value // Pass countryCode
    );
    if (response.success) {
      setMessage('Location sent successfully!', false);
      locationRecipient.value = '';
      latitude.value = null;
      longitude.value = null;
      locationDescription.value = '';
      countryCode.value = ''; // Clear country code for location specific
    } else {
      setMessage(`Failed to send location: ${response.error}`, true);
    }
  } catch (err) {
    setMessage(`Error sending location: ${err.message}`, true);
  } finally {
    isSending.value = false;
  }
};

const getContactDetails = async () => {
  if (!currentSelectedSessionId.value) {
    setMessage('Please select an active session first.', true);
    return;
  }
  if (!contactInfoId.value) {
    setMessage('Contact Number/ID cannot be empty.', true);
    return;
  }

  isFetchingContact.value = true;
  contactDetails.value = null; // Clear previous results
  setMessage('Fetching contact info...', false);
  try {
    const response = await getContactInfoApi(
      currentSelectedSessionId.value,
      contactInfoId.value,
      countryCode.value // Pass countryCode
    );
    if (response.success && response.contact) {
      contactDetails.value = response.contact;
      setMessage('Contact info fetched successfully.', false);
    } else {
      setMessage(`Failed to fetch contact info: ${response.error}`, true);
      contactDetails.value = { name: 'Not Found', number: contactInfoId.value, isBusiness: 'N/A', pushname: 'N/A', profileStatus: 'N/A' };
    }
  } catch (err) {
    setMessage(`Error fetching contact info: ${err.message}`, true);
    contactDetails.value = { name: 'Error', number: contactInfoId.value, isBusiness: 'N/A', pushname: 'N/A', profileStatus: 'N/A' };
  } finally {
    isFetchingContact.value = false;
  }
};

const setMyStatus = async () => {
  if (!currentSelectedSessionId.value) {
    setMessage('Please select an active session first.', true);
    return;
  }
  if (!newStatusMessage.value) {
    setMessage('Status message cannot be empty.', true);
    return;
  }

  isSettingStatus.value = true;
  setMessage('Setting status...', false);
  try {
    const response = await setStatusApi(currentSelectedSessionId.value, newStatusMessage.value);
    if (response.success) {
      setMessage('Status updated successfully!', false);
      newStatusMessage.value = '';
    } else {
      setMessage(`Failed to set status: ${response.error}`, true);
    }
  } catch (err) {
    setMessage(`Error setting status: ${err.message}`, true);
  } finally {
    isSettingStatus.value = false;
  }
};

const handleFileChange = (event) => {
  mediaFile.value = event.target.files[0];
};

const setMessage = (msg, isError) => {
  message.value = msg;
  error.value = isError;
  setTimeout(() => {
    message.value = '';
    error.value = false;
  }, 5000); // Clear message after 5 seconds
};

const refreshChats = () => {
  chatStore.fetchChatsForCurrentSession();
};

const selectChat = (chatId) => {
  chatStore.setSelectedChatId(chatId);
  sessionStore.setQuickSendRecipient(chatId); // Set this chat as quick send recipient
};

const sendSeenStatus = async () => {
  if (!currentSelectedSessionId.value || !selectedChatId.value) {
    setMessage('Please select an active session and a chat.', true);
    return;
  }
  
  const response = await sendSeenApi(currentSelectedSessionId.value, selectedChatId.value); //
  if(response.success) {
    setMessage('Messages marked as seen.', false);
    // Optionally, update the unreadCount in the chat store
    const chat = chatStore.currentSessionChats.find(c => c.id === selectedChatId.value);
    if (chat) chat.unreadCount = 0;
  } else {
    setMessage(`Failed to mark as seen: ${response.error}`, true);
  }
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp * 1000); // Convert to milliseconds
  return date.toLocaleString(); // Or format as preferred
};

// Expose openQrModalForSession globally for direct calls from socket.js
// This creates a loose coupling but allows for direct modal opening
// if the modal component is not a direct child.
window.openQrModalForSession = (sessionId) => {
  const session = sessionStore.sessions[sessionId];
  if (session && session.qrCode) {
    sessionStore.selectSession(sessionId); // Ensure it's the selected session
    // This part assumes you have a modal that can be triggered.
    // If you have a ref to a QR modal, you would open it here:
    // qrModalRef.value.open();
    // For now, we'll just log it.
    console.log(`Open QR modal for session ${sessionId} with QR: ${session.qrCode}`);
    setMessage(`QR code received for session ${sessionId}. Please scan.`, false);
  }
};
</script>
