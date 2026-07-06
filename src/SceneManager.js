import * as THREE from 'three';
import Environment from './Environment.js';

export default class SceneManager {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        this.environment = new Environment(this.scene, this.renderer);

        this.markers = []; // Interactable objects
        this.buildVancouverScene();
    }

    buildVancouverScene() {
        this.createOcean();
        this.createMountains();
        this.createCity();
        this.createStanleyPark();
        this.createLandmarks();
    }

    createOcean() {
        const geo = new THREE.PlaneGeometry(500, 500, 64, 64);

        this.oceanMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(0x0f172a) } // Slate 900
            },
            vertexShader: `
                uniform float uTime;
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    // Gentle ocean swells
                    pos.z += sin(pos.x * 0.1 + uTime * 0.5) * 1.5 + cos(pos.y * 0.1 + uTime * 0.5) * 1.5;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                varying vec2 vUv;
                void main() {
                    // Slight reflection gradient
                    float mixVal = smoothstep(0.0, 1.0, sin(vUv.y * 50.0) * 0.5 + 0.5);
                    vec3 finalColor = mix(uColor, vec3(0.1, 0.2, 0.3), mixVal * 0.3);
                    gl_FragColor = vec4(finalColor, 0.9);
                }
            `,
            transparent: true
        });

        this.ocean = new THREE.Mesh(geo, this.oceanMaterial);
        this.ocean.rotation.x = -Math.PI / 2;
        this.ocean.position.y = -2;
        this.scene.add(this.ocean);
    }

    createMountains() {
        // North Shore Mountains
        const geo = new THREE.BufferGeometry();
        const width = 200, depth = 100;
        const widthSegments = 20, depthSegments = 10;

        const planeGeo = new THREE.PlaneGeometry(width, depth, widthSegments, depthSegments);
        planeGeo.rotateX(-Math.PI / 2);

        const pos = planeGeo.attributes.position.array;
        for(let i=0; i<pos.length; i+=3) {
            const x = pos[i];
            const z = pos[i+2];
            // Procedural mountain height
            const d = Math.sqrt(x*x + z*z);
            pos[i+1] = Math.max(0, 30 - d*0.2 + Math.random() * 5);
        }

        planeGeo.computeVertexNormals();

        const mat = new THREE.MeshStandardMaterial({
            color: 0x1e293b, // Slate 800
            roughness: 0.9,
            flatShading: true
        });

        const mountains = new THREE.Mesh(planeGeo, mat);
        mountains.position.set(0, -2, -100);
        this.scene.add(mountains);
    }

    createCity() {
        // Downtown Vancouver Peninsula
        const group = new THREE.Group();
        group.position.set(20, 0, 20);

        const bldgMat = new THREE.MeshStandardMaterial({
            color: 0x334155, // Slate 700
            roughness: 0.2, // Glassy Vancouver look
            metalness: 0.8
        });

        // Generate grid of skyscrapers
        for(let x=-20; x<20; x+=4) {
            for(let z=-20; z<20; z+=4) {
                if(Math.random() > 0.3) {
                    const h = Math.random() * 15 + 5;
                    const bldg = new THREE.Mesh(new THREE.BoxGeometry(2.5, h, 2.5), bldgMat);
                    bldg.position.set(x, h/2 - 2, z);
                    bldg.castShadow = true;
                    bldg.receiveShadow = true;
                    group.add(bldg);
                }
            }
        }
        this.scene.add(group);
    }

    createStanleyPark() {
        const group = new THREE.Group();
        group.position.set(-30, 0, 10);

        // Park base
        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(20, 20, 1, 32),
            new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 1 }) // Emerald 900
        );
        base.position.y = -1.5;
        base.receiveShadow = true;
        group.add(base);

        // Abstract Trees (Instanced)
        const treeGeo = new THREE.ConeGeometry(1, 4, 4);
        const treeMat = new THREE.MeshStandardMaterial({ color: 0x022c22, flatShading: true }); // Emerald 950

        const treeMesh = new THREE.InstancedMesh(treeGeo, treeMat, 200);
        const dummy = new THREE.Object3D();

        for(let i=0; i<200; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * 18;
            dummy.position.set(Math.cos(angle)*r, 1, Math.sin(angle)*r);
            const scale = Math.random() * 0.5 + 0.5;
            dummy.scale.set(scale, scale, scale);
            dummy.updateMatrix();
            treeMesh.setMatrixAt(i, dummy.matrix);
        }
        treeMesh.castShadow = true;
        group.add(treeMesh);

        this.scene.add(group);
    }

    createLandmarks() {
        const markerGeo = new THREE.SphereGeometry(1.5, 16, 16);
        const markerMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 }); // Ocean Blue

        const addMarker = (id, name, x, y, z, lat, lng) => {
            const mesh = new THREE.Mesh(markerGeo, markerMat.clone());
            mesh.position.set(x, y, z);

            // Add glow ring
            const ringGeo = new THREE.RingGeometry(1.8, 2, 32);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI/2;
            mesh.add(ring);

            mesh.userData = { id, name, isMarker: true, coords: { lat, lng } };
            this.scene.add(mesh);
            this.markers.push(mesh);
        };

        // Coordinates approximate
        addMarker('stanley_park', 'Stanley Park', -30, 5, 10, 49.3017, -123.1417);
        addMarker('gastown', 'Gastown Steam Clock', 15, 8, 5, 49.2844, -123.1089);
        addMarker('granville', 'Granville Island', 25, 5, 30, 49.2712, -123.1340);
        addMarker('science_world', 'Science World', 35, 5, 15, 49.2734, -123.1038);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    update(time, delta) {
        if(this.oceanMaterial) {
            this.oceanMaterial.uniforms.uTime.value = time;
        }

        this.environment.update(delta);

        // Pulse markers
        this.markers.forEach(m => {
            const s = 1 + Math.sin(time * 3) * 0.1;
            m.scale.set(s,s,s);
            // Rotate ring
            if(m.children[0]) {
                m.children[0].rotation.z = time * 0.5;
            }
        });

        this.renderer.render(this.scene, this.camera);
    }
}
