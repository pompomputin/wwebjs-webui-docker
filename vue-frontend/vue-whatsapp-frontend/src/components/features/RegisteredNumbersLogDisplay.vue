<template>
  <div class="bg-white dark:bg-slate-800 p-4 rounded-lg shadow custom-scrollbar h-full flex flex-col">
    <h3 class="text-md font-semibold text-slate-700 dark:text-slate-200 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
      Registered Numbers <span class="text-sm text-green-500">({{ store.registeredNumbers.length }})</span>
    </h3>
    <div class="flex-grow overflow-y-auto custom-scrollbar pr-2">
      <ul v-if="store.registeredNumbers.length > 0" class="space-y-1">
        <li v-for="(num, index) in store.registeredNumbers" :key="`reg-${index}`" class="text-sm text-green-700 dark:text-green-400 font-mono break-all">
          {{ num }} </li>
      </ul>
      </div>
  </div>
</template>

<script setup>
import { useBulkCheckStore } from '@/stores/bulkCheckStore';
const store = useBulkCheckStore();
</script>
