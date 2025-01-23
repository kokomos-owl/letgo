const config = {
    strava: {
        clientId: '8yKzTyN186h7kmo72rFV',  // App ID from Let Go
        clientSecret: '8df6fcf32f3ee82961d7c403342570348700d67d'
    },
    mapbox: {
        accessToken: '-xTVNtOQ18DZbHoUn8YZ3i05un1zfjOTex1PwpGPIPw'
    }
};

// Export the config object
if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
}
