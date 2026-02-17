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

// Logo Click -> Scroll to Top
document.querySelector('.logo-link').addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
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
// Start typing when page loads
window.addEventListener('load', typeWriter);


// Approach Section - Scroll Triggered Typewriter (HTML Aware)
document.addEventListener('DOMContentLoaded', () => {
    const approachParagraphs = document.querySelectorAll('.approach-card p');

    // Store original HTML and clear content/height preservation
    const textMap = new Map();

    approachParagraphs.forEach((p, index) => {
        // Save original height to prevent layout shift
        const height = p.offsetHeight;
        p.style.minHeight = `${height}px`;

        textMap.set(p, p.innerHTML);
        p.innerHTML = '';
        p.classList.add('typing-cursor'); // Add cursor
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const htmlContent = textMap.get(target);

                if (htmlContent && !target.dataset.typed) {
                    target.dataset.typed = "true"; // Flag to prevent re-typing
                    typeWriterHTML(target, htmlContent, 30); // 30ms speed
                }
                observer.unobserve(target);
            }
        });
    }, { threshold: 0.2 }); // Trigger when 20% visible

    approachParagraphs.forEach(p => observer.observe(p));
});

function typeWriterHTML(element, html, speed) {
    let i = 0;
    let currentHTML = '';

    function type() {
        if (i < html.length) {
            const char = html.charAt(i);

            if (char === '<') {
                // Find closing '>'
                const closingIndex = html.indexOf('>', i);
                if (closingIndex !== -1) {
                    currentHTML += html.substring(i, closingIndex + 1);
                    i = closingIndex + 1;
                } else {
                    currentHTML += char;
                    i++;
                }
            } else {
                currentHTML += char;
                i++;
            }

            element.innerHTML = currentHTML;
            setTimeout(type, speed);
        } else {
            // Remove cursor after finishing
            element.classList.remove('typing-cursor');
        }
    }

    type();
}
