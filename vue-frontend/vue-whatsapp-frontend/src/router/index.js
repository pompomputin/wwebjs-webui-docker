// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'; //
import DashboardView from '../views/DashboardView.vue'; //
import LoginView from '../views/LoginView.vue'; // Import the new LoginView

// Import your feature panel components
import SendTextPanel from '../components/features/SendTextPanel.vue'; //
import SendImagePanel from '../components/features/SendImagePanel.vue'; //
import SendLocationPanel from '../components/features/SendLocationPanel.vue'; //
import GetContactInfoPanel from '../components/features/GetContactInfoPanel.vue'; //
import SetStatusPanel from '../components/features/SetStatusPanel.vue'; //
import BulkSendPanel from '../components/features/BulkSendPanel.vue'; //
import SessionActivePlaceholder from '../components/features/SessionActivePlaceholder.vue'; //

// Import the auth store for navigation guards
import { useAuthStore } from '@/stores/authStore';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requiresGuest: true } // Meta field to identify guest-only routes
  },
  {
    path: '/',
    name: 'home', // Or 'sessions-dashboard' //
    component: DashboardView, //
    meta: { requiresAuth: true }, // Meta field to identify protected routes
    children: [
      {
        path: '', // Default child for the dashboard //
        name: 'sessionActiveHome', //
        component: SessionActivePlaceholder, //
      },
      {
        path: 'sendtext', //
        name: 'sendText', //
        component: SendTextPanel, //
      },
      {
        path: 'sendimage', //
        name: 'sendImage', //
        component: SendImagePanel, //
      },
      {
        path: 'sendlocation', //
        name: 'sendLocation', //
        component: SendLocationPanel, //
      },
      {
        path: 'contactinfo', //
        name: 'contactInfo', //
        component: GetContactInfoPanel, //
      },
      {
        path: 'setstatus', //
        name: 'setStatus', //
        component: SetStatusPanel, //
      },
      {
        path: 'bulksend', //
        name: 'bulkSend', //
        component: BulkSendPanel, //
      }
    ]
  },
  // Fallback route - redirect to login if no other route matches and not authenticated,
  // or to home if authenticated and route doesn't match.
  { 
    path: '/:pathMatch(.*)*', 
    redirect: to => {
      const authStore = useAuthStore();
      return authStore.isAuthenticated ? { name: 'home' } : { name: 'login' };
    }
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // For clean URLs //
  routes
}); //

// Navigation Guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore(); // Get store instance inside the guard

  // Attempt to initialize auth state if it hasn't been (e.g., on page refresh)
  // This relies on checkAuthStatus being synchronous or a flag being set after it runs.
  // For simplicity, we assume token is in localStorage if authenticated.
  if (!authStore.isAuthenticated && localStorage.getItem('authToken')) {
     authStore.checkAuthStatus(); // Re-hydrate state
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest);

  if (requiresAuth && !authStore.isAuthenticated) {
    // Needs auth, but user is not authenticated
    next({ name: 'login', query: { redirect: to.fullPath } }); // Redirect to login, save intended destination
  } else if (requiresGuest && authStore.isAuthenticated) {
    // Guest-only route (like login), but user is authenticated
    next({ name: 'home' }); // Redirect to dashboard
  } else {
    // Otherwise, allow navigation
    next();
  }
});

export default router; //
