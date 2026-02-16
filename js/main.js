// DOM Elements
const themeBtn = document.getElementById('theme-btn');
const body = document.body;

// Theme Handling
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        body.setAttribute('data-theme', 'dark');
    } else {
        body.setAttribute('data-theme', 'light');
    }
}

themeBtn.addEventListener('click', () => {
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Update Three.js background if needed (e.g. change particle color)
    if (window.updateThreeTheme) {
        window.updateThreeTheme(newTheme);
    }
});

initTheme();

// Three.js Background
function initThreeJS() {
    const container = document.getElementById('canvas-container');

    // Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Objects
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 500;

    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 15; // Spread particles
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    // Material
    const material = new THREE.PointsMaterial({
        size: 0.02,
        color: body.getAttribute('data-theme') === 'dark' ? 0x4da3ff : 0x007bff,
        transparent: true,
        opacity: 0.8,
    });

    // Mesh
    const particlesMesh = new THREE.Points(particlesGeometry, material);
    scene.add(particlesMesh);

    // Secondary Object (Floating Geometric Shape)
    const geoGeometry = new THREE.IcosahedronGeometry(1.5, 0);
    const geoMaterial = new THREE.MeshBasicMaterial({
        color: body.getAttribute('data-theme') === 'dark' ? 0x6FBDCA : 0x183A8A,
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });
    const geoMesh = new THREE.Mesh(geoGeometry, geoMaterial);
    scene.add(geoMesh);

    camera.position.z = 5;

    // Interaction State
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    // Mouse Interaction
    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - windowHalfX);
        mouseY = (event.clientY - windowHalfY);
    });

    // Gyroscope Interaction (Mobile)
    window.addEventListener('deviceorientation', (event) => {
        if (event.beta && event.gamma) {
            // Beta: front-to-back tilt [-180, 180]
            // Gamma: left-to-right tilt [-90, 90]

            // Normalize and scale impacts
            const tiltX = event.gamma * 2;
            const tiltY = event.beta * 2;

            mouseX = tiltX;
            mouseY = tiltY;
        }
    });

    // Theme Update Handler
    window.updateThreeTheme = (theme) => {
        if (theme === 'dark') {
            material.color.setHex(0x4da3ff);
            geoMaterial.color.setHex(0x6FBDCA);
        } else {
            material.color.setHex(0x007bff);
            geoMaterial.color.setHex(0x183A8A);
        }
    };

    // Animation Loop
    const clock = new THREE.Clock();

    function animate() {
        targetX = mouseX * 0.001;
        targetY = mouseY * 0.001;

        const elapsedTime = clock.getElapsedTime();

        // Rotate objects - Slower speed
        particlesMesh.rotation.y = -0.02 * elapsedTime;
        particlesMesh.rotation.x = -0.01 * elapsedTime; // constant rotation

        // Interactive rotation
        particlesMesh.rotation.y += 0.05 * (targetX - particlesMesh.rotation.y);
        particlesMesh.rotation.x += 0.05 * (targetY - particlesMesh.rotation.x);

        geoMesh.rotation.x += 0.002;
        geoMesh.rotation.y += 0.002;

        // Mouse/Gyro Parallax
        geoMesh.position.x += (targetX * 2 - geoMesh.position.x) * 0.05;
        geoMesh.position.y += (-targetY * 2 - geoMesh.position.y) * 0.05;

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

    animate();

    // Resize Handle
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// Initialize Three.js after DOM load
document.addEventListener('DOMContentLoaded', initThreeJS);
