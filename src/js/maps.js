// Map Integration using Mapbox
class MapIntegration {
    constructor(mapboxToken, containerId) {
        this.mapboxToken = mapboxToken;
        this.containerId = containerId;
        this.map = null;
        this.markers = new Map();
        this.activityLayers = new Set();
    }

    // Initialize the map
    initMap(center = [-74.5, 40], zoom = 9) {
        mapboxgl.accessToken = this.mapboxToken;
        this.map = new mapboxgl.Map({
            container: this.containerId,
            style: 'mapbox://styles/mapbox/outdoors-v12', // Updated to latest outdoors style
            center: center,
            zoom: zoom,
            maxZoom: 18
        });

        // Add essential controls
        this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        this.map.addControl(new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true
        }), 'top-right');
        
        // Initialize popup
        this.popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            maxWidth: '300px'
        });

        // Add terrain control for 3D visualization
        this.map.on('style.load', () => {
            this.map.addSource('mapbox-dem', {
                'type': 'raster-dem',
                'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
                'tileSize': 512,
                'maxzoom': 14
            });
            this.map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
        });
    }

    // Add activity to map
    async addActivity(activity) {
        if (!activity.map || !activity.map.summary_polyline) {
            console.warn('No map data available for activity:', activity.id);
            return;
        }

        const coordinates = this.decodePolyline(activity.map.summary_polyline);
        const sourceId = `route-${activity.id}`;
        const layerId = `route-${activity.id}-line`;

        // Create a GeoJSON feature for the route
        const routeGeoJSON = {
            type: 'Feature',
            properties: {
                name: activity.name,
                type: activity.type,
                distance: activity.distance,
                moving_time: activity.moving_time,
                total_elevation_gain: activity.total_elevation_gain
            },
            geometry: {
                type: 'LineString',
                coordinates: coordinates
            }
        };

        // Add source and layer if they don't exist
        if (!this.map.getSource(sourceId)) {
            this.map.addSource(sourceId, {
                type: 'geojson',
                data: routeGeoJSON
            });

            // Add the line layer
            this.map.addLayer({
                id: layerId,
                type: 'line',
                source: sourceId,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': this.getActivityColor(activity.type),
                    'line-width': 4,
                    'line-opacity': 0.8
                }
            });

            // Add interaction handlers
            this.addLayerInteraction(layerId, activity);
            this.activityLayers.add(layerId);
        }

        // Add start/end markers
        this.addActivityMarkers(coordinates, activity);
    }

    // Add interaction handlers for activity layer
    addLayerInteraction(layerId, activity) {
        // Mouse enter - highlight route and show popup
        this.map.on('mouseenter', layerId, (e) => {
            this.map.setPaintProperty(layerId, 'line-width', 6);
            
            const coordinates = e.lngLat;
            const description = this.formatActivityPopup(activity);
            
            this.popup
                .setLngLat(coordinates)
                .setHTML(description)
                .addTo(this.map);
        });

        // Mouse leave - restore route style and remove popup
        this.map.on('mouseleave', layerId, () => {
            this.map.setPaintProperty(layerId, 'line-width', 4);
            this.popup.remove();
        });

        // Click - zoom to route
        this.map.on('click', layerId, () => {
            const coordinates = this.decodePolyline(activity.map.summary_polyline);
            this.zoomToRoute(coordinates);
        });
    }

    // Add markers for activity start/end points
    addActivityMarkers(coordinates, activity) {
        if (coordinates.length < 2) return;

        const startPoint = coordinates[0];
        const endPoint = coordinates[coordinates.length - 1];

        // Create custom markers
        const startMarker = this.createMarker('start', startPoint, activity);
        const endMarker = this.createMarker('end', endPoint, activity);

        this.markers.set(`${activity.id}-start`, startMarker);
        this.markers.set(`${activity.id}-end`, endMarker);
    }

    // Create a custom marker
    createMarker(type, coordinates, activity) {
        const el = document.createElement('div');
        el.className = `marker marker-${type}`;
        
        const marker = new mapboxgl.Marker(el)
            .setLngLat(coordinates)
            .setPopup(new mapboxgl.Popup({ offset: 25 })
                .setHTML(this.formatMarkerPopup(type, activity)))
            .addTo(this.map);

        return marker;
    }

    // Format activity popup content
    formatActivityPopup(activity) {
        const distance = (activity.distance / 1000).toFixed(2);
        const duration = this.formatDuration(activity.moving_time);
        const elevation = activity.total_elevation_gain.toFixed(0);

        return `
            <div class="activity-popup">
                <h3>${activity.name}</h3>
                <p class="activity-type">${activity.type}</p>
                <div class="activity-stats">
                    <div>📏 ${distance} km</div>
                    <div>⏱️ ${duration}</div>
                    <div>⛰️ ${elevation}m gain</div>
                </div>
            </div>
        `;
    }

    // Format marker popup content
    formatMarkerPopup(type, activity) {
        return `
            <div class="marker-popup">
                <strong>${type === 'start' ? 'Start' : 'End'} Point</strong>
                <p>${activity.name}</p>
            </div>
        `;
    }

    // Get color based on activity type
    getActivityColor(type) {
        const colors = {
            'Run': '#FF4B4B',
            'Ride': '#FC4C02',
            'Hike': '#2D9CDB',
            'Walk': '#27AE60',
            'default': '#666666'
        };
        return colors[type] || colors.default;
    }

    // Format duration in HH:MM:SS
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Zoom map to show entire route
    zoomToRoute(coordinates) {
        const bounds = coordinates.reduce((bounds, coord) => {
            return bounds.extend(coord);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

        this.map.fitBounds(bounds, {
            padding: 50,
            duration: 1000
        });
    }

    // Decode polyline
    decodePolyline(str, precision = 5) {
        let index = 0,
            lat = 0,
            lng = 0,
            coordinates = [],
            shift = 0,
            result = 0,
            byte = null,
            latitude_change,
            longitude_change,
            factor = Math.pow(10, precision || 5);

        while (index < str.length) {
            byte = null;
            shift = 0;
            result = 0;

            do {
                byte = str.charCodeAt(index++) - 63;
                result |= (byte & 0x1f) << shift;
                shift += 5;
            } while (byte >= 0x20);

            latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
            shift = result = 0;

            do {
                byte = str.charCodeAt(index++) - 63;
                result |= (byte & 0x1f) << shift;
                shift += 5;
            } while (byte >= 0x20);

            longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

            lat += latitude_change;
            lng += longitude_change;

            coordinates.push([lng / factor, lat / factor]);
        }

        return coordinates;
    }

    // Clear all activities from map
    clearActivities() {
        // Remove all activity layers and sources
        this.activityLayers.forEach(layerId => {
            if (this.map.getLayer(layerId)) {
                this.map.removeLayer(layerId);
            }
            const sourceId = layerId.replace('-line', '');
            if (this.map.getSource(sourceId)) {
                this.map.removeSource(sourceId);
            }
        });
        this.activityLayers.clear();

        // Remove all markers
        this.markers.forEach(marker => marker.remove());
        this.markers.clear();
    }

    // Fit map to show all activities
    fitToActivities() {
        const bounds = new mapboxgl.LngLatBounds();
        
        // Include all activity coordinates in bounds
        this.activityLayers.forEach(layerId => {
            const sourceId = layerId.replace('-line', '');
            const source = this.map.getSource(sourceId);
            if (source) {
                const data = source._data;
                if (data && data.geometry && data.geometry.coordinates) {
                    data.geometry.coordinates.forEach(coord => {
                        bounds.extend(coord);
                    });
                }
            }
        });

        // Only fit bounds if we have activities
        if (!bounds.isEmpty()) {
            this.map.fitBounds(bounds, {
                padding: 50,
                duration: 1000
            });
        }
    }
}
