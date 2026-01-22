// API Configuration
const CONFIG = {
    // Development - Yerel test için
    development: {
        API_URL: 'http://localhost:3000'
    },
    // Production - Deploy edildikten sonra güncelle
    production: {
        API_URL: 'https://pide-otagi-menu.onrender.com'
    }
};

// Environment detection
const environment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'development'
    : 'production';

// Export the API base URL (without /api suffix - we add it in the endpoints)
const API_BASE_URL = CONFIG[environment].API_URL;
