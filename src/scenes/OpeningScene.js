import * as THREE from 'three';

export default class OpeningScene {
    constructor(scene, options) {
        this.scene = scene;
        this.zOffset = options.zOffset || 0;
        this.group = new THREE.Group();
        this.group.position.z = this.zOffset;
        this.scene.add(this.group);

        this.createParticles();
        this.createEarth();
    }

    createParticles() {
        // Bright, airy particles instead of stars
        const particleCount = 1500;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 100;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0xd88fa3, // Soft light pink
            size: 0.15,
            transparent: true,
            opacity: 0.6
        });

        this.particles = new THREE.Points(geometry, material);
        this.group.add(this.particles);
    }

    createEarth() {
        // Minimalist, clean wireframe earth representing planning/design
        const geometry = new THREE.IcosahedronGeometry(8, 2);
        const material = new THREE.MeshBasicMaterial({
            color: 0x888888, // Soft grey
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });

        this.earth = new THREE.Mesh(geometry, material);
        this.earth.position.set(0, 0, -10);
        this.group.add(this.earth);

        // Solid white core
        const coreGeo = new THREE.IcosahedronGeometry(7.9, 2);
        const coreMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.2,
            metalness: 0.1
        });
        this.core = new THREE.Mesh(coreGeo, coreMat);
        this.earth.add(this.core);
    }

    update(time) {
        if(this.particles) {
            this.particles.rotation.y = time * 0.02;
            this.particles.rotation.x = time * 0.01;
        }
        if(this.earth) {
            this.earth.rotation.y = time * 0.05;
            this.earth.rotation.x = time * 0.02;
        }
    }
}
