# Let Go - Trail Activity Impact Platform

A Squarespace integration that combines Strava activities with interactive maps to promote social and environmental impact through outdoor activities.

## Features
- Strava activity integration
- Interactive maps using Mapbox/Leaflet
- Social impact tracking
- Trail sponsorship system
- Activity visualization

## Setup Requirements
1. Strava API credentials
   - Client ID
   - Client Secret
2. Mapbox/Leaflet API key
3. Squarespace Developer Account

## Installation
1. Register your application with Strava
2. Set up authentication
3. Configure map integration
4. Deploy to Squarespace

## Project Structure
```
/src
  /js
    - strava.js      # Strava API integration
    - maps.js        # Map rendering and interaction
    - impact.js      # Impact tracking and visualization
  /css
    - styles.css     # Custom styles
  /templates
    - map.html       # Map template
    - activities.html # Activity display template
```

## Configuration
Create a `config.js` file with your API keys:
```javascript
const config = {
  stravaClientId: 'YOUR_CLIENT_ID',
  stravaClientSecret: 'YOUR_CLIENT_SECRET',
  mapboxToken: 'YOUR_MAPBOX_TOKEN'
};