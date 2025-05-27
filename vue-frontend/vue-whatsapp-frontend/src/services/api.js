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
    
    // Default headers, but don't set Content-Type if body is FormData
    const headers = { ...options.headers };
    if (!(options.body instanceof FormData)) {
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

        // Try to parse as JSON if appropriate, otherwise get text
        if (contentType && contentType.indexOf("application/json") !== -1) {
            responseData = await response.json();
        } else {
            responseData = await response.text(); // Fallback for non-JSON or empty responses
        }

        if (!response.ok) {
            // Try to extract a more specific error message from the responseData
            const errorMessage = (typeof responseData === 'object' && responseData && responseData.error) 
                                 ? responseData.error 
                                 : (typeof responseData === 'string' && responseData ? responseData : `HTTP error! Status: ${response.status}`);
            console.error(`API Error for ${endpoint}: ${response.status} - ${errorMessage}`);
            return { success: false, error: errorMessage, status: response.status, data: responseData };
        }

        // If response is OK, ensure a consistent structure for the return value
        if (typeof responseData === 'object' && responseData !== null) {
            // If 'success' property already exists, return as is.
            // Otherwise, assume success and wrap if it's not already in our expected format.
            return responseData.success !== undefined ? responseData : { success: true, ...responseData };
        } else {
            // For text responses or other types on success
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
    return request('/sessions'); // GET is default method in our helper if not specified
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

// For sendImageApi, FormData handles its own Content-Type.
// The 'request' helper is modified to not set Content-Type if body is FormData.
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

// Note: For "Bulk Send", the frontend iterates and calls sendMessageApi or sendImageApi repeatedly.
// There isn't a dedicated bulk send API endpoint in this service file,
// as per your clarification that the frontend handles the loop.

// You can add more API functions here as you implement more features.
