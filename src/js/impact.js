// Impact Tracking and Visualization
class ImpactTracker {
    constructor() {
        this.activities = new Map();
        this.sponsors = new Map();
        this.causes = new Map();
    }

    // Add or update an activity
    trackActivity(activity) {
        this.activities.set(activity.id, {
            id: activity.id,
            type: activity.type,
            distance: activity.distance,
            movingTime: activity.moving_time,
            startDate: activity.start_date,
            impact: this.calculateImpact(activity)
        });
        this.updateTotalImpact();
    }

    // Calculate impact for a single activity
    calculateImpact(activity) {
        // Convert distance to miles (Strava provides distance in meters)
        const miles = activity.distance * 0.000621371;
        
        let impact = {
            miles: miles,
            donations: this.calculateDonations(miles),
            environmental: this.calculateEnvironmentalImpact(activity),
            social: this.calculateSocialImpact(activity)
        };

        return impact;
    }

    // Calculate donations based on miles
    calculateDonations(miles) {
        let total = 0;
        this.sponsors.forEach(sponsor => {
            total += miles * sponsor.ratePerMile;
        });
        return total;
    }

    // Calculate environmental impact
    calculateEnvironmentalImpact(activity) {
        // Example: Calculate carbon offset
        // This is a simplified calculation and should be adjusted based on actual impact metrics
        const carbonOffset = activity.distance * 0.0002; // kg CO2 saved vs driving
        return {
            carbonOffset: carbonOffset
        };
    }

    // Calculate social impact
    calculateSocialImpact(activity) {
        return {
            participationHours: activity.moving_time / 3600,
            communityEngagement: 1 // Increment community engagement counter
        };
    }

    // Add a sponsor
    addSponsor(sponsor) {
        this.sponsors.set(sponsor.id, {
            id: sponsor.id,
            name: sponsor.name,
            ratePerMile: sponsor.ratePerMile,
            totalContribution: 0
        });
    }

    // Add a cause
    addCause(cause) {
        this.causes.set(cause.id, {
            id: cause.id,
            name: cause.name,
            description: cause.description,
            goal: cause.goal,
            current: 0
        });
    }

    // Update total impact
    updateTotalImpact() {
        let totalImpact = {
            totalMiles: 0,
            totalDonations: 0,
            totalCarbonOffset: 0,
            totalParticipationHours: 0
        };

        this.activities.forEach(activity => {
            totalImpact.totalMiles += activity.impact.miles;
            totalImpact.totalDonations += activity.impact.donations;
            totalImpact.totalCarbonOffset += activity.impact.environmental.carbonOffset;
            totalImpact.totalParticipationHours += activity.impact.social.participationHours;
        });

        return totalImpact;
    }

    // Generate impact report
    generateReport() {
        const totalImpact = this.updateTotalImpact();
        return {
            activities: Array.from(this.activities.values()),
            sponsors: Array.from(this.sponsors.values()),
            causes: Array.from(this.causes.values()),
            totalImpact: totalImpact
        };
    }
}
