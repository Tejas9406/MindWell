export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

import { auth } from '../firebase';

export const authenticatedFetch = async (url, options = {}) => {
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken();
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };
    }
    return fetch(url, options);
};
