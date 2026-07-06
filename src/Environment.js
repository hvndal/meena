import * as THREE from 'three';

export default class Environment {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;

        // Base Vancouver Fog (cool grey/blue)
        this.baseFogColor = new THREE.Color(0x0f172a); // Slate 900
        this.scene.fog = new THREE.FogExp2(this.baseFogColor, 0.008);

        this.createLighting();
        this.createRain();
        this.createClouds();

        this.isRaining = false;
        this.isNight = false;

        // Dynamic properties
        this.timeOfDay = 0; // 0 to 1
    }

    createLighting() {
        // Ambient
        this.ambientLight = new THREE.AmbientLight(0x1e293b, 0.4); // Slate 800
        this.scene.add(this.ambientLight);

        // Directional (Sun/Moon)
        this.mainLight = new THREE.DirectionalLight(0xbae6fd, 1.2); // Sky 200
        this.mainLight.position.set(50, 100, -50);
        this.mainLight.castShadow = true;
        this.mainLight.shadow.mapSize.width = 2048;
        this.mainLight.shadow.mapSize.height = 2048;
        this.mainLight.shadow.camera.near = 0.5;
        this.mainLight.shadow.camera.far = 500;
        this.mainLight.shadow.bias = -0.0005;
        this.scene.add(this.mainLight);
    }

    createRain() {
        const particleCount = 10000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            positions[i*3] = (Math.random() - 0.5) * 200;
            positions[i*3+1] = Math.random() * 100;
            positions[i*3+2] = (Math.random() - 0.5) * 200;
            velocities.push(0);
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0x94a3b8, // Slate 400
            size: 0.1,
            transparent: true,
            opacity: 0.6
        });

        this.rain = new THREE.Points(geometry, material);
        // Don't add to scene until it's actually raining
    }

    createClouds() {
        const particleCount = 200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            positions[i*3] = (Math.random() - 0.5) * 500;
            positions[i*3+1] = 80 + Math.random() * 40; // High in sky
            positions[i*3+2] = (Math.random() - 0.5) * 500;
            sizes[i] = Math.random() * 50 + 20;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Note: Using soft point sprite for clouds
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 32, 32);

        const cloudTexture = new THREE.CanvasTexture(canvas);

        const material = new THREE.PointsMaterial({
            color: 0x94a3b8, // Slate 400
            size: 40,
            map: cloudTexture,
            transparent: true,
            opacity: 0.2,
            depthWrite: false
        });

        this.clouds = new THREE.Points(geometry, material);
        this.scene.add(this.clouds);
    }

    applyWeather(weatherData) {
        if(!weatherData) return;

        const code = weatherData.weathercode;
        // WMO Weather interpretation codes
        // 51-67, 80-82: Rain/Drizzle
        if (code >= 51 && code <= 82) {
            this.isRaining = true;
            this.scene.add(this.rain);
            this.scene.fog.density = 0.03; // Thicker fog in rain
        }

        // is_day: 0 for night, 1 for day
        if (weatherData.is_day === 0) {
            this.setNightMode();
        } else {
            this.setDayMode();
        }
    }

    setNightMode() {
        this.isNight = true;
        this.renderer.setClearColor(0x020617); // Slate 950
        this.scene.fog.color.setHex(0x020617);
        this.ambientLight.intensity = 0.1;
        this.mainLight.intensity = 0.3;
        this.mainLight.color.setHex(0x38bdf8); // Moonlight blue
    }

    setDayMode() {
        this.isNight = false;
        this.renderer.setClearColor(0x0f172a); // Slate 900
        this.scene.fog.color.setHex(0x0f172a);
        this.ambientLight.intensity = 0.4;
        this.mainLight.intensity = 1.2;
        this.mainLight.color.setHex(0xbae6fd);
    }

    update(delta) {
        if (this.clouds) {
            const positions = this.clouds.geometry.attributes.position.array;
            for(let i=0; i<positions.length/3; i++) {
                positions[i*3] += 1 * delta; // move x
                if (positions[i*3] > 250) {
                    positions[i*3] = -250; // wrap around
                }
            }
            this.clouds.geometry.attributes.position.needsUpdate = true;
        }

        if (this.isRaining && this.rain) {
            const positions = this.rain.geometry.attributes.position.array;
            for(let i=0; i<positions.length/3; i++) {
                // Fall downwards
                positions[i*3+1] -= 0.5 + Math.random() * 0.1;
                // Wind effect
                positions[i*3] -= 0.1;

                // Reset to top
                if(positions[i*3+1] < 0) {
                    positions[i*3+1] = 100;
                    positions[i*3] = (Math.random() - 0.5) * 200;
                }
            }
            this.rain.geometry.attributes.position.needsUpdate = true;
        }
    }
}
