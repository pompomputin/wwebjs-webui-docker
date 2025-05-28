// src/main.js
import { createApp } from 'vue'; //
import { createPinia } from 'pinia'; //
import App from './App.vue'; //
import router from './router'; //
import './style.css'; //
import { initializeSocket } from './services/socket'; //
import { useAuthStore } from '@/stores/authStore';

const app = createApp(App); //

app.use(createPinia()); // Initialize Pinia first

// Access the auth store *after* Pinia is initialized
const authStore = useAuthStore();
authStore.checkAuthStatus(); // Check authentication status on app load

// Initialize socket after checking auth status, so it can use the token if available
const socket = initializeSocket(); //
// window.socketInstance = socket; // You might not need it globally if managed via store/services
if (socket) {
    window.socketInstance = socket; // Only assign if socket was initialized successfully
}


app.use(router); //
app.mount('#app'); //
