// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'

// Import your feature panel components which will now act as views
import SendTextPanel from '../components/features/SendTextPanel.vue'
import SendImagePanel from '../components/features/SendImagePanel.vue'
import SendLocationPanel from '../components/features/SendLocationPanel.vue'
import GetContactInfoPanel from '../components/features/GetContactInfoPanel.vue'
import SetStatusPanel from '../components/features/SetStatusPanel.vue'
import BulkSendPanel from '../components/features/BulkSendPanel.vue'
// ChatsPanel and MessageLogPanel might be part of a more complex chat view later
// For now, let's make a placeholder for where the main interaction might happen
import SessionActivePlaceholder from '../components/features/SessionActivePlaceholder.vue'


const routes = [
  {
    path: '/',
    name: 'home', // Or 'sessions-dashboard'
    component: DashboardView,
    // Children routes will be rendered inside DashboardView's <router-view>
    // We'll assume session selection happens, and then features are chosen for that session.
    // The sessionId can be a route param or managed by Pinia store primarily.
    // For now, let's make feature panels children of a generic "session interaction" route
    // or directly children of the dashboard if the session ID is globally managed by Pinia.
    // Let's make DashboardView the main container and it will show feature panels based on hash/internal state for now,
    // OR we can have a child <router-view> inside DashboardView.
    // The user wants distinct URLs like /sendtext, so let's assume DashboardView has a <router-view>
    // for its right panel.
    children: [
      {
        path: '', // Default child for the dashboard when a session is active
        name: 'sessionActiveHome',
        component: SessionActivePlaceholder, // A component saying "Select a feature"
      },
      {
        path: 'sendtext', // Will be reached via /#/sendtext (if hash mode) or /sendtext (if history mode & server configured)
        name: 'sendText',
        component: SendTextPanel,
      },
      {
        path: 'sendimage',
        name: 'sendImage',
        component: SendImagePanel,
      },
      {
        path: 'sendlocation',
        name: 'sendLocation',
        component: SendLocationPanel,
      },
      {
        path: 'contactinfo',
        name: 'contactInfo',
        component: GetContactInfoPanel,
      },
      {
        path: 'setstatus',
        name: 'setStatus',
        component: SetStatusPanel,
      },
      {
        path: 'bulksend',
        name: 'bulkSend',
        component: BulkSendPanel,
      }
      // Add routes for Chats and MessageLog if they become distinct views
    ]
  },
  // Fallback route if needed
  // { path: '/:pathMatch(.*)*', redirect: '/' }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // For clean URLs (requires server config)
  // OR for simpler server setup without needing rewrites:
  // history: createWebHashHistory(import.meta.env.BASE_URL), // For URLs like /#/sendtext
  routes
});

export default router;
