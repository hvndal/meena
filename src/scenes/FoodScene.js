import * as THREE from 'three';

export default class FoodScene {
    constructor(scene, options) {
        this.scene = scene;
        this.zOffset = options.zOffset || 0;
        this.group = new THREE.Group();
        this.group.position.z = this.zOffset;
        this.scene.add(this.group);

        this.createFloatingDishes();
        this.createSteam();
    }

    createFloatingDishes() {
        this.dishes = [];

        // Materials representing rich food colors (saffron, herbs, cream)
        const materials = [
            new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.3, metalness: 0.2 }), // Saffron
            new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.4, metalness: 0.1 }), // Herbs
            new THREE.MeshStandardMaterial({ color: 0xffffee, roughness: 0.2, metalness: 0.5 })  // Cream/Paneer
        ];

        // Geometries representing plates/bowls/ingredients
        const geometries = [
            new THREE.TorusGeometry(2, 0.5, 16, 32),
            new THREE.CylinderGeometry(2, 1.5, 1, 32),
            new THREE.SphereGeometry(1.5, 32, 32)
        ];

        for(let i=0; i<6; i++) {
            const geo = geometries[i % geometries.length];
            const mat = materials[i % materials.length];

            const mesh = new THREE.Mesh(geo, mat);

            // Distribute in a floating ring
            const angle = (i / 6) * Math.PI * 2;
            const radius = 8;
            mesh.position.set(
                Math.cos(angle) * radius,
                Math.random() * 4 - 2,
                Math.sin(angle) * radius
            );

            mesh.castShadow = true;
            mesh.receiveShadow = true;

            this.group.add(mesh);
            this.dishes.push({
                obj: mesh,
                baseY: mesh.position.y,
                offset: Math.random() * Math.PI * 2,
                rotSpeed: {
                    x: Math.random() * 0.02 - 0.01,
                    y: Math.random() * 0.02 - 0.01,
                    z: Math.random() * 0.02 - 0.01
                }
            });
        }
    }

    createSteam() {
        // Soft particles rising
        const particleCount = 200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 15;
            positions[i+1] = Math.random() * 10 - 5;
            positions[i+2] = (Math.random() - 0.5) * 15;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1.5,
            transparent: true,
            opacity: 0.1,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.steam = new THREE.Points(geometry, material);
        this.group.add(this.steam);
    }

    update(time) {
        // Float and rotate dishes
        this.dishes.forEach(dish => {
            dish.obj.position.y = dish.baseY + Math.sin(time + dish.offset) * 1.5;
            dish.obj.rotation.x += dish.rotSpeed.x;
            dish.obj.rotation.y += dish.rotSpeed.y;
            dish.obj.rotation.z += dish.rotSpeed.z;
        });

        // Rise steam
        if(this.steam) {
            const positions = this.steam.geometry.attributes.position.array;
            for(let i=0; i<positions.length/3; i++) {
                positions[i*3+1] += 0.05; // Move up
                if(positions[i*3+1] > 10) {
                    positions[i*3+1] = -5; // Reset to bottom
                }
            }
            this.steam.geometry.attributes.position.needsUpdate = true;
        }
    }
}
