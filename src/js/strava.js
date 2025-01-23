// Strava API Integration
class StravaIntegration {
    constructor(clientId, clientSecret) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.redirectUri = window.location.origin + '/auth';
        this.scope = 'read,activity:read';
        this.tokenExpirationBuffer = 600; // 10 minutes in seconds
    }

    // Initialize Strava authentication
    initAuth() {
        const authUrl = `https://www.strava.com/oauth/authorize?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&response_type=code&scope=${this.scope}`;
        return authUrl;
    }

    // Handle authentication callback
    async handleAuthCallback(code) {
        try {
            const response = await this.tokenExchange(code, 'authorization_code');
            this.saveTokens(response);
            return response;
        } catch (error) {
            console.error('Error authenticating with Strava:', error);
            throw error;
        }
    }

    // Token exchange helper
    async tokenExchange(code, grantType) {
        const response = await fetch('https://www.strava.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: this.clientId,
                client_secret: this.clientSecret,
                code: code,
                grant_type: grantType,
                refresh_token: grantType === 'refresh_token' ? code : undefined
            }),
        });
        return await response.json();
    }

    // Save tokens securely
    saveTokens(tokenData) {
        const tokens = {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresAt: Date.now() + (tokenData.expires_in * 1000)
        };
        // Use secure storage method (e.g., encrypted localStorage or secure cookie)
        localStorage.setItem('strava_tokens', JSON.stringify(tokens));
    }

    // Get valid access token
    async getValidAccessToken() {
        const tokens = JSON.parse(localStorage.getItem('strava_tokens'));
        
        if (!tokens) {
            throw new Error('No tokens found. User needs to authenticate.');
        }

        // Check if token needs refresh
        if (Date.now() >= tokens.expiresAt - (this.tokenExpirationBuffer * 1000)) {
            const refreshed = await this.tokenExchange(tokens.refreshToken, 'refresh_token');
            this.saveTokens(refreshed);
            return refreshed.access_token;
        }

        return tokens.accessToken;
    }

    // Fetch user activities
    async getActivities(params = {}) {
        try {
            const accessToken = await this.getValidAccessToken();
            const queryParams = new URLSearchParams(params).toString();
            const response = await fetch(
                `https://www.strava.com/api/v3/athlete/activities?${queryParams}`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                }
            );
            return await response.json();
        } catch (error) {
            console.error('Error fetching activities:', error);
            throw error;
        }
    }

    // Get activity details
    async getActivityDetails(activityId) {
        try {
            const accessToken = await this.getValidAccessToken();
            const response = await fetch(
                `https://www.strava.com/api/v3/activities/${activityId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                }
            );
            return await response.json();
        } catch (error) {
            console.error('Error fetching activity details:', error);
            throw error;
        }
    }
}
