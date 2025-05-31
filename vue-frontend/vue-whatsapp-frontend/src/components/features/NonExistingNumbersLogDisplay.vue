<template>
  <div class="bg-white dark:bg-slate-800 p-4 rounded-lg shadow custom-scrollbar h-full flex flex-col">
    <h3 class="text-md font-semibold text-slate-700 dark:text-slate-200 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
      Unregistered / Error <span class="text-sm text-red-500">({{ store.unregisteredNumbers.length }})</span>
    </h3>
    <div class="flex-grow overflow-y-auto custom-scrollbar pr-2">
      <ul v-if="store.unregisteredNumbers.length > 0" class="space-y-1">
        <li v-for="(item, index) in store.unregisteredNumbers" :key="`unreg-${index}`" class="text-sm text-red-700 dark:text-red-400 font-mono break-all">
          <strong>{{ item.number }}:</strong> {{ item.reason }}
        </li>
      </ul>
      <p v-else class="text-sm text-slate-500 dark:text-slate-400">No unregistered numbers or errors from the last bulk check.</p>
    </div>
  </div>
</template>

<script setup>
import { useBulkCheckStore } from '@/stores/bulkCheckStore';
const store = useBulkCheckStore();
</script>
