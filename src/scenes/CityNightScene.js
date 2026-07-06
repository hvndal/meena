import * as THREE from 'three';

export default class CityNightScene {
    constructor(scene, options) {
        this.scene = scene;
        this.zOffset = options.zOffset || 0;
        this.group = new THREE.Group();
        this.group.position.z = this.zOffset;
        this.scene.add(this.group);

        this.createPlaza();
        this.createNeonAccents();
        this.createTrafficParticles();
    }

    createPlaza() {
        // Wet reflective floor
        const floorGeo = new THREE.PlaneGeometry(80, 80);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x050505,
            roughness: 0.1, // Highly reflective
            metalness: 0.8
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.group.add(floor);

        // Building blocks (Stores/Plaza)
        const bldgMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7 });
        for(let i=0; i<10; i++) {
            const width = Math.random() * 10 + 5;
            const height = Math.random() * 15 + 5;
            const depth = Math.random() * 10 + 5;

            const bldgGeo = new THREE.BoxGeometry(width, height, depth);
            const bldg = new THREE.Mesh(bldgGeo, bldgMat);

            // Distribute around the plaza, leaving a central walkway
            const x = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 20 + 15);
            const z = (Math.random() - 0.5) * 60;

            bldg.position.set(x, height/2, z);
            this.group.add(bldg);
        }
    }

    createNeonAccents() {
        this.neonMaterials = [];
        const colors = [0x4ade80, 0xff00ff, 0x00ffff];

        for(let i=0; i<15; i++) {
            const geo = new THREE.BoxGeometry(
                Math.random() > 0.5 ? 0.2 : Math.random() * 5 + 2,
                Math.random() > 0.5 ? 0.2 : Math.random() * 5 + 2,
                0.2
            );

            const mat = new THREE.MeshBasicMaterial({
                color: colors[Math.floor(Math.random() * colors.length)]
            });
            this.neonMaterials.push(mat);

            const neon = new THREE.Mesh(geo, mat);
            neon.position.set(
                (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 15 + 10),
                Math.random() * 10 + 2,
                (Math.random() - 0.5) * 50
            );

            // Point light to create glow effect on surrounding geometry
            const light = new THREE.PointLight(mat.color, 0.5, 10);
            neon.add(light);

            this.group.add(neon);
        }
    }

    createTrafficParticles() {
        // Red and white streams representing traffic
        const particleCount = 200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            positions[i*3] = (Math.random() - 0.5) * 10; // narrow x spread
            positions[i*3+1] = 0.5; // just above ground
            positions[i*3+2] = (Math.random() - 0.5) * 60; // long z spread

            const isTailLight = Math.random() > 0.5;
            colors[i*3] = isTailLight ? 1 : 1; // R
            colors[i*3+1] = isTailLight ? 0 : 1; // G
            colors[i*3+2] = isTailLight ? 0 : 1; // B
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        this.traffic = new THREE.Points(geometry, material);
        this.group.add(this.traffic);
    }

    update(time) {
        // Blink neon lights
        this.neonMaterials.forEach((mat, i) => {
            if(Math.random() > 0.98) {
                mat.opacity = Math.random();
                mat.transparent = true;
            } else {
                mat.opacity = 1;
            }
        });

        // Move traffic
        if(this.traffic) {
            const positions = this.traffic.geometry.attributes.position.array;
            const colors = this.traffic.geometry.attributes.color.array;
            for(let i=0; i<positions.length/3; i++) {
                // Determine direction based on color (red goes one way, white the other)
                const isRed = colors[i*3+1] === 0;
                const speed = isRed ? 0.5 : -0.5;

                positions[i*3+2] += speed;

                // Wrap around
                if(positions[i*3+2] > 30) positions[i*3+2] = -30;
                if(positions[i*3+2] < -30) positions[i*3+2] = 30;
            }
            this.traffic.geometry.attributes.position.needsUpdate = true;
        }
    }
}
