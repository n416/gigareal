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
    let hasGyro = false;

    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    // Interaction State for Polygon
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let dragVelocity = { x: 0, y: 0 };
    let dragTargetRotation = { x: 0, y: 0 };
    let dragTargetColor = new THREE.Color();
    let dragColorHue = 0;

    // Pointer Events for Interaction
    document.addEventListener('pointerdown', (event) => {
        isDragging = true;
        previousMousePosition = { x: event.clientX, y: event.clientY };
    });

    document.addEventListener('pointermove', (event) => {
        if (isDragging) {
            const deltaMove = {
                x: event.clientX - previousMousePosition.x,
                y: event.clientY - previousMousePosition.y
            };

            // Calculate rotation based on drag
            dragVelocity.x = deltaMove.y * 0.005; // Vertical drag rotates around X axis
            dragVelocity.y = deltaMove.x * 0.005; // Horizontal drag rotates around Y axis

            // Update rotation target
            dragTargetRotation.x += dragVelocity.x;
            dragTargetRotation.y += dragVelocity.y;

            // Generate Color based on drag direction/angle
            // Angle in radians: Math.atan2(y, x)
            const angle = Math.atan2(deltaMove.y, deltaMove.x);
            // Map angle (-PI to PI) to Hue (0 to 1)
            // Start from current hue and shift based on movement intensity
            const speed = Math.sqrt(deltaMove.x ** 2 + deltaMove.y ** 2);
            dragColorHue = (dragColorHue + speed * 0.002) % 1;

            dragTargetColor.setHSL(dragColorHue, 0.7, 0.5);

            // Apply immediate feedback to object color
            geoMesh.material.color.lerp(dragTargetColor, 0.1);

            previousMousePosition = { x: event.clientX, y: event.clientY };
        } else {
            // Standard mouse tracking for parallax when not dragging
            mouseX = (event.clientX - windowHalfX);
            mouseY = (event.clientY - windowHalfY);

            if (!hasGyro) {
                gravityX = (mouseX / windowHalfX) * gravityStrength;
                gravityY = -(mouseY / windowHalfY) * gravityStrength;
            }
        }
    });

    document.addEventListener('pointerup', () => {
        isDragging = false;
    });

    // Physics State
    const velocities = new Float32Array(particlesCount * 2); // vx, vy for each particle
    const gravityStrength = 0.05;
    let gravityX = 0;
    let gravityY = 0;

    // Gyroscope Permission Handling
    const gyroBtnContainer = document.getElementById('gyro-controls');
    const gyroBtn = document.getElementById('gyro-btn');

    function startGyro() {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            // iOS 13+
            DeviceOrientationEvent.requestPermission()
                .then(response => {
                    if (response === 'granted') {
                        gyroBtnContainer.classList.add('hidden');
                        window.addEventListener('deviceorientation', handleOrientation);
                    } else {
                        alert('センサーの許可が必要です。');
                    }
                })
                .catch(console.error);
        } else {
            // Non-iOS or older devices
            window.addEventListener('deviceorientation', handleOrientation);
            gyroBtnContainer.classList.add('hidden');
        }
    }

    // Check if we need to show the button
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        gyroBtnContainer.classList.remove('hidden');
        gyroBtn.addEventListener('click', startGyro);
    } else {
        // Try to start immediately for non-iOS
        window.addEventListener('deviceorientation', handleOrientation);
    }

    // Initialize velocities
    for (let i = 0; i < particlesCount; i++) {
        velocities[i * 2] = (Math.random() - 0.5) * 0.02; // vx
        velocities[i * 2 + 1] = (Math.random() - 0.5) * 0.02; // vy
    }

    function handleOrientation(event) {
        if (event.beta === null || event.gamma === null) return;

        hasGyro = true;

        // Beta: front-to-back tilt [-180, 180]
        // Shift neutral point to vertical (90 degrees)
        const neutralBeta = 90;
        const currentBeta = event.beta;

        // Calculate tilt relative to vertical
        // If holding upright (90), tilt is 0.
        // If tilting back (e.g., 60), tilt is -30. Gravity should be negative (fall down).
        let tiltBeta = currentBeta - neutralBeta;

        // Gamma: left-to-right tilt [-90, 90] -> X gravity

        // Clamp values to avoid extreme speeds
        const maxTilt = 45;
        const clampedBeta = Math.max(-maxTilt, Math.min(maxTilt, tiltBeta));
        const clampedGamma = Math.max(-maxTilt, Math.min(maxTilt, event.gamma));

        gravityX = (clampedGamma / maxTilt) * gravityStrength;
        gravityY = (clampedBeta / maxTilt) * gravityStrength;

        // Update parallax target for geometric shape
        if (!isDragging) {
            targetX = clampedGamma * 0.05;
            targetY = clampedBeta * 0.05;
        }
    }

    // Animation Loop
    const clock = new THREE.Clock();

    function animate() {
        const positions = particlesGeometry.attributes.position.array;

        // Update Physics
        for (let i = 0; i < particlesCount; i++) {
            const i3 = i * 3;
            const i2 = i * 2;

            // Apply gravity to velocity
            velocities[i2] += gravityX * 0.01; // vx
            velocities[i2 + 1] += gravityY * 0.01; // vy

            // Apply friction/drag
            velocities[i2] *= 0.98;
            velocities[i2 + 1] *= 0.98;

            // Update position
            positions[i3] += velocities[i2];     // x
            positions[i3 + 1] += velocities[i2 + 1]; // y

            // Add slight ambient movement
            positions[i3] += Math.sin(clock.getElapsedTime() * 0.5 + i) * 0.002;

            // Dynamic Bounds Calculation based on Camera FOV
            const particleZ = positions[i3 + 2] || 0;
            const dist = camera.position.z - particleZ;
            const vHeight = 2 * dist * Math.tan((camera.fov * Math.PI / 180) / 2);
            const vWidth = vHeight * camera.aspect;

            // Add a small buffer to avoid popping
            const borderX = vWidth / 2 + 1;
            const borderY = vHeight / 2 + 1;

            // Boundary Wrap
            if (positions[i3] > borderX) {
                positions[i3] = -borderX;
            }
            if (positions[i3] < -borderX) {
                positions[i3] = borderX;
            }

            if (positions[i3 + 1] > borderY) {
                positions[i3 + 1] = -borderY;
            }
            if (positions[i3 + 1] < -borderY) {
                positions[i3 + 1] = borderY;
            }
        }

        particlesGeometry.attributes.position.needsUpdate = true;

        if (isDragging) {
            // Apply drag velocity with momentum
            geoMesh.rotation.x += dragVelocity.x;
            geoMesh.rotation.y += dragVelocity.y;

            // Decay drag velocity (friction)
            dragVelocity.x *= 0.95;
            dragVelocity.y *= 0.95;
        } else {
            // Standard behavior when not dragging (gyro or mouse parallax)
            if (!hasGyro) {
                targetX = mouseX * 0.001;
                targetY = mouseY * 0.001;
            }

            geoMesh.rotation.x += 0.002;
            geoMesh.rotation.y += 0.002;

            // Lerp geometry position
            geoMesh.position.x += (targetX * 2 - geoMesh.position.x) * 0.05;
            geoMesh.position.y += (-targetY * 2 - geoMesh.position.y) * 0.05;

            // Restrict movement to visible screen area
            const dist = camera.position.z; // geoMesh is at z=0
            const vHeight = 2 * dist * Math.tan((camera.fov * Math.PI / 180) / 2);
            const vWidth = vHeight * camera.aspect;
            const radius = 1.5; // Poly radius
            // Safe margin prevents the object from touching the very edge
            const safeMargin = radius + 0.5;

            // Clamp Y
            const limitY = (vHeight / 2) - safeMargin;
            if (limitY > 0) {
                geoMesh.position.y = Math.max(-limitY, Math.min(limitY, geoMesh.position.y));
            } else {
                geoMesh.position.y = 0;
            }

            // Clamp X
            const limitX = (vWidth / 2) - safeMargin;
            if (limitX > 0) {
                geoMesh.position.x = Math.max(-limitX, Math.min(limitX, geoMesh.position.x));
            } else {
                geoMesh.position.x = 0;
            }
        }

        // Always gently revert color to theme default if not dragging (optional, interaction feel)
        if (!isDragging) {
            const defaultColorHex = body.getAttribute('data-theme') === 'dark' ? 0x6FBDCA : 0x183A8A;
            const defaultColor = new THREE.Color(defaultColorHex);
            geoMesh.material.color.lerp(defaultColor, 0.05);
        }

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
