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
        // Bright, clean concrete aesthetic (Le Corbusier style in daylight)
        const material = new THREE.MeshStandardMaterial({
            color: 0xe0e0e0, // Light grey/white concrete
            roughness: 0.9,
            metalness: 0.05
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

        // Open Hand Monument Representation (Slightly warmer tone)
        const handMat = new THREE.MeshStandardMaterial({
            color: 0xdccbb5, // Soft warm metallic/stone tone
            roughness: 0.7,
            metalness: 0.3
        });
        const handGroup = new THREE.Group();
        const palmGeo = new THREE.BoxGeometry(1, 4, 3);
        const palm = new THREE.Mesh(palmGeo, handMat);
        palm.position.y = 8;
        palm.castShadow = true;
        handGroup.add(palm);

        const pillarGeo = new THREE.CylinderGeometry(0.5, 0.5, 6);
        const pillar = new THREE.Mesh(pillarGeo, handMat);
        pillar.position.y = 3;
        pillar.castShadow = true;
        handGroup.add(pillar);

        handGroup.position.set(0, 0, 5);
        this.openHand = handGroup;
        this.group.add(handGroup);

        // Ground plaza (light concrete tiles)
        const groundGeo = new THREE.PlaneGeometry(100, 100);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 1 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.group.add(ground);
    }

    createLighting() {
        // Soft, bright daylight casting gentle shadows
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
        this.sunLight.position.set(-20, 30, -10);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.bias = -0.001;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;

        // Fill light to reduce contrast and make it look airy
        const fillLight = new THREE.DirectionalLight(0xffe6ee, 0.5); // very soft pinkish fill
        fillLight.position.set(20, 10, 10);

        this.group.add(this.sunLight);
        this.group.add(fillLight);
    }

    update(time) {
        if(this.openHand) {
            this.openHand.rotation.y = Math.sin(time * 0.3) * 0.15; // Gentle wind effect
        }
    }
}
