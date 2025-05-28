// src/stores/authStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { loginApi as performLoginApi } from '@/services/api.js'; // UPDATED PATH
import router from '../router';
import { initializeSocket, getSocket, disconnectSocket } from '../services/socket';

export const useAuthStore = defineStore('auth', () => {
    const token = ref(localStorage.getItem('authToken') || null);
    const user = ref(JSON.parse(localStorage.getItem('authUser')) || null);
    const isAuthenticated = computed(() => !!token.value);
    const loginError = ref(null);
    const isLoading = ref(false);

    function setAuthData(userData, authToken) {
        user.value = userData;
        token.value = authToken;
        localStorage.setItem('authUser', JSON.stringify(userData));
        localStorage.setItem('authToken', authToken);
        loginError.value = null;
        disconnectSocket();
        initializeSocket();
    }

    function clearAuthData() {
        user.value = null;
        token.value = null;
        localStorage.removeItem('authUser');
        localStorage.removeItem('authToken');
        loginError.value = null;
        disconnectSocket();
    }

    async function login(credentials) {
        isLoading.value = true;
        loginError.value = null;
        try {
            const response = await performLoginApi(credentials);
            if (response.success && response.token) {
                setAuthData(response.user, response.token);
                await router.push('/');
                return true;
            } else {
                loginError.value = response.error || 'Login failed. Please check your credentials.';
                clearAuthData();
                return false;
            }
        } catch (error) {
            console.error('Login API call failed:', error);
            loginError.value = error.message || 'An unexpected error occurred during login.';
            clearAuthData();
            return false;
        } finally {
            isLoading.value = false;
        }
    }

    function logout() {
        clearAuthData();
        router.push('/login');
    }

    function checkAuthStatus() {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('authUser');
        if (storedToken && storedUser) {
            token.value = storedToken;
            user.value = JSON.parse(storedUser);
            if (!getSocket() || !getSocket().connected) {
                 initializeSocket();
            }
        } else {
            clearAuthData();
        }
    }

    return {
        token,
        user,
        isAuthenticated,
        loginError,
        isLoading,
        login,
        logout,
        checkAuthStatus,
        setAuthData,
        clearAuthData
    };
});
