import './style.css';
import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SceneManager from './SceneManager.js';
import CameraController from './CameraController.js';

gsap.registerPlugin(ScrollTrigger);

class App {
    constructor() {
        this.init();
    }

    async init() {
        this.loader = document.getElementById('loader');
        this.loaderProgress = document.querySelector('.loader-progress');
        this.scrollProgressBar = document.querySelector('.scroll-progress-bar');

        this.lenis = new Lenis({
            duration: 1.5,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
        });

        this.sceneManager = new SceneManager(document.getElementById('canvas-container'));
        this.cameraController = new CameraController(this.sceneManager.camera, this.sceneManager.scene);

        await this.loadAssets();

        this.setupAnimations();
        this.setupCustomCursor();
        this.setupAudio();

        this.update();

        gsap.to(this.loader, { opacity: 0, duration: 1, onComplete: () => this.loader.style.display = 'none' });
        window.addEventListener('resize', this.onResize.bind(this));
    }

    async loadAssets() {
        for(let i = 0; i <= 100; i += 10) {
            this.loaderProgress.style.width = `${i}%`;
            await new Promise(r => setTimeout(r, 100));
        }
        this.sceneManager.buildScenes();
    }

    setupAudio() {
        const bgMusic = document.getElementById('bg-music');
        const audioToggle = document.getElementById('audio-toggle');
        let isPlaying = false;

        audioToggle.addEventListener('click', () => {
            if (isPlaying) {
                bgMusic.pause();
                audioToggle.textContent = '🔇';
            } else {
                bgMusic.play();
                audioToggle.textContent = '🔊';
            }
            isPlaying = !isPlaying;
        });
    }

    setupAnimations() {
        this.lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => { this.lenis.raf(time * 1000); });
        gsap.ticker.lagSmoothing(0);

        gsap.to(this.scrollProgressBar, {
            height: '100%',
            ease: 'none',
            scrollTrigger: { trigger: '#scroll-content', start: 'top top', end: 'bottom bottom', scrub: 0.1 }
        });

        gsap.utils.toArray('.glass-card').forEach(card => {
            gsap.to(card, {
                y: 0, opacity: 1, duration: 1, ease: 'power3.out',
                scrollTrigger: { trigger: card, start: 'top 80%', toggleActions: 'play none none reverse' }
            });
        });

        this.cameraController.setupScrollAnimations();
    }

    setupCustomCursor() {
        const cursor = document.querySelector('.custom-cursor');
        const follower = document.querySelector('.custom-cursor-follower');

        document.addEventListener('mousemove', (e) => {
            gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0 });
            gsap.to(follower, { x: e.clientX, y: e.clientY, duration: 0.3, ease: 'power2.out' });

            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = -(e.clientY / window.innerHeight) * 2 + 1;
            this.cameraController.updateMouse(x, y);
        });

        const interactables = document.querySelectorAll('a, button, .glass-card, .audio-control');
        interactables.forEach(el => {
            el.addEventListener('mouseenter', () => {
                gsap.to(follower, { width: 60, height: 60, background: 'rgba(216, 143, 163, 0.2)', duration: 0.3 });
            });
            el.addEventListener('mouseleave', () => {
                gsap.to(follower, { width: 40, height: 40, background: 'transparent', duration: 0.3 });
            });
        });
    }

    onResize() {
        this.sceneManager.onResize();
    }

    update(time) {
        requestAnimationFrame(this.update.bind(this));
        this.cameraController.update();
        this.sceneManager.update(time * 0.001);
    }
}

window.onload = () => { new App(); };
