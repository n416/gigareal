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
});

initTheme();


// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            // Offset for fixed header
            const headerOffset = 120; // Increased from 80 to prevent overlap
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });

            // Visual Feedback
            targetElement.classList.remove('highlight');
            void targetElement.offsetWidth; // Trigger reflow
            targetElement.classList.add('highlight');

            // Remove class after animation to allow re-triggering
            setTimeout(() => {
                targetElement.classList.remove('highlight');
            }, 1500);
        }
    });
});

// Back to Top Logic
const backToTopBtn = document.getElementById('back-to-top');

window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        backToTopBtn.classList.add('visible');
    } else {
        backToTopBtn.classList.remove('visible');
    }
});

backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});


// Dynamic Background Logic
window.addEventListener('scroll', () => {
    const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);

    // Move slightly based on scroll
    // x1: 10% -> 30%
    const x1 = 10 + (scrollPercent * 20);
    // y1: 20% -> 40%
    const y1 = 20 + (scrollPercent * 20);

    // x2: 90% -> 70%
    const x2 = 90 - (scrollPercent * 20);
    // y2: 80% -> 60%
    const y2 = 80 - (scrollPercent * 20);

    document.body.style.setProperty('--bg-pos-x1', `${x1}%`);
    document.body.style.setProperty('--bg-pos-y1', `${y1}%`);
    document.body.style.setProperty('--bg-pos-x2', `${x2}%`);
    document.body.style.setProperty('--bg-pos-y2', `${y2}%`);
});

// Typewriter Effect
const textToType = "AIが作る、ギガなリアル。";
const typewriterElement = document.getElementById('typewriter-text');
let charIndex = 0;

function typeWriter() {
    if (charIndex < textToType.length) {
        typewriterElement.textContent += textToType.charAt(charIndex);
        charIndex++;
        setTimeout(typeWriter, 100); // Typing speed
    } else {
        // Remove cursor blink after typing matches
        typewriterElement.style.borderRight = "none";
    }
}

// Start typing when page loads
window.addEventListener('load', typeWriter);
