import './style.css';
import gsap from 'gsap';
import SceneManager from './SceneManager.js';
import CameraController from './CameraController.js';
import { fetchWikiInfo, fetchMapillaryImage, fetchVancouverWeather } from './api.js';
import * as THREE from 'three';

class App {
    constructor() {
        this.init();
    }

    async init() {
        this.loader = document.getElementById('loader');
        this.loaderProgress = document.querySelector('.loader-progress');

        // Setup Three.js
        this.sceneManager = new SceneManager(document.getElementById('canvas-container'));
        this.cameraController = new CameraController(this.sceneManager.camera, this.sceneManager.scene);

        // Simulate loading assets
        await this.loadAssets();

        // Remove Loader
        gsap.to(this.loader, { opacity: 0, duration: 1, onComplete: () => this.loader.style.display = 'none' });

        this.setupInteraction();
        this.updateWeather();

        // Clock for delta time
        this.clock = new THREE.Clock();

        this.update();
        window.addEventListener('resize', this.onResize.bind(this));
    }

    async loadAssets() {
        for(let i = 0; i <= 100; i += 20) {
            this.loaderProgress.style.width = `${i}%`;
            await new Promise(r => setTimeout(r, 100));
        }
    }

    async updateWeather() {
        const weather = await fetchVancouverWeather();
        if(weather) {
            document.querySelector('.weather-temp').textContent = `${weather.temperature}°C`;
            document.querySelector('.weather-desc').textContent = weather.is_day ? 'Day' : 'Night';

            this.sceneManager.environment.applyWeather(weather);
        }
    }

    setupInteraction() {
        const tooltip = document.getElementById('tooltip');
        const infoPanel = document.getElementById('info-panel');
        let hoveredMarker = null;

        // Reset Button
        document.getElementById('btn-reset-cam').addEventListener('click', () => {
            this.cameraController.reset();
            infoPanel.classList.remove('open');
        });

        // Close panel
        document.getElementById('close-panel').addEventListener('click', () => {
            infoPanel.classList.remove('open');
            this.cameraController.reset();
        });

        // Mouse Move (Tooltip)
        window.addEventListener('mousemove', (e) => {
            const marker = this.cameraController.getIntersectedMarker(e.clientX, e.clientY, this.sceneManager.markers);

            if (marker) {
                document.body.style.cursor = 'pointer';
                tooltip.style.opacity = 1;
                tooltip.style.left = e.clientX + 'px';
                tooltip.style.top = e.clientY + 'px';
                tooltip.textContent = marker.userData.name;

                if(hoveredMarker !== marker) {
                    gsap.to(marker.scale, { x: 2, y: 2, z: 2, duration: 0.2 });
                    hoveredMarker = marker;
                }
            } else {
                document.body.style.cursor = 'default';
                tooltip.style.opacity = 0;

                if(hoveredMarker) {
                    gsap.to(hoveredMarker.scale, { x: 1, y: 1, z: 1, duration: 0.2 });
                    hoveredMarker = null;
                }
            }
        });

        // Click Handler
        window.addEventListener('click', async (e) => {
            // Ignore UI clicks
            if(e.target.closest('.ui-layer') || e.target.closest('#info-panel')) return;

            const marker = this.cameraController.getIntersectedMarker(e.clientX, e.clientY, this.sceneManager.markers);

            if (marker) {
                const data = marker.userData;

                // Fly camera to marker
                this.cameraController.flyTo(marker.position);

                // Open panel and show loading state
                infoPanel.classList.add('open');
                document.getElementById('panel-title').textContent = data.name;
                document.getElementById('panel-desc').innerHTML = '<p>Loading data...</p>';
                document.getElementById('mapillary-view').innerHTML = '<div class="no-imagery">Searching Mapillary...</div>';

                const mediaContainer = document.getElementById('landmark-media');
                mediaContainer.style.display = 'none';
                mediaContainer.innerHTML = '';

                // Add live media based on ID
                if (data.id === 'stanley_park') {
                    mediaContainer.style.display = 'block';
                    mediaContainer.innerHTML = `<iframe width="100%" height="200" src="https://www.youtube.com/embed/a4d5CbK0b3A?autoplay=1&mute=1" title="Stanley Park" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
                } else if (data.id === 'gastown') {
                    mediaContainer.style.display = 'block';
                    mediaContainer.innerHTML = `<iframe width="100%" height="200" src="https://www.youtube.com/embed/QqNMp3GHKyw?autoplay=1&mute=1" title="Gastown History" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
                } else {
                     mediaContainer.style.display = 'block';
                     mediaContainer.innerHTML = `<iframe width="100%" height="200" src="https://www.youtube.com/embed/rxyNjFKwzJA?autoplay=1&mute=1" title="Live Stream" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
                }

                // Fetch Wikipedia
                const wikiData = await fetchWikiInfo(data.name);
                if (wikiData) {
                    let html = `<p>${wikiData.extract}</p>`;
                    if(wikiData.url) html += `<br><a href="${wikiData.url}" target="_blank" style="color:var(--accent)">Read more on Wikipedia</a>`;
                    document.getElementById('panel-desc').innerHTML = html;
                } else {
                    document.getElementById('panel-desc').innerHTML = '<p>No historical data found for this location.</p>';
                }

                // Fetch Mapillary
                const mapData = await fetchMapillaryImage(data.coords.lng, data.coords.lat);
                const mapContainer = document.getElementById('mapillary-view');
                if (mapData) {
                    const date = new Date(mapData.date).toLocaleDateString();
                    mapContainer.innerHTML = `
                        <img src="${mapData.url}" alt="Street view of ${data.name}">
                        <div class="mapillary-meta">Captured: ${date} &bull; Distance: ${mapData.distance}m</div>
                    `;
                } else {
                    // Fallbacks
                    const fallbackImageUrl = wikiData && wikiData.thumbnail ? wikiData.thumbnail : 'https://images.unsplash.com/photo-1559511260-66a654ae982a?q=80&w=1024&auto=format&fit=crop';
                    const fallbackSource = wikiData && wikiData.thumbnail ? 'Official Landmark Photograph' : 'Aerial/Skyline Photography';

                    mapContainer.innerHTML = `
                        <img src="${fallbackImageUrl}" alt="${data.name}">
                        <div class="mapillary-meta">${fallbackSource}</div>
                    `;
                }
            }
        });

    }

    onResize() {
        this.sceneManager.onResize();
    }

    update() {
        requestAnimationFrame(this.update.bind(this));

        const delta = this.clock.getDelta();
        const time = this.clock.getElapsedTime();

        this.cameraController.update(delta);
        this.sceneManager.update(time, delta);
    }
}

window.onload = () => { new App(); };
