import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css' 
import { initializeSocket } from './services/socket';

const app = createApp(App)
app.use(createPinia()) 
const socket = initializeSocket(); 
window.socketInstance = socket; // Make accessible globally for components if needed
app.use(router)
app.mount('#app')
