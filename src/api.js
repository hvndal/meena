// api.js - Handle external data fetching

// Mapillary Token from env
const MAPILLARY_TOKEN = import.meta.env.VITE_MAPILLARY_TOKEN;

/**
 * Fetch Wikipedia summary for a given title
 */
export async function fetchWikiInfo(title) {
    try {
        const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Wiki fetch failed: ${response.status} ${response.statusText}`);
        const data = await response.json();
        return {
            extract: data.extract,
            thumbnail: data.thumbnail?.source || null,
            url: data.content_urls?.desktop?.page || null
        };
    } catch (error) {
        console.error("Wikipedia API Error:", error);
        return null;
    }
}

function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // metres
    const phi1 = lat1 * Math.PI/180; // phi, lambda in radians
    const phi2 = lat2 * Math.PI/180;
    const deltaPhi = (lat2-lat1) * Math.PI/180;
    const deltaLambda = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // in metres
}

function getBoundingBox(lng, lat, radiusInMeters) {
    // 1 deg of latitude is ~111,111 meters
    // 1 deg of longitude is ~111,111 * cos(latitude) meters
    const latOffset = radiusInMeters / 111111;
    const lngOffset = radiusInMeters / (111111 * Math.cos(lat * (Math.PI / 180)));

    return `${lng - lngOffset},${lat - latOffset},${lng + lngOffset},${lat + latOffset}`;
}

/**
 * Fetch closest Mapillary image ID for a coordinate
 */
export async function fetchMapillaryImage(lng, lat) {
    if (!MAPILLARY_TOKEN) {
        console.warn("No Mapillary token found in env.");
        return null;
    }

    const radii = [250, 500, 1000];

    for (const radius of radii) {
        try {
            const bbox = getBoundingBox(lng, lat, radius);
            const url = `https://graph.mapillary.com/images?fields=id,computed_geometry,captured_at&bbox=${bbox}&limit=100&access_token=${MAPILLARY_TOKEN}`;

            const response = await fetch(url);
            if (!response.ok) throw new Error(`Mapillary fetch failed: ${response.status} ${response.statusText}`);

            const data = await response.json();
            if (data.data && data.data.length > 0) {
                let closestImage = null;
                let minDistance = Infinity;

                for (const img of data.data) {
                    const imgLng = img.computed_geometry.coordinates[0];
                    const imgLat = img.computed_geometry.coordinates[1];
                    const distance = haversineDistance(lat, lng, imgLat, imgLng);

                    if (distance < minDistance) {
                        minDistance = distance;
                        closestImage = img;
                    }
                }

                if (closestImage) {
                    return {
                        id: closestImage.id,
                        date: closestImage.captured_at,
                        url: `https://graph.mapillary.com/${closestImage.id}/thumb_1024?access_token=${MAPILLARY_TOKEN}`,
                        distance: Math.round(minDistance)
                    };
                }
            }
        } catch (error) {
            console.error("Mapillary API Error:", error);
            // Continue to next radius
        }
    }

    return null;
}

/**
 * Fetch current weather for Vancouver (49.2827, -123.1207)
 */
export async function fetchVancouverWeather() {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=49.2827&longitude=-123.1207&current_weather=true`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Weather fetch failed: ${response.status} ${response.statusText}`);
        const data = await response.json();
        return data.current_weather;
    } catch (error) {
        console.error("Weather API Error:", error);
        return null;
    }
}
