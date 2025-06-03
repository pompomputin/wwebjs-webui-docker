// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import MainLayout from '../layouts/MainLayout.vue';

// --- Feature Panels ---
// Existing Panels (to be restyled)
import BulkSendPanel from '../components/features/BulkSendPanel.vue';
import BulkCheckNumbersPanel from '../components/features/BulkCheckNumbersPanel.vue';

// New Panels (currently stubs)
import DashboardHomePanel from '../components/features/DashboardHomePanel.vue'; // For the main device list view
import SingleSenderPanel from '../components/features/SingleSenderPanel.vue'; // <--- Ensure this line is correct
import AutoRespondersPanel from '../components/features/AutoRespondersPanel.vue';
import PhoneBookPanel from '../components/features/PhoneBookPanel.vue';
import RestApiPanel from '../components/features/RestApiPanel.vue';
import HistoryMessagePanel from '../components/features/HistoryMessagePanel.vue';
import FileManagerPanel from '../components/features/FileManagerPanel.vue';
import AdminMenuPanel from '../components/features/AdminMenuPanel.vue';

import { useAuthStore } from '@/stores/authStore.js';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requiresGuest: true }
  },
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboardHome',
        component: DashboardHomePanel,
      },
      // --- MAIN Menu Routes ---
      {
        path: 'auto-responders',
        name: 'autoResponders',
        component: AutoRespondersPanel,
      },
      {
        path: 'phone-book',
        name: 'phoneBook',
        component: PhoneBookPanel,
      },
      {
        path: 'campaigns',
        name: 'campaigns',
        component: BulkSendPanel,
      },
      {
        path: 'single-sender', // <--- This route will now use the merged panel
        name: 'singleSender',
        component: SingleSenderPanel,
      },
      {
        path: 'rest-api',
        name: 'restApi',
        component: RestApiPanel,
      },
      {
        path: 'bulk-check',
        name: 'bulkCheckNumbers',
        component: BulkCheckNumbersPanel,
      },
      {
        path: 'history-message',
        name: 'historyMessage',
        component: HistoryMessagePanel,
      },
      // --- OTHER Menu Routes ---
      {
        path: 'file-manager',
        name: 'fileManager',
        component: FileManagerPanel,
      },
      {
        path: 'admin-menu',
        name: 'adminMenu',
        component: AdminMenuPanel,
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: to => {
      const authStore = useAuthStore();
      return authStore.isAuthenticated ? { name: 'dashboardHome' } : { name: 'login' };
    }
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (!authStore.isAuthenticated && localStorage.getItem('authToken')) {
     authStore.checkAuthStatus();
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest);

  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } });
  } else if (requiresGuest && authStore.isAuthenticated) {
    next({ name: 'dashboardHome' });
  } else {
    next();
  }
});

export default router;
