import * as THREE from 'three';

export default class CityNightScene {
    constructor(scene, options) {
        this.scene = scene;
        this.zOffset = options.zOffset || 0;
        this.group = new THREE.Group();
        this.group.position.z = this.zOffset;
        this.scene.add(this.group);

        this.createPlaza();
        this.createAccents();
        this.createTrafficParticles();
    }

    createPlaza() {
        // Bright polished concrete floor
        const floorGeo = new THREE.PlaneGeometry(80, 80);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0xeeeeee,
            roughness: 0.2,
            metalness: 0.1
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.group.add(floor);

        // Building blocks (Stores/Plaza) in light tones
        const bldgMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
        for(let i=0; i<10; i++) {
            const width = Math.random() * 10 + 5;
            const height = Math.random() * 15 + 5;
            const depth = Math.random() * 10 + 5;

            const bldgGeo = new THREE.BoxGeometry(width, height, depth);
            const bldg = new THREE.Mesh(bldgGeo, bldgMat);

            const x = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 20 + 15);
            const z = (Math.random() - 0.5) * 60;

            bldg.position.set(x, height/2, z);
            bldg.castShadow = true;
            bldg.receiveShadow = true;
            this.group.add(bldg);
        }
    }

    createAccents() {
        this.accentMaterials = [];
        // Soft pastel 'neon' for the light theme
        const colors = [0xd88fa3, 0x8fc2d8, 0xd8c88f];

        for(let i=0; i<15; i++) {
            const geo = new THREE.BoxGeometry(
                Math.random() > 0.5 ? 0.2 : Math.random() * 5 + 2,
                Math.random() > 0.5 ? 0.2 : Math.random() * 5 + 2,
                0.2
            );

            const mat = new THREE.MeshBasicMaterial({
                color: colors[Math.floor(Math.random() * colors.length)],
                transparent: true,
                opacity: 0.8
            });
            this.accentMaterials.push(mat);

            const accent = new THREE.Mesh(geo, mat);
            accent.position.set(
                (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 15 + 10),
                Math.random() * 10 + 2,
                (Math.random() - 0.5) * 50
            );

            const light = new THREE.PointLight(mat.color, 0.5, 15);
            accent.add(light);

            this.group.add(accent);
        }
    }

    createTrafficParticles() {
        const particleCount = 150;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        const softRed = new THREE.Color(0xd88fa3); // Pinkish red
        const softWhite = new THREE.Color(0x8fc2d8); // Light blueish white

        for (let i = 0; i < particleCount; i++) {
            positions[i*3] = (Math.random() - 0.5) * 10;
            positions[i*3+1] = 0.5;
            positions[i*3+2] = (Math.random() - 0.5) * 60;

            const isTailLight = Math.random() > 0.5;
            const c = isTailLight ? softRed : softWhite;
            colors[i*3] = c.r;
            colors[i*3+1] = c.g;
            colors[i*3+2] = c.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.8,
            vertexColors: true,
            transparent: true,
            opacity: 0.7,
            blending: THREE.NormalBlending
        });

        this.traffic = new THREE.Points(geometry, material);
        this.group.add(this.traffic);
    }

    update(time) {
        this.accentMaterials.forEach((mat, i) => {
            if(Math.random() > 0.99) {
                mat.opacity = Math.random() * 0.5 + 0.3;
            }
        });

        if(this.traffic) {
            const positions = this.traffic.geometry.attributes.position.array;
            const colors = this.traffic.geometry.attributes.color.array;
            for(let i=0; i<positions.length/3; i++) {
                // If it's the pinkish red (tail light), it goes one way
                const isTail = colors[i*3] > 0.8 && colors[i*3+1] < 0.6;
                const speed = isTail ? 0.3 : -0.3;

                positions[i*3+2] += speed;

                if(positions[i*3+2] > 30) positions[i*3+2] = -30;
                if(positions[i*3+2] < -30) positions[i*3+2] = 30;
            }
            this.traffic.geometry.attributes.position.needsUpdate = true;
        }
    }
}
