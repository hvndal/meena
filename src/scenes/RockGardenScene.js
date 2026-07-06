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
        const material = new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 0.9,
            metalness: 0.1,
            flatShading: true // Gives a blocky, sculpted look
        });

        this.statues = new THREE.Group();

        // Create abstract figures by stacking primitives
        for (let i = 0; i < 5; i++) {
            const figure = new THREE.Group();

            // Base
            const baseGeo = new THREE.CylinderGeometry(1, 1.5, 2, 6);
            const base = new THREE.Mesh(baseGeo, material);
            base.position.y = 1;
            base.castShadow = true;
            base.receiveShadow = true;
            figure.add(base);

            // Body
            const bodyGeo = new THREE.BoxGeometry(1.5, 3, 1);
            const body = new THREE.Mesh(bodyGeo, material);
            body.position.y = 3.5;
            body.rotation.z = (Math.random() - 0.5) * 0.2;
            body.castShadow = true;
            body.receiveShadow = true;
            figure.add(body);

            // Head (ceramic fragments representation)
            const headGeo = new THREE.DodecahedronGeometry(0.8, 0);
            const headMat = new THREE.MeshStandardMaterial({
                color: Math.random() > 0.5 ? 0xcccccc : 0x884422, // Broken white or terracotta
                roughness: 0.5,
                metalness: 0.2
            });
            const head = new THREE.Mesh(headGeo, headMat);
            head.position.y = 5.5;
            head.castShadow = true;
            figure.add(head);

            // Position figure
            figure.position.set(
                (Math.random() - 0.5) * 20,
                -2, // Base level relative to camera y
                (Math.random() - 0.5) * 20
            );
            figure.rotation.y = Math.random() * Math.PI * 2;

            this.statues.add(figure);
        }

        this.group.add(this.statues);

        // Floor
        const floorGeo = new THREE.PlaneGeometry(50, 50);
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1 });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -2;
        floor.receiveShadow = true;
        this.group.add(floor);
    }

    createSpotlights() {
        this.lights = [];
        const colors = [0xffffff, 0x4ade80, 0x3b82f6];

        for (let i = 0; i < 3; i++) {
            const light = new THREE.SpotLight(colors[i], 5);
            light.position.set((i - 1) * 10, 15, 0);
            light.angle = Math.PI / 6;
            light.penumbra = 0.5;
            light.decay = 2;
            light.distance = 50;
            light.castShadow = true;

            this.group.add(light);
            this.lights.push({
                obj: light,
                offset: Math.random() * Math.PI * 2
            });

            // Add a small helper to see light source
            const helperGeo = new THREE.SphereGeometry(0.2);
            const helperMat = new THREE.MeshBasicMaterial({ color: colors[i] });
            const helper = new THREE.Mesh(helperGeo, helperMat);
            helper.position.copy(light.position);
            this.group.add(helper);
        }
    }

    update(time) {
        // Slowly rotate statues
        this.statues.children.forEach((statue, i) => {
            statue.rotation.y = Math.sin(time * 0.2 + i) * 0.2;
        });

        // Swing spotlights
        this.lights.forEach(lightData => {
            lightData.obj.target.position.set(
                Math.sin(time + lightData.offset) * 10,
                -2,
                Math.cos(time + lightData.offset) * 10
            );
            lightData.obj.target.updateMatrixWorld();
        });
    }
}
