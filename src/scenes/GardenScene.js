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
        const instanceCount = 3000; // Slightly fewer for a cleaner, airier look

        // Curved petal geometry
        const geometry = new THREE.ConeGeometry(0.2, 0.6, 3);
        geometry.rotateX(Math.PI/2);

        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff, // Base is white, we colorize via instance colors
            roughness: 0.4,
            metalness: 0.1,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9
        });

        this.instancedMesh = new THREE.InstancedMesh(geometry, material, instanceCount);

        this.dummy = new THREE.Object3D();
        this.petalData = [];
        const color = new THREE.Color();

        for (let i = 0; i < instanceCount; i++) {
            const x = (Math.random() - 0.5) * 60;
            const y = Math.random() * 20; // Spread higher
            const z = (Math.random() - 0.5) * 60;

            this.dummy.position.set(x, y, z);
            this.dummy.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            const scale = Math.random() * 0.4 + 0.6;
            this.dummy.scale.set(scale, scale, scale);
            this.dummy.updateMatrix();
            this.instancedMesh.setMatrixAt(i, this.dummy.matrix);

            // Palette: White to very soft light pink
            // HSL: Hue near 340-350 (pink/red), low saturation, high lightness
            color.setHSL(0.95, Math.random() * 0.3 + 0.2, Math.random() * 0.2 + 0.8);
            this.instancedMesh.setColorAt(i, color);

            this.petalData.push({
                x, y, z,
                rx: this.dummy.rotation.x,
                ry: this.dummy.rotation.y,
                rz: this.dummy.rotation.z,
                speed: Math.random() * 0.015 + 0.005, // Slower, gentler fall
                wobbleSpeed: Math.random() * 1 + 0.5
            });
        }

        this.group.add(this.instancedMesh);
    }

    createLighting() {
        // Very soft, bright ambient illumination
        const light = new THREE.PointLight(0xffffff, 0.8, 60);
        light.position.set(0, 15, 0);
        this.group.add(light);
    }

    update(time) {
        if(this.instancedMesh) {
            for (let i = 0; i < this.petalData.length; i++) {
                const data = this.petalData[i];

                data.x -= data.speed * 1.5;
                data.y -= data.speed;
                data.z -= data.speed * 0.3;

                if (data.x < -30) data.x = 30;
                if (data.y < 0) data.y = 20;
                if (data.z < -30) data.z = 30;

                data.rx += Math.sin(time * data.wobbleSpeed) * 0.03;
                data.ry += Math.cos(time * data.wobbleSpeed) * 0.03;

                this.dummy.position.set(data.x, data.y, data.z);
                this.dummy.rotation.set(data.rx, data.ry, data.rz);
                this.dummy.updateMatrix();

                this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
            }
            this.instancedMesh.instanceMatrix.needsUpdate = true;
        }
    }
}
