import * as THREE from 'three';

export default class CapitolScene {
    constructor(scene, options) {
        this.scene = scene;
        this.zOffset = options.zOffset || 0;
        this.group = new THREE.Group();
        this.group.position.z = this.zOffset;
        this.scene.add(this.group);

        this.createArchitecture();
        this.createLighting();
    }

    createArchitecture() {
        // Brutalist concrete aesthetic
        const material = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.8,
            metalness: 0.1
        });

        // Main Assembly building representation
        const mainBldgGeo = new THREE.BoxGeometry(20, 15, 10);
        const mainBldg = new THREE.Mesh(mainBldgGeo, material);
        mainBldg.position.set(-10, 7.5, -15);
        mainBldg.castShadow = true;
        mainBldg.receiveShadow = true;
        this.group.add(mainBldg);

        // Roof curve
        const roofGeo = new THREE.CylinderGeometry(8, 8, 20, 32, 1, false, 0, Math.PI);
        const roof = new THREE.Mesh(roofGeo, material);
        roof.rotation.z = Math.PI / 2;
        roof.position.set(-10, 15, -15);
        roof.castShadow = true;
        this.group.add(roof);

        // Secretariat / Columns
        for(let i=0; i<5; i++) {
            const colGeo = new THREE.BoxGeometry(2, 20, 2);
            const col = new THREE.Mesh(colGeo, material);
            col.position.set(10, 10, -10 + i * 5);
            col.castShadow = true;
            col.receiveShadow = true;
            this.group.add(col);
        }

        // Open Hand Monument Representation
        const handGroup = new THREE.Group();
        const palmGeo = new THREE.BoxGeometry(1, 4, 3);
        const palm = new THREE.Mesh(palmGeo, material);
        palm.position.y = 8;
        handGroup.add(palm);

        const pillarGeo = new THREE.CylinderGeometry(0.5, 0.5, 6);
        const pillar = new THREE.Mesh(pillarGeo, material);
        pillar.position.y = 3;
        handGroup.add(pillar);

        handGroup.position.set(0, 0, 5);
        this.openHand = handGroup;
        this.group.add(handGroup);

        // Ground
        const groundGeo = new THREE.PlaneGeometry(100, 100);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.group.add(ground);
    }

    createLighting() {
        // Golden hour lighting
        this.sunLight = new THREE.DirectionalLight(0xffaa55, 2);
        this.sunLight.position.set(-20, 10, -10);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.bias = -0.001;

        // Soften shadows
        this.sunLight.shadow.mapSize.width = 1024;
        this.sunLight.shadow.mapSize.height = 1024;

        this.group.add(this.sunLight);
    }

    update(time) {
        if(this.openHand) {
            // Slight rotation to simulate wind on the open hand monument
            this.openHand.rotation.y = Math.sin(time * 0.5) * 0.2;
        }
    }
}
