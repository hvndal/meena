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
        if (!response.ok) throw new Error('Wiki fetch failed');
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

/**
 * Fetch closest Mapillary image ID for a coordinate
 */
export async function fetchMapillaryImage(lng, lat) {
    if (!MAPILLARY_TOKEN) {
        console.warn("No Mapillary token found in env.");
        return null;
    }

    try {
        // Bounding box around coordinate (~100m)
        const offset = 0.001;
        const bbox = `${lng-offset},${lat-offset},${lng+offset},${lat+offset}`;
        const url = `https://graph.mapillary.com/images?fields=id,computed_geometry,captured_at&bbox=${bbox}&limit=1&access_token=${MAPILLARY_TOKEN}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Mapillary fetch failed');

        const data = await response.json();
        if (data.data && data.data.length > 0) {
            const imgId = data.data[0].id;
            // Return high res image url directly for simplicity, or the viewer URL
            return {
                id: imgId,
                date: data.data[0].captured_at,
                // Using the 1024 thumbnail for display
                url: `https://graph.mapillary.com/${imgId}/thumb_1024?access_token=${MAPILLARY_TOKEN}`
            };
        }
        return null;
    } catch (error) {
        console.error("Mapillary API Error:", error);
        return null;
    }
}

/**
 * Fetch current weather for Vancouver (49.2827, -123.1207)
 */
export async function fetchVancouverWeather() {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=49.2827&longitude=-123.1207&current_weather=true`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Weather fetch failed');
        const data = await response.json();
        return data.current_weather;
    } catch (error) {
        console.error("Weather API Error:", error);
        return null;
    }
}
