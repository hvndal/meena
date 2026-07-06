import * as THREE from 'three';

export default class EndingScene {
    constructor(scene, options) {
        this.scene = scene;
        this.zOffset = options.zOffset || 0;
        this.group = new THREE.Group();
        this.group.position.z = this.zOffset;
        this.scene.add(this.group);

        this.createCityGrid();
        this.createConstellations();
    }

    createCityGrid() {
        // Miniature Le Corbusier grid plan representation
        const gridSize = 10;
        const spacing = 2;
        const bldgMat = new THREE.MeshBasicMaterial({
            color: 0x4ade80,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });

        const bldgGeo = new THREE.BoxGeometry(1, 1, 1);

        this.cityMesh = new THREE.InstancedMesh(bldgGeo, bldgMat, gridSize * gridSize);
        const dummy = new THREE.Object3D();

        let i = 0;
        for(let x=0; x<gridSize; x++) {
            for(let z=0; z<gridSize; z++) {
                const height = Math.random() * 2 + 0.5;

                // Keep center somewhat empty for ending text overlay
                const distFromCenter = Math.sqrt(Math.pow(x - gridSize/2, 2) + Math.pow(z - gridSize/2, 2));
                let finalHeight = height;
                if(distFromCenter < 2) finalHeight = 0.1;

                dummy.position.set(
                    (x - gridSize/2) * spacing,
                    finalHeight/2,
                    (z - gridSize/2) * spacing
                );
                dummy.scale.set(1, finalHeight, 1);
                dummy.updateMatrix();

                this.cityMesh.setMatrixAt(i, dummy.matrix);
                i++;
            }
        }

        this.group.add(this.cityMesh);

        // Ground grid lines
        const gridHelper = new THREE.GridHelper(30, 30, 0x4ade80, 0x111111);
        gridHelper.position.y = 0;
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = 0.2;
        this.group.add(gridHelper);
    }

    createConstellations() {
        const particleCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 200;
            positions[i+1] = Math.random() * 100 + 50; // High above
            positions[i+2] = (Math.random() - 0.5) * 200;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.5,
            transparent: true,
            opacity: 0.8
        });

        this.stars = new THREE.Points(geometry, material);
        this.group.add(this.stars);
    }

    update(time) {
        // Slow rotation of the miniature city
        if(this.cityMesh) {
            this.cityMesh.rotation.y = time * 0.05;
        }
        if(this.stars) {
            this.stars.rotation.y = time * 0.01;
        }
    }
}
