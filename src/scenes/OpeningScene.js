import * as THREE from 'three';

export default class OpeningScene {
    constructor(scene, options) {
        this.scene = scene;
        this.zOffset = options.zOffset || 0;
        this.group = new THREE.Group();
        this.group.position.z = this.zOffset;
        this.scene.add(this.group);

        this.createStars();
        this.createEarth();
    }

    createStars() {
        const particleCount = 2000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 100;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            transparent: true,
            opacity: 0.8
        });

        this.stars = new THREE.Points(geometry, material);
        this.group.add(this.stars);
    }

    createEarth() {
        // Stylized wireframe earth
        const geometry = new THREE.IcosahedronGeometry(8, 2);
        const material = new THREE.MeshBasicMaterial({
            color: 0x4ade80, // Neon accent
            wireframe: true,
            transparent: true,
            opacity: 0.2
        });

        this.earth = new THREE.Mesh(geometry, material);
        this.earth.position.set(0, 0, -10);
        this.group.add(this.earth);

        // Core glow
        const coreGeo = new THREE.IcosahedronGeometry(7.8, 2);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0x0a1510 });
        this.core = new THREE.Mesh(coreGeo, coreMat);
        this.earth.add(this.core);
    }

    update(time) {
        if(this.stars) {
            this.stars.rotation.y = time * 0.05;
        }
        if(this.earth) {
            this.earth.rotation.y = time * 0.1;
            this.earth.rotation.x = time * 0.05;
        }
    }
}
