import * as THREE from 'three';
import gsap from 'gsap';

export default class CameraController {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;

        // Initial setup (High up overlooking the city)
        this.defaultPosition = new THREE.Vector3(0, 40, 60);
        this.defaultTarget = new THREE.Vector3(10, 0, 10);

        this.camera.position.copy(this.defaultPosition);

        // We use an orbit target to smoothly interpolate lookAt
        this.controlsTarget = this.defaultTarget.clone();

        // For interaction
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.isOrbiting = false;
        this.orbitCenter = new THREE.Vector3();
        this.orbitRadius = 20;
        this.orbitAngle = 0;
        this.orbitSpeed = 0.1; // radians per second
    }

    reset() {
        this.isOrbiting = false;
        gsap.to(this.camera.position, {
            x: this.defaultPosition.x,
            y: this.defaultPosition.y,
            z: this.defaultPosition.z,
            duration: 2,
            ease: "power2.inOut"
        });
        gsap.to(this.controlsTarget, {
            x: this.defaultTarget.x,
            y: this.defaultTarget.y,
            z: this.defaultTarget.z,
            duration: 2,
            ease: "power2.inOut"
        });
    }

    flyTo(targetPos) {
        this.isOrbiting = false; // Stop orbiting to fly in

        // Calculate a position offset for viewing
        const offset = new THREE.Vector3(-10, 15, 20);
        const camDestination = targetPos.clone().add(offset);

        // Animate Camera Position
        gsap.to(this.camera.position, {
            x: camDestination.x,
            y: camDestination.y,
            z: camDestination.z,
            duration: 2,
            ease: "power3.inOut",
            onComplete: () => {
                // Start orbiting once arrived
                this.isOrbiting = true;
                this.orbitCenter.copy(targetPos);
                this.orbitAngle = Math.atan2(this.camera.position.z - targetPos.z, this.camera.position.x - targetPos.x);
                this.orbitRadius = Math.sqrt(Math.pow(this.camera.position.x - targetPos.x, 2) + Math.pow(this.camera.position.z - targetPos.z, 2));
            }
        });

        // Smoothly pan camera target to the marker
        gsap.to(this.controlsTarget, {
            x: targetPos.x,
            y: targetPos.y,
            z: targetPos.z,
            duration: 1.5,
            ease: "power2.inOut"
        });
    }

    getIntersectedMarker(clientX, clientY, markers) {
        // Convert mouse position to normalized device coordinates (-1 to +1)
        this.mouse.x = (clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(markers);

        if (intersects.length > 0) {
            return intersects[0].object;
        }
        return null;
    }

    update(delta) {
        if (this.isOrbiting) {
            // Cinematic slow orbit
            this.orbitAngle += this.orbitSpeed * delta;

            this.camera.position.x = this.orbitCenter.x + Math.cos(this.orbitAngle) * this.orbitRadius;
            this.camera.position.z = this.orbitCenter.z + Math.sin(this.orbitAngle) * this.orbitRadius;
            // Keep Y constant during orbit
        }

        // Always look at the interpolated target
        this.camera.lookAt(this.controlsTarget);
    }
}
