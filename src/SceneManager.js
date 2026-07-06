import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
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
        const geo = new THREE.PlaneGeometry(2000, 2000, 128, 128);

        this.oceanMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(0x0f172a) } // Slate 900
            },
            vertexShader: `
                uniform float uTime;
                varying vec2 vUv;
                varying vec3 vWorldPosition;
                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    // Gentle ocean swells, with larger scale for 2000 size
                    pos.z += sin(pos.x * 0.05 + uTime * 0.5) * 2.0 + cos(pos.y * 0.05 + uTime * 0.5) * 2.0;

                    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * viewMatrix * worldPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                uniform float uTime;
                varying vec2 vUv;
                varying vec3 vWorldPosition;
                void main() {
                    // Slight reflection gradient and dynamic highlights
                    float mixVal = smoothstep(0.0, 1.0, sin(vUv.y * 100.0 + uTime * 0.5) * 0.5 + 0.5);

                    // Add subtle wave highlights based on noise
                    float waveHighlight = max(0.0, sin(vWorldPosition.x * 0.1 + uTime) * cos(vWorldPosition.z * 0.1 - uTime)) * 0.2;

                    vec3 finalColor = mix(uColor, vec3(0.1, 0.25, 0.4), mixVal * 0.3 + waveHighlight);
                    gl_FragColor = vec4(finalColor, 0.95);
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
        const width = 1000, depth = 500;
        const widthSegments = 100, depthSegments = 50;

        const planeGeo = new THREE.PlaneGeometry(width, depth, widthSegments, depthSegments);
        planeGeo.rotateX(-Math.PI / 2);

        const pos = planeGeo.attributes.position.array;
        for(let i=0; i<pos.length; i+=3) {
            const x = pos[i];
            const z = pos[i+2];

            // Procedural mountain height using overlapping sine waves for fractal-like appearance
            let y = 0;
            y += Math.sin(x * 0.02) * Math.cos(z * 0.02) * 50;
            y += Math.sin(x * 0.05 + 1) * Math.cos(z * 0.05 + 2) * 20;
            y += Math.sin(x * 0.1) * Math.cos(z * 0.1) * 5;

            // Only raise them if they are above a threshold, creating peaks
            y = Math.max(0, y - 10);

            // Make higher peaks more jagged
            if (y > 0) {
                y += Math.random() * 2; // rough noise
            }

            pos[i+1] = y;
        }

        planeGeo.computeVertexNormals();

        const mat = new THREE.MeshStandardMaterial({
            color: 0x1e293b, // Slate 800
            roughness: 0.9,
            flatShading: true
        });

        const mountains = new THREE.Mesh(planeGeo, mat);
        // Position them north (negative Z) of the city
        mountains.position.set(0, -2, -200);
        this.scene.add(mountains);
    }

    async createCity() {
        // Downtown Vancouver Peninsula
        const group = new THREE.Group();
        // group.position.set(20, 0, 20); // removing translation since data is absolute

        const bldgMat = new THREE.MeshStandardMaterial({
            color: 0x334155, // Slate 700
            roughness: 0.2, // Glassy Vancouver look
            metalness: 0.8
        });

        this.scene.add(group);

        try {
            const res = await fetch('./buildings.json');
            const buildings = await res.json();

            const geometries = [];

            for (const b of buildings) {
                if (b.c.length < 3) continue;
                const shape = new THREE.Shape();
                shape.moveTo(b.c[0][0], b.c[0][1]);
                for (let i = 1; i < b.c.length; i++) {
                    shape.lineTo(b.c[i][0], b.c[i][1]);
                }
                shape.lineTo(b.c[0][0], b.c[0][1]);

                const extrudeSettings = {
                    depth: b.h,
                    bevelEnabled: false
                };

                const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
                // Extrude goes along Z by default, we need it to go up along Y
                geo.rotateX(-Math.PI / 2);

                geometries.push(geo);
            }

            if (geometries.length > 0) {
                const mergedGeometry = mergeGeometries(geometries);
                const mergedMesh = new THREE.Mesh(mergedGeometry, bldgMat);
                mergedMesh.castShadow = true;
                mergedMesh.receiveShadow = true;
                group.add(mergedMesh);
            }
        } catch (e) {
            console.error('Failed to load buildings.json', e);
        }
    }

    createStanleyPark() {
        const group = new THREE.Group();
        group.position.set(-30, 0, 10);

        // Custom shape for the peninsula
        const shape = new THREE.Shape();
        shape.moveTo(0, 20);
        shape.lineTo(15, 10);
        shape.lineTo(20, -10);
        shape.lineTo(10, -25);
        shape.lineTo(-10, -30);
        shape.lineTo(-25, -15);
        shape.lineTo(-20, 5);
        shape.lineTo(0, 20);

        const extrudeSettings = { depth: 1, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 1, bevelThickness: 1 };
        const parkGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        parkGeo.rotateX(-Math.PI / 2); // Lay flat
        parkGeo.translate(0, -1.5, 0); // Position correctly

        const base = new THREE.Mesh(
            parkGeo,
            new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 1 }) // Emerald 900
        );
        base.receiveShadow = true;
        group.add(base);

        // Better Trees using a combination of cylinder (trunk) and cone (leaves) as a single geometry
        const trunk = new THREE.CylinderGeometry(0.2, 0.4, 1.5, 5);
        trunk.translate(0, 0.75, 0);
        const leaves1 = new THREE.ConeGeometry(1.5, 3, 5);
        leaves1.translate(0, 2.5, 0);
        const leaves2 = new THREE.ConeGeometry(1.2, 2.5, 5);
        leaves2.translate(0, 4, 0);

        const treeGeoms = [trunk, leaves1, leaves2];
        const treeGeo = mergeGeometries(treeGeoms);

        const treeMat = new THREE.MeshStandardMaterial({ color: 0x022c22, flatShading: true }); // Emerald 950

        const treeCount = 500;
        const treeMesh = new THREE.InstancedMesh(treeGeo, treeMat, treeCount);
        const dummy = new THREE.Object3D();

        for(let i=0; i<treeCount; i++) {
            // Distribute trees inside a rough radius
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * 20;
            const x = Math.cos(angle)*r;
            const z = Math.sin(angle)*r;

            // Only place if it's somewhat in the middle bounds (simple rough check instead of point-in-polygon for speed)
            dummy.position.set(x, 1, z);
            const scale = Math.random() * 0.4 + 0.6; // random sizing
            dummy.scale.set(scale, scale, scale);
            dummy.rotation.y = Math.random() * Math.PI;
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

        const centerLat = 49.2827;
        const centerLon = -123.1207;
        const latToMeters = 111132;
        const lonToMeters = 111132 * Math.cos(centerLat * Math.PI / 180);
        const scale = 0.05;

        const addMarker = (id, name, lat, lng) => {
            const mesh = new THREE.Mesh(markerGeo, markerMat.clone());

            const x = (lng - centerLon) * lonToMeters * scale;
            const z = -(lat - centerLat) * latToMeters * scale;
            const y = 8; // Float slightly above buildings

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

        // Real coordinates
        addMarker('stanley_park', 'Stanley Park', 49.3017, -123.1417);
        addMarker('gastown', 'Gastown Steam Clock', 49.2844, -123.1089);
        addMarker('granville', 'Granville Island', 49.2712, -123.1340);
        addMarker('science_world', 'Science World', 49.2734, -123.1038);
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
