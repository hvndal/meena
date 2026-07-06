import * as THREE from 'three';

export default class RockGardenScene {
    constructor(scene, options) {
        this.scene = scene;
        this.zOffset = options.zOffset || 0;
        this.group = new THREE.Group();
        this.group.position.z = this.zOffset;
        this.scene.add(this.group);

        this.createStatues();
        this.createSpotlights();
    }

    createStatues() {
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc, // Light grey stone base
            roughness: 0.9,
            metalness: 0.1,
            flatShading: true
        });

        this.statues = new THREE.Group();

        // Colors for ceramic heads (pastel pinks, whites, light terracottas)
        const headColors = [0xffffff, 0xffe6ea, 0xf0d9d9, 0xe6ccb8];

        for (let i = 0; i < 6; i++) {
            const figure = new THREE.Group();

            // Base
            const baseGeo = new THREE.CylinderGeometry(1, 1.5, 2, 6);
            const base = new THREE.Mesh(baseGeo, baseMaterial);
            base.position.y = 1;
            base.castShadow = true;
            base.receiveShadow = true;
            figure.add(base);

            // Body
            const bodyGeo = new THREE.BoxGeometry(1.5, 3, 1);
            const body = new THREE.Mesh(bodyGeo, baseMaterial);
            body.position.y = 3.5;
            body.rotation.z = (Math.random() - 0.5) * 0.2;
            body.castShadow = true;
            body.receiveShadow = true;
            figure.add(body);

            // Head (ceramic fragments representation in pastel)
            const headGeo = new THREE.DodecahedronGeometry(0.8, 0);
            const headMat = new THREE.MeshStandardMaterial({
                color: headColors[Math.floor(Math.random() * headColors.length)],
                roughness: 0.3, // Smoother, like ceramic
                metalness: 0.1
            });
            const head = new THREE.Mesh(headGeo, headMat);
            head.position.y = 5.5;
            head.castShadow = true;
            figure.add(head);

            // Position figure
            figure.position.set(
                (Math.random() - 0.5) * 20,
                -2,
                (Math.random() - 0.5) * 20
            );
            figure.rotation.y = Math.random() * Math.PI * 2;

            this.statues.add(figure);
        }

        this.group.add(this.statues);

        // Floor (light sand/gravel tone)
        const floorGeo = new THREE.PlaneGeometry(50, 50);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0xefebe4, roughness: 1 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -2;
        floor.receiveShadow = true;
        this.group.add(floor);
    }

    createSpotlights() {
        this.lights = [];
        // Soft pastel spotlights for a dreamy look
        const colors = [0xffffff, 0xffccdd, 0xddccff];

        for (let i = 0; i < 3; i++) {
            const light = new THREE.SpotLight(colors[i], 3);
            light.position.set((i - 1) * 10, 15, 0);
            light.angle = Math.PI / 4;
            light.penumbra = 0.8; // Very soft edges
            light.decay = 2;
            light.distance = 50;
            light.castShadow = true;

            this.group.add(light);
            this.lights.push({
                obj: light,
                offset: Math.random() * Math.PI * 2
            });
        }
    }

    update(time) {
        this.statues.children.forEach((statue, i) => {
            statue.rotation.y = Math.sin(time * 0.1 + i) * 0.1; // Slower, subtler movement
        });

        this.lights.forEach(lightData => {
            lightData.obj.target.position.set(
                Math.sin(time * 0.5 + lightData.offset) * 8,
                -2,
                Math.cos(time * 0.5 + lightData.offset) * 8
            );
            lightData.obj.target.updateMatrixWorld();
        });
    }
}
