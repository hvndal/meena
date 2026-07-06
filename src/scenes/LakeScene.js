import * as THREE from 'three';

export default class LakeScene {
    constructor(scene, options) {
        this.scene = scene;
        this.zOffset = options.zOffset || 0;
        this.group = new THREE.Group();
        this.group.position.z = this.zOffset;
        this.scene.add(this.group);

        this.createWater();
        this.createMist();
        this.createAbstractBoats();
    }

    createWater() {
        const geometry = new THREE.PlaneGeometry(100, 100, 64, 64);

        // Simple custom shader material for water-like displacement
        this.waterMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(0x0a1a1f) } // Dark teal
            },
            vertexShader: `
                uniform float uTime;
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    // Simple sine wave displacement
                    pos.z += sin(pos.x * 0.5 + uTime) * 0.5 + cos(pos.y * 0.5 + uTime) * 0.5;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                varying vec2 vUv;
                void main() {
                    // Slight gradient based on UV
                    float mixVal = smoothstep(0.0, 1.0, vUv.y);
                    vec3 finalColor = mix(uColor, vec3(0.0), mixVal * 0.5);
                    gl_FragColor = vec4(finalColor, 0.9);
                }
            `,
            transparent: true,
            wireframe: false
        });

        this.water = new THREE.Mesh(geometry, this.waterMaterial);
        this.water.rotation.x = -Math.PI / 2;
        this.group.add(this.water);
    }

    createMist() {
        const particleCount = 500;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 50; // x
            positions[i+1] = Math.random() * 5;        // y
            positions[i+2] = (Math.random() - 0.5) * 50; // z
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0x88ccff,
            size: 0.5,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });

        this.mist = new THREE.Points(geometry, material);
        this.group.add(this.mist);
    }

    createAbstractBoats() {
        // Simple tetrahedrons representing boats
        const geometry = new THREE.TetrahedronGeometry(1);
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.2,
            metalness: 0.8
        });

        this.boats = [];
        for(let i=0; i<3; i++) {
            const boat = new THREE.Mesh(geometry, material);
            boat.position.set((Math.random() - 0.5) * 20, 0, (Math.random() - 0.5) * 20);
            this.group.add(boat);
            this.boats.push({
                mesh: boat,
                speed: Math.random() * 0.5 + 0.1,
                offset: Math.random() * Math.PI * 2
            });
        }
    }

    update(time) {
        if(this.waterMaterial) {
            this.waterMaterial.uniforms.uTime.value = time;
        }
        if(this.mist) {
            this.mist.position.x = Math.sin(time * 0.1) * 2;
        }

        this.boats.forEach(b => {
            b.mesh.position.y = Math.sin(time * 2 + b.offset) * 0.2;
            b.mesh.rotation.y = time * 0.1 * b.speed;
        });
    }
}
