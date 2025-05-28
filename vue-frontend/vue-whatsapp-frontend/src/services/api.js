// src/services/api.js
const BASE_URL = 'http://43.134.142.240:3000'; // <--- !!! IMPORTANT: SET THIS TO YOUR BACKEND URL

/**
 * Generic request helper function.
 * @param {string} endpoint - The API endpoint (e.g., '/sessions').
 * @param {object} options - Fetch options (method, body, headers, etc.).
 * @returns {Promise<object>} - The JSON response or an error object.
 */
async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    
    const headers = { ...options.headers };
    if (!(options.body instanceof FormData)) { // Don't set Content-Type for FormData
        headers['Content-Type'] = 'application/json';
    }

    const config = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(url, config);
        const contentType = response.headers.get("content-type");
        let responseData;

        if (contentType && contentType.indexOf("application/json") !== -1) {
            responseData = await response.json();
        } else {
            responseData = await response.text(); 
        }

        if (!response.ok) {
            const errorMessage = (typeof responseData === 'object' && responseData && responseData.error) 
                                 ? responseData.error 
                                 : (typeof responseData === 'string' && responseData ? responseData : `HTTP error! Status: ${response.status}`);
            console.error(`API Error for ${endpoint}: ${response.status} - ${errorMessage}`);
            return { success: false, error: errorMessage, status: response.status, data: responseData };
        }

        if (typeof responseData === 'object' && responseData !== null) {
            return responseData.success !== undefined ? responseData : { success: true, ...responseData };
        } else {
            return { success: true, data: responseData };
        }
    } catch (error) {
        console.error(`Network Error or API request failed for ${endpoint}:`, error);
        return { success: false, error: error.message || 'Network error or request failed.' };
    }
}

// --- Session Management API Calls ---
export const initSessionApi = (sessionId) => {
    return request(`/session/init/${sessionId}`, { method: 'POST' });
};

export const getSessionsApi = () => {
    return request('/sessions');
};

export const removeSessionApi = (sessionId) => {
    return request(`/session/remove/${sessionId}`, { method: 'POST' });
};

// --- Feature-Specific API Calls ---
export const sendMessageApi = (sessionId, recipient, message) => {
    return request(`/session/send-message/${sessionId}`, {
        method: 'POST',
        body: JSON.stringify({ number: recipient, message: message }),
    });
};

export const sendImageApi = (sessionId, formData) => {
    return request(`/session/send-image/${sessionId}`, { 
        method: 'POST', 
        body: formData 
    });
};

export const getChatsApi = (sessionId) => {
    return request(`/session/chats/${sessionId}`);
};

export const getContactInfoApi = (sessionId, contactId) => {
    return request(`/session/contact-info/${sessionId}/${encodeURIComponent(contactId)}`);
};

export const sendLocationApi = (sessionId, recipient, latitude, longitude, description) => {
    return request(`/session/send-location/${sessionId}`, {
        method: 'POST',
        body: JSON.stringify({ 
            number: recipient, 
            latitude: parseFloat(latitude), 
            longitude: parseFloat(longitude), 
            description: description 
        }),
    });
};

export const setStatusApi = (sessionId, statusMessage) => {
    return request(`/session/set-status/${sessionId}`, {
        method: 'POST',
        body: JSON.stringify({ statusMessage }),
    });
};

// Function for "sendStateTyping"
export const sendTypingStateApi = (sessionId, chatId) => {
    return request(`/session/${sessionId}/chat/${chatId}/send-typing`, {
        method: 'POST',
    });
};

// Function for "sendSeen" - THIS WAS LIKELY THE MISSING ONE
export const sendSeenApi = (sessionId, chatId) => {
    return request(`/session/${sessionId}/chat/${chatId}/send-seen`, {
        method: 'POST',
    });
};

// Function for "sendPresenceAvailable"
export const setPresenceOnlineApi = (sessionId) => {
    return request(`/session/${sessionId}/set-presence-online`, {
        method: 'POST',
    });
};

// Note: For "Bulk Send", the frontend iterates and calls sendMessageApi or sendImageApi repeatedly.
// No dedicated bulk send API endpoint in this service file itself.
