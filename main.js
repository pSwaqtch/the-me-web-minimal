// Gravity Grid Animation with Customizable Parameters
// This script creates a grid animation that simulates a gravitational effect based on mouse movement.
const canvas = document.getElementById("gravityGrid");
const ctx = canvas.getContext("2d");
let width, height, rows, cols;
let spacing = 20;
let warpStrength = 9800;
let color = "var(--grid-color)";
let originalPoints = [];
let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let maxDistance = 100;
let maxDisplacement = 125;
let isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints;

// Event listeners
canvas.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

// Touch support
canvas.addEventListener("touchmove", (e) => {
    if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        e.preventDefault();
    }
});

window.addEventListener("resize", resizeCanvas);

// Control functions
function updateSpacing(value) {
    spacing = parseInt(value);
    rebuildGrid();
    logValues();
}

function updateWarpStrength(value) {
    warpStrength = parseInt(value);
    logValues();
}

function updateMaxDistance(value) {
    maxDistance = parseInt(value);
    logValues();
}

function updateMaxDisplacement(value) {
    maxDisplacement = parseInt(value);
    logValues();
}

function logValues() {
    console.table({
        'Grid Spacing': spacing,
        'Gravity Force': warpStrength,
        'Max Distance': maxDistance,
        'Max Displacement': maxDisplacement
    });
}

// Initialize values in the input fields
document.getElementById("spacingInput").value = spacing;
document.getElementById("warpInput").value = warpStrength;
document.getElementById("maxDistanceInput").value = maxDistance;
document.getElementById("maxDisplacementInput").value = maxDisplacement;

// on change in slider values or click over that div container console log the value as table
document.querySelectorAll('.controls input[type="range"]').forEach(input => {
    input.addEventListener('input', () => {
        console.table({
            'Grid Spacing': spacing,
            'Gravity Force': warpStrength,
            'Max Distance': maxDistance,
            'Max Displacement': maxDisplacement
        });
    });
});

// Core functions
function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    rebuildGrid();
}

function rebuildGrid() {
    // Reset dimensions
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    
    // Calculate grid properties
    rows = Math.ceil(height / spacing) + 1;
    cols = Math.ceil(width / spacing) + 1;
    
    // Build points array
    originalPoints = [];
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            originalPoints.push({ x: x * spacing, y: y * spacing });
        }
    }
}

function getDistortedPoint(point) {
    const dx = point.x - mouse.x;
    const dy = point.y - mouse.y;
    const distanceSquared = dx * dx + dy * dy;
    const distance = Math.sqrt(distanceSquared);

    if (distance < maxDistance) {
        const angle = Math.atan2(dy, dx);
        const force = (1 - distance / maxDistance) * maxDisplacement * (warpStrength / 10000); // Scale by warpStrength
        return {
            x: point.x - Math.cos(angle) * force,
            y: point.y - Math.sin(angle) * force
        };
    }

    return point;
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid-color');
    ctx.lineWidth = 1;
    
    // Draw all horizontal lines (including last row)
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols - 1; x++) {
            const i = y * cols + x;
            const p1 = getDistortedPoint(originalPoints[i]);
            const p2 = getDistortedPoint(originalPoints[i + 1]);
            
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }
    }
    
    // Draw all vertical lines (including last column)
    for (let y = 0; y < rows - 1; y++) {
        for (let x = 0; x < cols; x++) {
            const i = y * cols + x;
            const p1 = getDistortedPoint(originalPoints[i]);
            const p3 = getDistortedPoint(originalPoints[i + cols]);
            
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p3.x, p3.y);
            ctx.stroke();
        }
    }
    
    requestAnimationFrame(animate);
}

// Theme Toggle
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    body.setAttribute('data-theme', newTheme);
    
    // Update icon
    const themeIcon = document.querySelector('.theme-toggle i');
    if (newTheme === 'light') {
        themeIcon.className = 'fas fa-moon';
    } else {
        themeIcon.className = 'fas fa-sun';
    }
}

// Tooltip
document.querySelectorAll('.link').forEach(link => {
    link.addEventListener('mouseenter', (e) => {
        const tooltip = document.getElementById('tooltip');
        tooltip.style.display = 'block';
        tooltip.style.left = `${e.pageX}px`;
        tooltip.style.top = `${e.pageY - 30}px`;
        tooltip.textContent = link.title;
    });
    
    link.addEventListener('mouseleave', () => {
        document.getElementById('tooltip').style.display = 'none';
    });
    
    link.addEventListener('mousemove', (e) => {
        const tooltip = document.getElementById('tooltip');
        tooltip.style.left = `${e.pageX}px`;
        tooltip.style.top = `${e.pageY - 30}px`;
    });
});

// Initialize and start
resizeCanvas();
animate();

// filepath: q:\website\krupal-pswaqtch-on-web\index.html
document.addEventListener("DOMContentLoaded", async () => {
try {
    // Fetch data from data.json
    const response = await fetch('data.json');
    const data = await response.json();

    // Update name and title
    const nameElement = document.querySelector('h1');
    const subtitleElement = document.querySelector('.subtitle');
    nameElement.textContent = data.personalInfo.name;
    subtitleElement.textContent = data.personalInfo.title;

    // Populate social links
    const socialLinks = {
        twitter: "fab fa-x-twitter",
        mastodon: "fab fa-mastodon",
        reddit: "fab fa-reddit",
        instagram: "fab fa-instagram",
        linkedin: "fab fa-linkedin",
        email: "fas fa-envelope"
    };

    const linksContainer = document.querySelector('.links');
    const socialData = data.contact.social;

    Object.entries(socialData).forEach(([key, url]) => {
        if (key != "reddit" && key != "instagram" && key != "linkedin") {
            const link = document.createElement('a');
            link.href = url;
            link.className = 'link';
            link.title = key.charAt(0).toUpperCase() + key.slice(1);
            link.innerHTML = `<i class="${socialLinks[key] || 'fas fa-link'}"></i>`;
            linksContainer.appendChild(link);
        }
    });

} catch (error) {
    console.error('Error loading data:', error);
}
});

function syncSpacing(value) {
spacing = parseInt(value);
document.getElementById("spacingRange").value = spacing;
document.getElementById("spacingInput").value = spacing;
rebuildGrid();
}

function syncWarpStrength(value) {
warpStrength = parseInt(value);
document.getElementById("warpRange").value = warpStrength;
document.getElementById("warpInput").value = warpStrength;
}

function syncMaxDistance(value) {
maxDistance = parseInt(value);
document.getElementById("maxDistanceRange").value = maxDistance;
document.getElementById("maxDistanceInput").value = maxDistance;
}

function syncMaxDisplacement(value) {
maxDisplacement = parseInt(value);
document.getElementById("maxDisplacementRange").value = maxDisplacement;
document.getElementById("maxDisplacementInput").value = maxDisplacement;
}

// Initialize values in the input fields and sliders
document.getElementById("spacingRange").value = spacing;
document.getElementById("spacingInput").value = spacing;
document.getElementById("warpRange").value = warpStrength;
document.getElementById("warpInput").value = warpStrength;
document.getElementById("maxDistanceRange").value = maxDistance;
document.getElementById("maxDistanceInput").value = maxDistance;
document.getElementById("maxDisplacementRange").value = maxDisplacement;
document.getElementById("maxDisplacementInput").value = maxDisplacement;

function toggleControls() {
const controls = document.getElementById("controls");
controls.style.display = controls.style.display === "none" ? "block" : "none";
}