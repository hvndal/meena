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
        // Add soft fog for depth and cyberpunk/luxury vibe
        this.scene.fog = new THREE.FogExp2(0x050505, 0.02);

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
        this.renderer.setClearColor(0x050505, 1);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        this.setupGlobalLighting();

        this.scenes = [];
    }

    setupGlobalLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(ambientLight);

        this.mainLight = new THREE.DirectionalLight(0xffffff, 1);
        this.mainLight.position.set(50, 100, 50);
        this.mainLight.castShadow = true;
        this.mainLight.shadow.mapSize.width = 2048;
        this.mainLight.shadow.mapSize.height = 2048;
        this.mainLight.shadow.camera.near = 0.5;
        this.mainLight.shadow.camera.far = 500;
        this.scene.add(this.mainLight);
    }

    buildScenes() {
        // Build abstract scenes sequentially along the Z axis negative direction
        // This gives the camera a linear path to travel down

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
        // Update all individual scenes (for animations, shaders)
        this.scenes.forEach(s => {
            if(s.update) s.update(time);
        });

        this.renderer.render(this.scene, this.camera);
    }
}
