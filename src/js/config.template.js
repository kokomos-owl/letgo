// Rename this file to config.js and fill in your credentials
const config = {
    strava: {
        clientId: 'YOUR_CLIENT_ID',
        clientSecret: 'YOUR_CLIENT_SECRET',
        refreshToken: 'YOUR_REFRESH_TOKEN',
        accessToken: 'YOUR_ACCESS_TOKEN'
    },
    mapbox: {
        accessToken: 'YOUR_MAPBOX_ACCESS_TOKEN'
    }
};

// Export the config object
if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
}
