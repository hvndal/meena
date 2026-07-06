import * as THREE from 'three';
import gsap from 'gsap';

export default class CameraController {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;

        // Initial setup
        this.camera.position.set(0, 5, 20); // Start position for Opening Scene
        this.camera.lookAt(0, 0, 0);

        this.mouse = { x: 0, y: 0 };
        this.targetMouse = { x: 0, y: 0 };

        // Wrap camera in a group for independent mouse parallax vs GSAP positioning
        this.cameraGroup = new THREE.Group();
        this.scene.add(this.cameraGroup);
        this.cameraGroup.add(this.camera);
    }

    updateMouse(x, y) {
        this.targetMouse.x = x;
        this.targetMouse.y = y;
    }

    setupScrollAnimations() {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: '#scroll-content',
                start: 'top top',
                end: 'bottom bottom',
                scrub: 1, // Smooth scrubbing
            }
        });

        // The camera travels along the Z axis, dropping down slightly at each scene.
        // Opening to Lake (Scene 1)
        tl.to(this.cameraGroup.position, { z: -80, y: 2, duration: 1 }, "lake")
          .to(this.camera.rotation, { x: -0.1, duration: 1 }, "lake");

        // Lake to Rock Garden (Scene 2)
        tl.to(this.cameraGroup.position, { z: -180, y: 5, x: 5, duration: 1 }, "rock")
          .to(this.camera.rotation, { y: 0.2, duration: 1 }, "rock");

        // Rock Garden to Capitol (Scene 3)
        tl.to(this.cameraGroup.position, { z: -280, y: 15, x: -5, duration: 1 }, "capitol")
          .to(this.camera.rotation, { y: -0.2, x: -0.2, duration: 1 }, "capitol");

        // Capitol to Sector 17 (Scene 4)
        tl.to(this.cameraGroup.position, { z: -380, y: 3, x: 0, duration: 1 }, "sec17")
          .to(this.camera.rotation, { y: 0, x: 0, duration: 1 }, "sec17");

        // Sector 17 to Rose Garden (Scene 5)
        tl.to(this.cameraGroup.position, { z: -480, y: 1, x: 2, duration: 1 }, "rose")
          .to(this.camera.rotation, { y: 0.1, duration: 1 }, "rose");

        // Rose Garden to Food (Scene 6)
        tl.to(this.cameraGroup.position, { z: -580, y: 5, x: -2, duration: 1 }, "food")
          .to(this.camera.rotation, { y: -0.1, duration: 1 }, "food");

        // Food to Interactive/Ending (Scene 7 & End)
        tl.to(this.cameraGroup.position, { z: -680, y: 30, x: 0, duration: 1 }, "end")
          .to(this.camera.rotation, { x: -Math.PI/4, y: 0, duration: 1 }, "end");
    }

    update() {
        // Smooth mouse parallax
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05;

        // Apply slight offset to camera within its group based on mouse
        this.camera.position.x = this.mouse.x * 2;
        this.camera.position.y = this.mouse.y * 2;
    }
}
