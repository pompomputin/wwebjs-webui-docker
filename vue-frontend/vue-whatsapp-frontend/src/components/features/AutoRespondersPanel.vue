<template>
  <div class="p-4 md:p-6 bg-white dark:bg-slate-800 shadow-lg rounded-lg feature-panel">
    <h2 class="text-xl md:text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-6 flex items-center justify-between">
      <span>AutoResponder ( {{ sessionStore.currentSelectedSessionId || 'No Session' }} )</span>
      <div class="flex space-x-2">
        <button @click="openAddResponderModal" :disabled="!sessionStore.currentSelectedSessionId" class="btn btn-indigo flex items-center space-x-2 !w-auto px-4 py-2 text-sm">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add New</span>
        </button>
        <button @click="deleteSelectedResponders" :disabled="selectedResponders.length === 0 || !sessionStore.currentSelectedSessionId" class="btn bg-red-600 hover:bg-red-700 focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-800 text-white !w-auto px-4 py-2 text-sm">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Delete</span>
        </button>
      </div>
    </h2>

    <div class="flex flex-col sm:flex-row items-center justify-between mb-4 space-y-3 sm:space-y-0 sm:space-x-4">
        <div class="flex items-center space-x-2">
          <label for="show-entries" class="text-sm text-gray-600 dark:text-gray-300">Show</label>
          <select id="show-entries" v-model="entriesPerPage" class="form-select text-sm">
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
          <span class="text-sm text-gray-600 dark:text-gray-300">entries</span>
        </div>
        <div class="w-full sm:w-auto">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search..."
            class="form-input w-full"
          />
        </div>
    </div>

    <div v-if="isLoading" class="text-center py-4 text-indigo-600 dark:text-indigo-400">
      <svg class="animate-spin h-8 w-8 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p>Loading auto-responders...</p>
    </div>

    <div v-if="errorMessage" class="text-center py-4 text-red-600 dark:text-red-400">
      <p>{{ errorMessage }}</p>
    </div>

    <div v-else class="overflow-x-auto custom-scrollbar">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
        <thead class="bg-gray-50 dark:bg-slate-700">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" :disabled="paginatedResponders.length === 0" class="form-checkbox" />
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">KEYWORD</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">TYPE</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">STATUS</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ACTION</th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
          <tr v-if="paginatedResponders.length === 0">
            <td colspan="5" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">No data available in table</td>
          </tr>
          <tr v-for="responder in paginatedResponders" :key="responder._id"> <td class="px-6 py-4 whitespace-nowrap">
              <input type="checkbox" :value="responder._id" v-model="selectedResponders" class="form-checkbox" /> </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{{ responder.keyword }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ responder.messageType }}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span 
                :class="{
                  'px-2 inline-flex text-xs leading-5 font-semibold rounded-full': true,
                  'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100': responder.status === 'active',
                  'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100': responder.status === 'inactive',
                }"
              >
                {{ responder.status }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center space-x-2">
                    <button @click="editResponder(responder._id)" class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 p-1 rounded-md border border-gray-300 dark:border-slate-600" title="Edit">
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
                        </svg>
                    </button>
                    <button @click="deleteResponder(responder._id)" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 p-1 rounded-md border border-gray-300 dark:border-slate-600" title="Delete">
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <nav class="flex items-center justify-between pt-4">
      <div class="text-sm text-gray-700 dark:text-gray-300">
        Showing {{ currentStartIndex + 1 }} to {{ currentEndIndex }} of {{ filteredResponders.length }} entries
      </div>
      <ul class="flex items-center space-x-1">
        <li>
          <button
            @click="prevPage"
            :disabled="currentPage === 1"
            class="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-600"
          >
            Previous
          </button>
        </li>
        <li v-for="page in totalPages" :key="page">
          <button
            @click="goToPage(page)"
            :class="{
              'px-3 py-1 rounded-md font-bold': true,
              'bg-indigo-600 text-white dark:bg-indigo-700': currentPage === page,
              'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-600': currentPage !== page,
            }"
          >
            {{ page }}
          </button>
        </li>
        <li>
          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-600"
          >
            Next
          </button>
        </li>
      </ul>
    </nav>

    <AddAutoResponderModal 
        v-if="isAddResponderModalOpen" 
        :isEditMode="isEditMode" 
        :responderData="responderToEdit"
        @close="closeAddResponderModal" 
        @add-responder="handleAddResponder"
        @update-responder="handleUpdateResponder" 
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'; // Added onMounted
import { useSessionStore } from '@/stores/sessionStore';
import { 
    getAutoRespondersApi, 
    createAutoResponderApi, 
    updateAutoResponderApi, 
    deleteAutoResponderApi, 
    deleteBatchAutoRespondersApi 
} from '@/services/api'; // NEW: Import API functions
import AddAutoResponderModal from '@/components/modals/AddAutoResponderModal.vue';

const sessionStore = useSessionStore();

const responders = ref([]); // Auto-responder data from backend
const selectedResponders = ref([]);
const selectAll = ref(false);
const searchQuery = ref('');
const entriesPerPage = ref(10); // Default from screenshot
const currentPage = ref(1);
const isAddResponderModalOpen = ref(false);

const isEditMode = ref(false); 
const responderToEdit = ref(null);

const isLoading = ref(false); // NEW: Loading state
const errorMessage = ref(null); // NEW: Error message state


const filteredResponders = computed(() => {
  const query = searchQuery.value.toLowerCase();
  return responders.value.filter(responder =>
    responder.keyword.toLowerCase().includes(query) ||
    responder.messageType.toLowerCase().includes(query) ||
    responder.status.toLowerCase().includes(query)
  );
});

const paginatedResponders = computed(() => {
  const start = (currentPage.value - 1) * entriesPerPage.value;
  const end = start + entriesPerPage.value;
  return filteredResponders.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredResponders.value.length / entriesPerPage.value);
});

const currentStartIndex = computed(() => (currentPage.value - 1) * entriesPerPage.value);
const currentEndIndex = computed(() => Math.min(currentPage.value * entriesPerPage.value, filteredResponders.value.length));


// Methods for pagination
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

// Toggle select all checkboxes
const toggleSelectAll = () => {
  selectedResponders.value = selectAll.value
    ? paginatedResponders.value.map(r => r._id) // Changed to _id
    : [];
};

// Watch for changes in paginatedResponders to update selectAll state
watch(paginatedResponders, () => {
  if (paginatedResponders.value.length === 0) {
    selectAll.value = false;
  } else {
    // Check if all currently visible responders are selected
    selectAll.value = paginatedResponders.value.every(r => selectedResponders.value.includes(r._id)); // Updated logic
  }
}, { immediate: true });

// Watch for changes in selectedResponders to update selectAll state
watch(selectedResponders, () => {
  if (paginatedResponders.value.length === 0) {
    selectAll.value = false;
  } else {
    // Check if all currently visible responders are selected
    selectAll.value = paginatedResponders.value.every(r => selectedResponders.value.includes(r._id)); // Updated logic
  }
});

// NEW: Function to fetch responders from backend
const fetchResponders = async () => {
    if (!sessionStore.currentSelectedSessionId) {
        responders.value = [];
        errorMessage.value = 'Please select a session to view auto-responders.';
        return;
    }
    isLoading.value = true;
    errorMessage.value = null;
    try {
        const response = await getAutoRespondersApi(sessionStore.currentSelectedSessionId);
        if (response.success) {
            responders.value = response.responders;
        } else {
            errorMessage.value = response.error || 'Failed to fetch auto-responders.';
        }
    } catch (error) {
        errorMessage.value = `Network error fetching auto-responders: ${error.message}`;
    } finally {
        isLoading.value = false;
    }
};

// Watch for selected session change to fetch responders
watch(() => sessionStore.currentSelectedSessionId, (newSessionId) => {
    if (newSessionId) {
        fetchResponders();
    } else {
        responders.value = [];
        errorMessage.value = 'No session selected.';
    }
}, { immediate: true }); // Fetch on initial mount if session is already selected


// Modal functions
const openAddResponderModal = () => {
  isEditMode.value = false;
  responderToEdit.value = null;
  isAddResponderModalOpen.value = true;
};

const closeAddResponderModal = () => {
  isAddResponderModalOpen.value = false;
};

// NEW: Handle adding responder via API
const handleAddResponder = async (newResponderData) => {
    if (!sessionStore.currentSelectedSessionId) {
        errorMessage.value = 'No session selected. Cannot add responder.';
        return;
    }
    isLoading.value = true; // Show loading for this operation
    errorMessage.value = null;
    try {
        const response = await createAutoResponderApi(sessionStore.currentSelectedSessionId, newResponderData);
        if (response.success) {
            console.log('Added new responder:', response.responder);
            fetchResponders(); // Re-fetch to get the latest data from DB
        } else {
            errorMessage.value = response.error || 'Failed to add auto-responder.';
        }
    } catch (error) {
        errorMessage.value = `Network error adding auto-responder: ${error.message}`;
    } finally {
        isLoading.value = false;
        closeAddResponderModal();
    }
};

// NEW: Handle updating responder via API
const handleUpdateResponder = async (updatedResponderData) => {
    if (!sessionStore.currentSelectedSessionId) {
        errorMessage.value = 'No session selected. Cannot update responder.';
        return;
    }
    isLoading.value = true; // Show loading for this operation
    errorMessage.value = null;
    try {
        const response = await updateAutoResponderApi(sessionStore.currentSelectedSessionId, updatedResponderData._id, updatedResponderData);
        if (response.success) {
            console.log('Updated responder:', response.responder);
            fetchResponders(); // Re-fetch to get the latest data from DB
        } else {
            errorMessage.value = response.error || 'Failed to update auto-responder.';
        }
    } catch (error) {
        errorMessage.value = `Network error updating auto-responder: ${error.message}`;
    } finally {
        isLoading.value = false;
        closeAddResponderModal();
    }
};


// Action buttons for table rows
const editResponder = (id) => {
  const responder = responders.value.find(r => r._id === id); // Changed to _id
  if (responder) {
    isEditMode.value = true;
    responderToEdit.value = { ...responder };
    isAddResponderModalOpen.value = true;
  }
  console.log('Edit responder:', id);
};

// NEW: Handle single delete via API
const deleteResponder = async (id) => {
  if (confirm(`Are you sure you want to delete responder with ID: ${id}?`)) {
    isLoading.value = true; // Show loading
    errorMessage.value = null;
    try {
        const response = await deleteAutoResponderApi(sessionStore.currentSelectedSessionId, id);
        if (response.success) {
            console.log('Deleted responder:', id);
            fetchResponders(); // Re-fetch to update list
        } else {
            errorMessage.value = response.error || 'Failed to delete auto-responder.';
        }
    } catch (error) {
        errorMessage.value = `Network error deleting auto-responder: ${error.message}`;
    } finally {
        isLoading.value = false;
    }
  }
};

// NEW: Handle batch delete via API
const deleteSelectedResponders = async () => {
  if (selectedResponders.value.length === 0) {
    alert('Please select at least one responder to delete.');
    return;
  }
  if (confirm(`Are you sure you want to delete ${selectedResponders.value.length} selected responder(s)?`)) {
    isLoading.value = true; // Show loading
    errorMessage.value = null;
    try {
        const response = await deleteBatchAutoRespondersApi(sessionStore.currentSelectedSessionId, selectedResponders.value);
        if (response.success) {
            console.log('Deleted selected responders:', response.deletedCount);
            selectedResponders.value = []; // Clear selections
            selectAll.value = false;
            fetchResponders(); // Re-fetch to update list
        } else {
            errorMessage.value = response.error || 'Failed to batch delete auto-responders.';
        }
    } catch (error) {
        errorMessage.value = `Network error batch deleting auto-responders: ${error.message}`;
    } finally {
        isLoading.value = false;
    }
  }
};

// Removed placeholder data, now fetched from backend
// responders.value = [...]; 

</script>

<style scoped>
/* Scoped styles for the panel */
.feature-panel {
    /* Existing panel styles */
}
</style>