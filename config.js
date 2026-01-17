// API Configuration
const CONFIG = {
    // Development - Yerel test için
    development: {
        API_URL: 'http://localhost:3000/api'
    },
    // Production - Deploy edildikten sonra güncelle
    production: {
        API_URL: 'https://pide-otagi-menu.onrender.com/api'
    }
};

// Environment detection
const environment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'development'
    : 'production';

// Export current config
const API_CONFIG = CONFIG[environment];
