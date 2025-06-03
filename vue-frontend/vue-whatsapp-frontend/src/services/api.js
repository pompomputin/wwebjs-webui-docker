// src/services/api.js
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Generic request helper function.
 * @param {string} endpoint - The API endpoint (e.g., '/sessions').
 * @param {object} options - Fetch options (method, body, headers, etc.).
 * @param {boolean} isLogin - Flag to indicate if this is the login request itself.
 * @returns {Promise<object>} - The JSON response or an error object.
 */
async function request(endpoint, options = {}, isLogin = false) {
    const url = `${BASE_URL}${endpoint}`;
    
    const headers = { ...options.headers };

    if (!isLogin) {
        const token = localStorage.getItem('authToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    if (!(options.body instanceof FormData) && options.body) {
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

        if (response.status === 401 && !isLogin) {
            console.error('API Request Unauthorized (401). Token might be invalid or expired.');
            return { success: false, error: 'Unauthorized. Please login again.', status: response.status };
        }

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

// --- Authentication API Call ---
export const loginApi = (credentials) => {
    return request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
    }, true); 
};


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

// --- Updated function to check WhatsApp Number ---
export const checkWhatsAppNumberApi = (sessionId, numberToCheck, countryCode) => { 
    let endpoint = `/session/is-registered/${sessionId}/${encodeURIComponent(numberToCheck)}`;
    if (countryCode && String(countryCode).trim() !== "") {
        endpoint += `?countryCode=${encodeURIComponent(countryCode)}`;
    }
    return request(endpoint, { method: 'GET' });
};

// --- Feature-Specific API Calls ---

export const sendMessageApi = (sessionId, recipient, message, countryCode) => { 
    return request(`/session/send-message/${sessionId}`, {
        method: 'POST',
        body: JSON.stringify({ number: recipient, message: message, countryCode: countryCode }),
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

export const getContactInfoApi = (sessionId, contactId, countryCode) => { 
    let endpoint = `/session/contact-info/${sessionId}/${encodeURIComponent(contactId)}`;
     if (countryCode && String(countryCode).trim() !== "") {
        endpoint += `?countryCode=${encodeURIComponent(countryCode)}`;
    }
    return request(endpoint);
};

export const sendLocationApi = (sessionId, recipient, latitude, longitude, description, countryCode) => { 
    return request(`/session/send-location/${sessionId}`, {
        method: 'POST',
        body: JSON.stringify({
            number: recipient,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            description: description,
            countryCode: countryCode 
        }),
    });
};

export const setStatusApi = (sessionId, statusMessage) => {
    return request(`/session/set-status/${sessionId}`, {
        method: 'POST',
        body: JSON.stringify({ statusMessage }),
    });
};

// MODIFIED: setOnlinePresenceSettingApi (renamed from setPresenceOnlineApi to reflect its purpose of setting a setting)
export const setOnlinePresenceSettingApi = (sessionId, enabled) => {
    return request(`/session/${sessionId}/set-presence-online`, {
        method: 'POST',
        body: JSON.stringify({ enabled }), // Pass the state of the toggle
    });
};

// NEW API CALLS: For Typing Indicator Setting
export const setTypingIndicatorSettingApi = (sessionId, enabled) => {
    return request(`/session/${sessionId}/settings/typing`, {
        method: 'POST',
        body: JSON.stringify({ enabled }),
    });
};

// NEW API CALLS: For Auto Send Seen Setting
export const setAutoSendSeenSettingApi = (sessionId, enabled) => {
    return request(`/session/${sessionId}/settings/autoseen`, {
        method: 'POST',
        body: JSON.stringify({ enabled }),
    });
};

export const sendTypingStateApi = (sessionId, chatId) => {
    return request(`/session/${sessionId}/chat/${chatId}/send-typing`, {
        method: 'POST',
    });
};

export const sendSeenApi = (sessionId, chatId) => {
    return request(`/session/${sessionId}/chat/${chatId}/send-seen`, {
        method: 'POST',
    });
};

export const setPresenceOnlineApi = (sessionId) => {
    return request(`/session/${sessionId}/set-presence-online`, {
        method: 'POST',
    });
};