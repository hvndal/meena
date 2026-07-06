import * as THREE from 'three';
import OpeningScene from './scenes/OpeningScene.js';
import LakeScene from './scenes/LakeScene.js';
import RockGardenScene from './scenes/RockGardenScene.js';
import CapitolScene from './scenes/CapitolScene.js';
import CityNightScene from './scenes/CityNightScene.js';
import GardenScene from './scenes/GardenScene.js';
import FoodScene from './scenes/FoodScene.js';
import EndingScene from './scenes/EndingScene.js';

export default class SceneManager {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();

        // Light, tranquil fog (matching --bg-light #fdfaf6)
        this.scene.fog = new THREE.FogExp2(0xfdfaf6, 0.015);

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Light background
        this.renderer.setClearColor(0xfdfaf6, 1);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        this.setupGlobalLighting();

        this.scenes = [];
    }

    setupGlobalLighting() {
        // Soft, bright ambient light for a serene feel
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Warm sunlight
        this.mainLight = new THREE.DirectionalLight(0xfff5e6, 0.8);
        this.mainLight.position.set(50, 100, 50);
        this.mainLight.castShadow = true;
        this.mainLight.shadow.mapSize.width = 2048;
        this.mainLight.shadow.mapSize.height = 2048;
        this.mainLight.shadow.camera.near = 0.5;
        this.mainLight.shadow.camera.far = 500;
        // Soften shadows for tranquil look
        this.mainLight.shadow.bias = -0.0005;
        this.scene.add(this.mainLight);
    }

    buildScenes() {
        this.scenes.push(new OpeningScene(this.scene, { zOffset: 0 }));
        this.scenes.push(new LakeScene(this.scene, { zOffset: -100 }));
        this.scenes.push(new RockGardenScene(this.scene, { zOffset: -200 }));
        this.scenes.push(new CapitolScene(this.scene, { zOffset: -300 }));
        this.scenes.push(new CityNightScene(this.scene, { zOffset: -400 }));
        this.scenes.push(new GardenScene(this.scene, { zOffset: -500 }));
        this.scenes.push(new FoodScene(this.scene, { zOffset: -600 }));
        this.scenes.push(new EndingScene(this.scene, { zOffset: -700 }));
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    update(time) {
        this.scenes.forEach(s => {
            if(s.update) s.update(time);
        });
        this.renderer.render(this.scene, this.camera);
    }
}
