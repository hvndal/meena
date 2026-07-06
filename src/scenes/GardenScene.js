import * as THREE from 'three';

export default class GardenScene {
    constructor(scene, options) {
        this.scene = scene;
        this.zOffset = options.zOffset || 0;
        this.group = new THREE.Group();
        this.group.position.z = this.zOffset;
        this.scene.add(this.group);

        this.createPetals();
        this.createLighting();
    }

    createPetals() {
        const instanceCount = 5000;

        // Simple curved petal geometry
        const geometry = new THREE.ConeGeometry(0.2, 0.5, 3);
        geometry.rotateX(Math.PI/2);

        const material = new THREE.MeshStandardMaterial({
            color: 0xff4466, // Rose red/pink
            roughness: 0.6,
            metalness: 0.1,
            side: THREE.DoubleSide
        });

        this.instancedMesh = new THREE.InstancedMesh(geometry, material, instanceCount);

        this.dummy = new THREE.Object3D();
        this.petalData = [];

        for (let i = 0; i < instanceCount; i++) {
            // Position petals in a wide area
            const x = (Math.random() - 0.5) * 60;
            const y = Math.random() * 15;
            const z = (Math.random() - 0.5) * 60;

            this.dummy.position.set(x, y, z);

            // Random rotation
            this.dummy.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            // Random scale
            const scale = Math.random() * 0.5 + 0.5;
            this.dummy.scale.set(scale, scale, scale);

            this.dummy.updateMatrix();
            this.instancedMesh.setMatrixAt(i, this.dummy.matrix);

            // Store data for animation
            this.petalData.push({
                x, y, z,
                rx: this.dummy.rotation.x,
                ry: this.dummy.rotation.y,
                rz: this.dummy.rotation.z,
                speed: Math.random() * 0.02 + 0.01,
                wobbleSpeed: Math.random() * 2 + 1
            });
        }

        // Add subtle color variations
        const color = new THREE.Color();
        for (let i = 0; i < instanceCount; i++) {
            color.setHSL(Math.random() * 0.1 + 0.9, 0.8, 0.5); // Range of reds/pinks
            this.instancedMesh.setColorAt(i, color);
        }

        this.group.add(this.instancedMesh);
    }

    createLighting() {
        // Soft ambient pinkish light
        const light = new THREE.PointLight(0xffaaaa, 1, 50);
        light.position.set(0, 10, 0);
        this.group.add(light);
    }

    update(time) {
        if(this.instancedMesh) {
            for (let i = 0; i < this.petalData.length; i++) {
                const data = this.petalData[i];

                // Wind effect: move horizontally, slowly descend
                data.x -= data.speed * 2;
                data.y -= data.speed;
                data.z -= data.speed * 0.5;

                // Wrap around
                if (data.x < -30) data.x = 30;
                if (data.y < 0) data.y = 15;
                if (data.z < -30) data.z = 30;

                // Wobble
                data.rx += Math.sin(time * data.wobbleSpeed) * 0.05;
                data.ry += Math.cos(time * data.wobbleSpeed) * 0.05;

                this.dummy.position.set(data.x, data.y, data.z);
                this.dummy.rotation.set(data.rx, data.ry, data.rz);
                this.dummy.updateMatrix();

                this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
            }
            this.instancedMesh.instanceMatrix.needsUpdate = true;
        }
    }
}
